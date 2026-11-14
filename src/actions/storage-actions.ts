"use server";

import { requireTenantContext } from "@/lib/security/tenant";
import { R2StorageService, MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from "@/lib/storage/r2-client";
import { formatErrorResponse } from "@/lib/security/errors";

export async function requestPresignedUploadAction(input: {
  filename: string;
  contentType: string;
  folder?: "receipts" | "invoices" | "general";
}) {
  try {
    const ctx = await requireTenantContext();
    const folder = input.folder || "receipts";

    const presigned = await R2StorageService.generatePresignedUploadUrl({
      businessId: ctx.businessId,
      folder,
      filename: input.filename,
      contentType: input.contentType,
    });

    return {
      success: true,
      ...presigned,
    };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function uploadAttachmentAction(formData: FormData) {
  try {
    const ctx = await requireTenantContext();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as "receipts" | "invoices" | "general") || "receipts";

    if (!file) {
      throw new Error("No file uploaded");
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error("File exceeds 5MB limit");
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
      throw new Error(`Unsupported file type: ${file.type}. Allowed: JPG, PNG, WEBP, PDF.`);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await R2StorageService.uploadBuffer({
      businessId: ctx.businessId,
      folder,
      filename: file.name,
      buffer,
      contentType: file.type,
    });

    return {
      success: true,
      publicUrl: result.publicUrl,
      fileKey: result.fileKey,
      isMock: result.isMock,
    };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

