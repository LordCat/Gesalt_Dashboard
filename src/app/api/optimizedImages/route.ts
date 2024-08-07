import { NextRequest, NextResponse } from "next/server";
import sharp from 'sharp';
import path from 'path';
import { readFile } from 'fs/promises';

export async function GET(request: NextRequest) {
    const imagePath = request.nextUrl.searchParams.get('imagePath');

    if (!imagePath) {
        return NextResponse.json({ error: 'Invalid image path' }, { status: 400 });
    }

    const fullPath = path.join(process.cwd(), 'public', imagePath);

    try {
        const fileBuffer = await readFile(fullPath);
        const metadata = await sharp(fileBuffer).metadata();

        // Optimize the image while keeping its original format
        const optimizedImage = await sharp(fileBuffer)
            .resize(metadata.width) // Resize if needed
            .toBuffer();

        return new NextResponse(optimizedImage, {
            headers: {
                'Content-Type': `image/${metadata.format}`,
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });
    } catch (error) {
        console.error('Error optimizing image:', error);
        return NextResponse.json({ error: 'Error optimizing image' }, { status: 500 });
    }
}