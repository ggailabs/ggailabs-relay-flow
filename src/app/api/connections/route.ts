import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const createConnectionSchema = z.object({
  flowId: z.string(),
  sourceId: z.string(),
  targetId: z.string(),
  config: z.object({}).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createConnectionSchema.parse(body);

    // Check if connection already exists
    const existingConnection = await db.connection.findUnique({
      where: {
        flowId_sourceId_targetId: {
          flowId: validatedData.flowId,
          sourceId: validatedData.sourceId,
          targetId: validatedData.targetId,
        },
      },
    });

    if (existingConnection) {
      return NextResponse.json(
        { error: "Connection already exists" },
        { status: 400 }
      );
    }

    const connection = await db.connection.create({
      data: {
        flowId: validatedData.flowId,
        sourceId: validatedData.sourceId,
        targetId: validatedData.targetId,
        config: validatedData.config || {},
      },
      include: {
        sourceNode: true,
        targetNode: true,
      },
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating connection:", error);
    return NextResponse.json(
      { error: "Failed to create connection" },
      { status: 500 }
    );
  }
}