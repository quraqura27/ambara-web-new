import { NextRequest, NextResponse } from "next/server";
import { r2, BUCKET_NAME } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileKey = searchParams.get("file");

    if (!fileKey) {
      return new NextResponse("Missing file parameter", { status: 400 });
    }

    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    const response = await r2.send(getCommand);
    const stream = response.Body?.transformToWebStream();

    if (!stream) {
      return new NextResponse("File body empty", { status: 404 });
    }

    return new NextResponse(stream, {
      headers: {
        "Content-Type": response.ContentType || "application/pdf",
        "Content-Disposition": `inline; filename="${fileKey.split("/").pop()}"`,
      },
    });
  } catch (error: any) {
    console.error("PDF Proxy Error:", error);
    return new NextResponse(error.message || "Failed to fetch PDF", { status: 500 });
  }
}
