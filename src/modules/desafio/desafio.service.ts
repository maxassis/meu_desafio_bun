import { randomUUID } from "crypto";
import {
  CreateDesafioInput,
  CreateDesafioResponse,
  PurchaseDataSchema,
} from "./schema/create.schema";
import { GetDesafioResponse } from "./schema/get.schema";
import { prisma } from "../../shared/db/prisma";
import { r2Service } from "../../lib/storage/r2";
import { cacheService } from "../../lib/cache/redis";

const CACHE_TTL_SECONDS = 300;

export async function createDesafio(
  input: CreateDesafioInput,
  files: File[],
): Promise<CreateDesafioResponse> {
  const { name, location, distance, active, priceId, purchaseData } = input;
  const bucketName = "desafios";

  const existingDesafio = await prisma.desafio.findFirst({
    where: { name },
  });

  if (existingDesafio) {
    throw new Error("Name already exists");
  }

  const parsedLocation = Array.isArray(location)
    ? location
    : (JSON.parse(location) as Array<{
        latitude: number;
        longitude: number;
      }>);
  const parsedPurchaseData = PurchaseDataSchema.parse(
    typeof purchaseData === "string" ? JSON.parse(purchaseData) : purchaseData,
  );
  const parsedDistance = Number(distance);

  const imageUrls: string[] = [];
  const uploadedFileNames: string[] = [];

  if (files && files.length > 0) {
    for (const file of files) {
      try {
        const fileName = `${randomUUID()}-${file.name}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const publicUrl = await r2Service.uploadFile(
          fileName,
          buffer,
          file.type,
          bucketName,
        );

        uploadedFileNames.push(fileName);
        imageUrls.push(publicUrl);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        if (errorMessage.includes("R2 não configurado")) {
          throw new Error("Upload não disponível: R2 não configurado no servidor");
        }

        console.error("Error processing file:", file.name, error);

        for (const fileName of uploadedFileNames) {
          try {
            await r2Service.deleteFile(fileName, bucketName);
          } catch {
            console.error("Error cleaning up image:", fileName);
          }
        }

        throw new Error(`Error processing file ${file.name}: ${errorMessage}`);
      }
    }
  }

  const updatedPurchaseData = {
    ...parsedPurchaseData,
    distance: parsedDistance,
    images: imageUrls,
  };

  const mainPhoto = imageUrls.length > 0 ? imageUrls[0] : "";

  try {
    const result = await prisma.desafio.create({
      data: {
        name,
        location: parsedLocation,
        distance: parsedDistance,
        photo: mainPhoto,
        purchaseData: updatedPurchaseData,
        priceId,
        active,
      },
    });

    return {
      message: "Desafio created successfully",
      id: result.id,
      imagesUploaded: imageUrls.length,
      mainPhoto,
      imageUrls,
    };
  } catch (error) {
    console.error("Database error:", error);

    if (uploadedFileNames.length > 0) {
      console.log("Attempting to cleanup uploaded images...");
      for (const fileName of uploadedFileNames) {
        try {
          await r2Service.deleteFile(fileName, bucketName);
        } catch {
          console.error("Error cleaning up image:", fileName);
        }
      }
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown database error";
    throw new Error(`Error creating desafio in database: ${errorMessage}`);
  }
}

export async function getDesafio(idDesafio: string): Promise<GetDesafioResponse> {
  const cacheKey = `desafio:${idDesafio}`;

  const cachedDesafio = await cacheService.get<GetDesafioResponse>(cacheKey);
  if (cachedDesafio) {
    return cachedDesafio;
  }

  const desafio = await prisma.desafio.findUnique({
    where: { id: idDesafio },
    include: {
      inscriptions: {
        where: { completed: false },
        include: {
          user: {
            include: {
              userData: {
                select: { avatarFilename: true },
              },
            },
          },
        },
      },
    },
  });

  if (!desafio) {
    throw new Error(`Desafio with ID ${idDesafio} not found`);
  }

  const inscriptionsWithStats = await Promise.all(
    desafio.inscriptions.map(async (inscription) => {
      const tasks = await prisma.task.findMany({
        where: { inscriptionId: inscription.id },
        select: {
          createdAt: true,
          calories: true,
          distanceKm: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const lastTaskDate = tasks.length > 0 ? tasks[0].createdAt : null;

      const totalCalories = tasks.reduce(
        (sum, task) => sum + (task.calories || 0),
        0,
      );

      const totalDistanceKm = tasks.reduce(
        (sum, task) => sum + (Number(task.distanceKm) || 0),
        0,
      );

      return {
        user: {
          id: inscription.user.id,
          name: inscription.user.name,
          avatarFilename: inscription.user.userData?.avatarFilename ?? null,
        },
        progress: inscription.progress,
        totalTasks: tasks.length,
        totalCalories,
        totalDistanceKm,
        lastTaskDate,
      };
    }),
  );

  const result: GetDesafioResponse = {
    id: desafio.id,
    name: desafio.name,
    location: desafio.location,
    distance: desafio.distance,
    photo: desafio.photo,
    inscriptions: inscriptionsWithStats,
  };

  await cacheService.set(cacheKey, result, CACHE_TTL_SECONDS);

  return result;
}