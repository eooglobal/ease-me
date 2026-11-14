import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface PresignedUploadResult {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
  isMock: boolean;
}

export class R2StorageService {
  private static client: S3Client | null = null;

  static isConfigured(): boolean {
    return Boolean(
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
    );
  }

  static getClient(): S3Client {
    if (!this.client) {
      const accountId = process.env.R2_ACCOUNT_ID || "mock-account";
      const accessKeyId = process.env.R2_ACCESS_KEY_ID || "mock-key";
      const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "mock-secret";

      this.client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
    return this.client;
  }

  static sanitizeFilename(filename: string): string {
    const base = filename.split(/[/\\]/).pop() || "file";
    return base
      .toLowerCase()
      .replace(/\.{2,}/g, ".")
      .replace(/[^a-z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_");
  }

  /**
   * Generates a tenant-isolated, secure S3 presigned PUT URL
   */
  static async generatePresignedUploadUrl(params: {
    businessId: string;
    folder: "receipts" | "invoices" | "general";
    filename: string;
    contentType: string;
  }): Promise<PresignedUploadResult> {
    const { businessId, folder, filename, contentType } = params;

    if (!ALLOWED_MIME_TYPES.includes(contentType as any)) {
      throw new Error(
        `Invalid file format: ${contentType}. Allowed formats: JPG, PNG, WEBP, PDF.`
      );
    }

    const safeName = this.sanitizeFilename(filename);
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const fileKey = `${businessId}/${folder}/${uniqueSuffix}-${safeName}`;
    const bucketName = process.env.R2_BUCKET_NAME || "ease-me-storage";
    const publicDomain =
      process.env.R2_PUBLIC_DOMAIN ||
      `https://pub-${process.env.R2_ACCOUNT_ID || "dev"}.r2.dev`;

    const publicUrl = `${publicDomain.replace(/\/$/, "")}/${fileKey}`;

    if (!this.isConfigured()) {
      // Development Sandbox / Mock fallback
      return {
        uploadUrl: `/api/mock-upload?key=${encodeURIComponent(fileKey)}`,
        fileKey,
        publicUrl: `https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80`,
        isMock: true,
      };
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.getClient(), command, {
      expiresIn: 300, // 5 minutes
    });

    return {
      uploadUrl,
      fileKey,
      publicUrl,
      isMock: false,
    };
  }

  /**
   * Direct server-side upload buffer helper (e.g. for server-side generated receipts/PDFs)
   */
  static async uploadBuffer(params: {
    businessId: string;
    folder: "receipts" | "invoices" | "general";
    filename: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<{ fileKey: string; publicUrl: string; isMock: boolean }> {
    const { businessId, folder, filename, buffer, contentType } = params;

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size exceeds maximum limit of 5 MB.`);
    }

    if (!ALLOWED_MIME_TYPES.includes(contentType as any)) {
      throw new Error(`Invalid file type: ${contentType}`);
    }

    const safeName = this.sanitizeFilename(filename);
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const fileKey = `${businessId}/${folder}/${uniqueSuffix}-${safeName}`;
    const bucketName = process.env.R2_BUCKET_NAME || "ease-me-storage";
    const publicDomain =
      process.env.R2_PUBLIC_DOMAIN ||
      `https://pub-${process.env.R2_ACCOUNT_ID || "dev"}.r2.dev`;
    const publicUrl = `${publicDomain.replace(/\/$/, "")}/${fileKey}`;

    if (!this.isConfigured()) {
      return {
        fileKey,
        publicUrl: `data:${contentType};base64,${buffer.toString("base64")}`,
        isMock: true,
      };
    }

    const client = this.getClient();
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return {
      fileKey,
      publicUrl,
      isMock: false,
    };
  }
}
