import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const createNodeSchema = z.object({
  flowId: z.string(),
  type: z.enum(["trigger", "action", "condition", "delay", "webhook", "transform", "filter"]),
  title: z.string().min(1, "Title is required"),
  positionX: z.number(),
  positionY: z.number(),
  config: z.object({}).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createNodeSchema.parse(body);

    const node = await db.node.create({
      data: {
        flowId: validatedData.flowId,
        type: validatedData.type,
        title: validatedData.title,
        positionX: validatedData.positionX,
        positionY: validatedData.positionY,
        config: validatedData.config || {},
      },
      include: {
        sourceConnections: true,
        targetConnections: true,
      },
    });

    return NextResponse.json(node, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating node:", error);
    return NextResponse.json(
      { error: "Failed to create node" },
      { status: 500 }
    );
  }
}