import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

interface CloudinaryUploadResult {
    public_id: string;
    bytes: number;
    duration?: number;
    [key: string]: any;
}

export async function POST(request: NextRequest) {
    const { userId } = auth();

    if (!userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {

        if (
            !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
        ) {
            return NextResponse.json({ message: "Cloudinary not configured" }, { status: 500 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const originalSize = formData.get('originalSize') as string;

        if (!file) {
            return NextResponse.json({ message: "No file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: "video-uploads",
                resource_type: "video",
                transformation: [
                    { quality: "auto", fetch_format: "mp4" },
                ]
            },
                (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    else resolve(result as CloudinaryUploadResult);
                }
            )
            uploadStream.end(buffer);
        })
        const video = await prisma.video.create({
            data: {
                title,
                description,
                originalSize,
                publicId: result.public_id,
                duration: result.duration || 0,
                compressedSize: String(result.bytes),
            }
        })
        return NextResponse.json(video);

    } catch (error) {
        console.log("error in image upload route", error);
        return NextResponse.json({ message: "error in image upload route" }, { status: 500 });
    }

}