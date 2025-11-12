import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'
import { logAuditSafe } from '@/lib/observability-helpers'
import { z } from 'zod'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
})

const UpdatePaymentMethodSchema = z.object({
  setAsDefault: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export async function PATCH(
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
    const validated = UpdatePaymentMethodSchema.parse(body)

    // Verify payment method exists and belongs to user
    const paymentMethod = await prisma.userPaymentMethod.findFirst({
      where: {
        id,
        userId: session.user.id,
        tenantId,
      },
    })

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    // If setting as default, unset other defaults
    if (validated.setAsDefault) {
      await prisma.userPaymentMethod.updateMany({
        where: {
          userId: session.user.id,
          tenantId,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      })
    }

    // Update payment method
    const updateData: any = {}
    if (validated.setAsDefault !== undefined) {
      updateData.isDefault = validated.setAsDefault
    }
    if (validated.status !== undefined) {
      updateData.status = validated.status
    }

    const updatedPaymentMethod = await prisma.userPaymentMethod.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        type: true,
        isDefault: true,
        last4: true,
        brand: true,
        status: true,
        expiryMonth: true,
        expiryYear: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await logAuditSafe({
      action: 'payment_methods:update',
      details: {
        paymentMethodId: id,
        changes: Object.keys(updateData),
      },
    }).catch(() => {})

    return NextResponse.json(updatedPaymentMethod, { status: 200 })
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

    console.error('Payment method update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    // Verify payment method exists and belongs to user
    const paymentMethod = await prisma.userPaymentMethod.findFirst({
      where: {
        id,
        userId: session.user.id,
        tenantId,
      },
    })

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    // Delete from Stripe if available
    if (paymentMethod.paymentMethodId) {
      try {
        await stripe.paymentMethods.detach(paymentMethod.paymentMethodId)
      } catch (error) {
        // Log but don't fail if Stripe deletion fails
        console.error('Failed to detach payment method from Stripe:', error)
      }
    }

    // Delete from database
    await prisma.userPaymentMethod.delete({
      where: { id },
    })

    // If was default, set another as default if available
    if (paymentMethod.isDefault) {
      const nextDefault = await prisma.userPaymentMethod.findFirst({
        where: {
          userId: session.user.id,
          tenantId,
          status: 'ACTIVE',
        },
        orderBy: { createdAt: 'desc' },
      })

      if (nextDefault) {
        await prisma.userPaymentMethod.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        })
      }
    }

    await logAuditSafe({
      action: 'payment_methods:delete',
      details: {
        paymentMethodId: paymentMethod.paymentMethodId,
      },
    }).catch(() => {})

    return NextResponse.json(
      { success: true, message: 'Payment method deleted' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Payment method delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
