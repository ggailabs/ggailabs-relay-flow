import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const workflows = await db.workflow.findMany({
      include: {
        author: {
          select: { id: true, email: true, name: true }
        },
        steps: {
          orderBy: { order: 'asc' },
          include: {
            inputs: true,
            outputs: true
          }
        },
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 5
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip: offset,
      take: limit
    })

    const total = await db.workflow.count()

    return NextResponse.json({
      workflows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, trigger, config, authorId } = body

    if (!name || !trigger || !authorId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, trigger, authorId' },
        { status: 400 }
      )
    }

    const workflow = await db.workflow.create({
      data: {
        name,
        description,
        trigger,
        config: config || '{}',
        authorId
      },
      include: {
        author: {
          select: { id: true, email: true, name: true }
        },
        steps: {
          orderBy: { order: 'asc' },
          include: {
            inputs: true,
            outputs: true
          }
        }
      }
    })

    return NextResponse.json(workflow, { status: 201 })
  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    )
  }
}