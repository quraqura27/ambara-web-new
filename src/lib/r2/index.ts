import { S3Client } from "@aws-sdk/client-s3";

/**
 * CLOUDFLARE R2 CLIENT (Spec v3)
 * Optimized for high-retention document storage.
 */

if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_ENDPOINT) {
  throw new Error("Missing R2 configuration in environment variables.");
}

export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const BUCKET_NAME = process.env.R2_BUCKET_NAME || "ambara-artha-documents";
