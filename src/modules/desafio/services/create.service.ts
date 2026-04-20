import type {
  CreateDesafioInput,
  CreateDesafioResponse,
} from '../schema/create.schema'
import { randomUUID } from 'node:crypto'
import { r2Service } from '../../../lib/storage/r2'
import { prisma } from '../../../shared/db/prisma'
import {
  PurchaseDataSchema,
} from '../schema/create.schema'

export async function createDesafio(
  input: CreateDesafioInput,
  files: File[],
): Promise<CreateDesafioResponse> {
  const { name, location, distance, active, priceId, purchaseData } = input
  const bucketName = 'desafios'

  const existingDesafio = await prisma.desafio.findFirst({
    where: { name },
  })

  if (existingDesafio) {
    throw new Error('Name already exists')
  }

  const parsedLocation = Array.isArray(location)
    ? location
    : (JSON.parse(location) as Array<{
        latitude: number
        longitude: number
      }>)
  const parsedPurchaseData = PurchaseDataSchema.parse(
    typeof purchaseData === 'string' ? JSON.parse(purchaseData) : purchaseData,
  )
  const parsedDistance = Number(distance)

  const imageUrls: string[] = []
  const uploadedFileNames: string[] = []

  if (files && files.length > 0) {
    for (const file of files) {
      try {
        const fileName = `${randomUUID()}-${file.name}`
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const publicUrl = await r2Service.uploadFile(
          fileName,
          buffer,
          file.type,
          bucketName,
        )

        uploadedFileNames.push(fileName)
        imageUrls.push(publicUrl)
      }
      catch (error: unknown) {
        const errorMessage
          = error instanceof Error ? error.message : 'Unknown error'
        if (errorMessage.includes('R2 not configured')) {
          throw new Error('Upload is unavailable: R2 is not configured on the server')
        }

        console.error('Error processing file:', file.name, error)

        for (const fileName of uploadedFileNames) {
          try {
            await r2Service.deleteFile(fileName, bucketName)
          }
          catch {
            console.error('Error cleaning up image:', fileName)
          }
        }

        throw new Error(`Error processing file ${file.name}: ${errorMessage}`)
      }
    }
  }

  const updatedPurchaseData = {
    ...parsedPurchaseData,
    distance: parsedDistance,
    images: imageUrls,
  }

  const mainPhoto = imageUrls.length > 0 ? imageUrls[0] : ''

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
    })

    return {
      message: 'Challenge created successfully',
      id: result.id,
      imagesUploaded: imageUrls.length,
      mainPhoto,
      imageUrls,
    }
  }
  catch (error) {
    console.error('Database error:', error)

    if (uploadedFileNames.length > 0) {
      console.log('Attempting to cleanup uploaded images...')
      for (const fileName of uploadedFileNames) {
        try {
          await r2Service.deleteFile(fileName, bucketName)
        }
        catch {
          console.error('Error cleaning up image:', fileName)
        }
      }
    }

    const errorMessage
      = error instanceof Error ? error.message : 'Unknown database error'
    throw new Error(`Error creating desafio in database: ${errorMessage}`)
  }
}
