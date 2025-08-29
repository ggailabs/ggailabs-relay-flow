import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const createFlowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const flows = await db.flow.findMany({
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        nodes: true,
        connections: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(flows);
  } catch (error) {
    console.error("Error fetching flows:", error);
    return NextResponse.json(
      { error: "Failed to fetch flows" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createFlowSchema.parse(body);

    // For now, use a default user ID
    const defaultUserId = "default-user-id";

    const flow = await db.flow.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        authorId: defaultUserId,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        nodes: true,
        connections: true,
      },
    });

    return NextResponse.json(flow, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating flow:", error);
    return NextResponse.json(
      { error: "Failed to create flow" },
      { status: 500 }
    );
  }
}