import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const video = await prisma.video.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(video)
    } catch (error) {
        console.log("error in video get route", error)
        return NextResponse.json({ message: "error in video get route" },{status: 500})
    } finally {
        await prisma.$disconnect()
    }
}