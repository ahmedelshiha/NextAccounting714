import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'
import { logAuditSafe } from '@/lib/observability-helpers'
import { z } from 'zod'

const CreateCategorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  icon: z.string().max(50).optional(),
  published: z.boolean().default(true),
})

const CategoryFilterSchema = z.object({
  published: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'order', 'createdAt']).default('order').optional(),
})

type CreateCategoryInput = z.infer<typeof CreateCategorySchema>

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = await getTenantFromRequest(request)
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    // Parse filters
    const queryParams = Object.fromEntries(request.nextUrl.searchParams)
    const filters = CategoryFilterSchema.parse(queryParams)

    // Build where clause
    const where: any = { tenantId }

    if (filters.published !== undefined) {
      where.published = filters.published
    }

    // Fetch categories
    const categories = await prisma.knowledgeBaseCategory.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        order: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { articles: true },
        },
      },
      orderBy: {
        [filters.sortBy || 'order']: 'asc',
      },
    })

    return NextResponse.json(
      {
        categories: categories.map((cat) => ({
          ...cat,
          articleCount: cat._count.articles,
        })),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Knowledge Base categories list API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = await getTenantFromRequest(request)
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const body = await request.json()
    const validated = CreateCategorySchema.parse(body)

    // Generate slug from name
    const slug = validated.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Check for duplicate slug
    const existing = await prisma.knowledgeBaseCategory.findFirst({
      where: {
        tenantId,
        slug,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 409 }
      )
    }

    // Create category
    const category = await prisma.knowledgeBaseCategory.create({
      data: {
        ...validated,
        slug,
        tenantId,
        order: 0,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        order: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await logAuditSafe({
      action: 'knowledge_base:category:create',
      details: {
        categoryId: category.id,
        name: category.name,
      },
    }).catch(() => {})

    return NextResponse.json(category, { status: 201 })
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

    console.error('Knowledge Base category create API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
