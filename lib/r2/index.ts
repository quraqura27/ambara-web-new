import { S3Client } from "@aws-sdk/client-s3";

/**
 * CLOUDFLARE R2 CLIENT (Spec v3)
 * Optimized for high-retention document storage.
 */

if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_ENDPOINT) {
  console.warn("WARNING: Missing R2 configuration in environment variables. Uploads will fail.");
}

export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "missing",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "missing",
  },
});

export const BUCKET_NAME = process.env.R2_BUCKET_NAME || "ambara-artha-documents";
