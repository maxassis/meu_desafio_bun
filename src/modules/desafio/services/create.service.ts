import type {
  CreateDesafioInput,
  CreateDesafioResponse,
} from '../schema/create.schema'
import { randomUUID } from 'node:crypto'
import { r2Service } from '../../../lib/storage/r2'
import { prisma } from '../../../shared/db/prisma'
import { BadRequestError, DomainError } from '../../../shared/errors'

const MAX_DESAFIO_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const allowedImageTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const

function validateImageFile(file: File) {
  const extension = allowedImageTypes[file.type as keyof typeof allowedImageTypes]

  if (!extension) {
    throw new BadRequestError('File must be a JPEG, PNG, or WEBP image')
  }

  if (file.size > MAX_DESAFIO_IMAGE_SIZE_BYTES) {
    throw new BadRequestError('File size must be 5MB or less')
  }

  return extension
}

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
    throw new BadRequestError('Name already exists')
  }

  const parsedLocation = location
  const parsedDistance = distance

  const imageUrls: string[] = []
  const uploadedFileNames: string[] = []

  if (files && files.length > 0) {
    for (const file of files) {
      try {
        const extension = validateImageFile(file)
        const fileName = `${randomUUID()}.${extension}`
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
        if (error instanceof DomainError) {
          throw error
        }

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

        if (errorMessage.includes('File must') || errorMessage.includes('File size')) {
          throw new Error(errorMessage)
        }

        throw new Error(`Error processing file ${file.name}: ${errorMessage}`)
      }
    }
  }

  const updatedPurchaseData = {
    ...purchaseData,
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
