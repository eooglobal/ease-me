import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { R2StorageService, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "../r2-client";

describe("Cloudflare R2 Storage Service Unit Tests", () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...origEnv };
  });

  afterEach(() => {
    process.env = origEnv;
  });

  it("should define allowed MIME types and max size limit (5MB)", () => {
    expect(ALLOWED_MIME_TYPES).toContain("image/jpeg");
    expect(ALLOWED_MIME_TYPES).toContain("image/png");
    expect(ALLOWED_MIME_TYPES).toContain("image/webp");
    expect(ALLOWED_MIME_TYPES).toContain("application/pdf");
    expect(MAX_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024);
  });

  it("should sanitize filenames to prevent path traversal and unsafe characters", () => {
    const raw1 = "../../secrets/invoice#1 (final).PDF";
    const sanitized1 = R2StorageService.sanitizeFilename(raw1);
    expect(sanitized1).not.toContain("/");
    expect(sanitized1).not.toContain("..");
    expect(sanitized1).not.toContain("#");
    expect(sanitized1).not.toContain(" ");

    const raw2 = "receipt___generator---fuel.png";
    const sanitized2 = R2StorageService.sanitizeFilename(raw2);
    expect(sanitized2).toBe("receipt_generator---fuel.png");
  });

  it("should enforce tenant isolation in object keys", async () => {
    const businessId = "biz-corp-12345";
    const res = await R2StorageService.generatePresignedUploadUrl({
      businessId,
      folder: "receipts",
      filename: "petrol_slip.jpg",
      contentType: "image/jpeg",
    });

    expect(res.fileKey.startsWith(`${businessId}/receipts/`)).toBe(true);
    expect(res.fileKey).toContain("petrol_slip.jpg");
    expect(res.publicUrl).toBeDefined();
  });

  it("should reject disallowed MIME types", async () => {
    await expect(
      R2StorageService.generatePresignedUploadUrl({
        businessId: "biz-1",
        folder: "receipts",
        filename: "script.exe",
        contentType: "application/x-msdownload",
      })
    ).rejects.toThrow(/Invalid file format/i);

    await expect(
      R2StorageService.generatePresignedUploadUrl({
        businessId: "biz-1",
        folder: "receipts",
        filename: "test.html",
        contentType: "text/html",
      })
    ).rejects.toThrow(/Invalid file format/i);
  });

  it("should provide graceful sandbox fallback when R2 credentials are unset", async () => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET_NAME;

    expect(R2StorageService.isConfigured()).toBe(false);

    const res = await R2StorageService.generatePresignedUploadUrl({
      businessId: "tenant-dev-1",
      folder: "receipts",
      filename: "receipt.png",
      contentType: "image/png",
    });

    expect(res.isMock).toBe(true);
    expect(res.uploadUrl).toContain("/api/mock-upload");
  });

  it("should upload buffer directly and reject files over 5MB", async () => {
    const smallBuffer = Buffer.from("mock image content");
    const res = await R2StorageService.uploadBuffer({
      businessId: "tenant-dev-1",
      folder: "receipts",
      filename: "proof.jpg",
      buffer: smallBuffer,
      contentType: "image/jpeg",
    });

    expect(res.fileKey).toContain("tenant-dev-1/receipts/");
    expect(res.publicUrl).toBeDefined();

    // Oversized buffer: > 5MB
    const largeBuffer = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1024);
    await expect(
      R2StorageService.uploadBuffer({
        businessId: "tenant-dev-1",
        folder: "receipts",
        filename: "huge.jpg",
        buffer: largeBuffer,
        contentType: "image/jpeg",
      })
    ).rejects.toThrow(/exceeds maximum limit/i);
  });
});

