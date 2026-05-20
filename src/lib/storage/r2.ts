import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { ENV } from 'varlock/env'

class CloudflareR2Service {
  private s3Client: S3Client | null = null
  private bucketUrlMap: Record<string, string> = {
    avatars: '',
    desafios: '',
  }

  private initialize() {
    if (!ENV.R2_ACCOUNT_ID || !ENV.R2_ACCESS_KEY_ID || !ENV.R2_SECRET_ACCESS_KEY) {
      throw new Error(
        'R2 not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY',
      )
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${ENV.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: ENV.R2_ACCESS_KEY_ID,
        secretAccessKey: ENV.R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    })

    this.bucketUrlMap = {
      avatars: ENV.R2_PUBLIC_URL_AVATARS || '',
      desafios: ENV.R2_PUBLIC_URL_DESAFIOS || '',
    }
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
    bucket: string,
  ): Promise<string> {
    if (!this.s3Client) {
      this.initialize()
    }

    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })

      await this.s3Client!.send(command)
      return this.getPublicUrl(key, bucket)
    }
    catch (error: unknown) {
      const errorMessage
        = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error uploading to R2:', {
        key,
        bucket,
        error: errorMessage,
      })
      throw new Error(`Upload failed: ${errorMessage}`)
    }
  }

  async deleteFile(key: string, bucket: string): Promise<void> {
    if (!this.s3Client) {
      this.initialize()
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })

      await this.s3Client!.send(command)
    }
    catch (error: unknown) {
      const errorMessage
        = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error deleting file from R2:', {
        key,
        bucket,
        error: errorMessage,
      })
      throw new Error(`Failed to delete file: ${errorMessage}`)
    }
  }

  getPublicUrl(key: string, bucket: string): string {
    const bucketUrl = this.bucketUrlMap[bucket]

    if (bucketUrl) {
      return `${bucketUrl}/${key}`
    }

    if (ENV.R2_ACCOUNT_ID) {
      return `https://${bucket}.${ENV.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`
    }

    return key
  }
}

export const r2Service = new CloudflareR2Service()
