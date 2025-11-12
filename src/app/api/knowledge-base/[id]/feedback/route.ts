import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'
import { z } from 'zod'

const FeedbackSchema = z.object({
  type: z.enum(['helpful', 'not_helpful']),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = await getTenantFromRequest(request)
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const { id } = params
    const body = await request.json()
    const validated = FeedbackSchema.parse(body)

    // Verify article exists and belongs to tenant
    const article = await prisma.knowledgeBaseArticle.findFirst({
      where: { id, tenantId },
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Update feedback count
    if (validated.type === 'helpful') {
      await prisma.knowledgeBaseArticle.update({
        where: { id },
        data: {
          helpfulCount: {
            increment: 1,
          },
        },
      })
    } else {
      await prisma.knowledgeBaseArticle.update({
        where: { id },
        data: {
          notHelpfulCount: {
            increment: 1,
          },
        },
      })
    }

    return NextResponse.json(
      {
        success: true,
        message: `Feedback recorded as ${validated.type}`,
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('Knowledge Base feedback API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
