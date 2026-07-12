import { S3Client } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

function requiredEnvironmentValue(name: "R2_ACCESS_KEY_ID" | "R2_BUCKET_NAME" | "R2_ENDPOINT" | "R2_SECRET_ACCESS_KEY") {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for document storage.`);
  return value;
}

export function getR2Client() {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: requiredEnvironmentValue("R2_ENDPOINT"),
      credentials: {
        accessKeyId: requiredEnvironmentValue("R2_ACCESS_KEY_ID"),
        secretAccessKey: requiredEnvironmentValue("R2_SECRET_ACCESS_KEY"),
      },
    });
  }
  return client;
}

export function getR2BucketName() {
  return requiredEnvironmentValue("R2_BUCKET_NAME");
}
