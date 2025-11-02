'use client'

import React, { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { AlertCircle, Loader2 } from 'lucide-react'

interface ClientFormData {
  name: string
  email: string
  phone?: string
  company?: string
  tier: 'INDIVIDUAL' | 'SMB' | 'ENTERPRISE'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  address?: string
  city?: string
  country?: string
  notes?: string
}

interface ClientFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (clientId: string) => void
  mode?: 'create' | 'edit'
  initialData?: Partial<ClientFormData & { id: string }>
  title?: string
  description?: string
}

export const ClientFormModal = React.forwardRef<HTMLDivElement, ClientFormModalProps>(
  function ClientFormModal({
    isOpen,
    onClose,
    onSuccess,
    mode = 'create',
    initialData,
    title,
    description,
  }, ref) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState<ClientFormData>({
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      company: initialData?.company || '',
      tier: initialData?.tier || 'INDIVIDUAL',
      status: initialData?.status || 'ACTIVE',
      address: initialData?.address || '',
      city: initialData?.city || '',
      country: initialData?.country || '',
      notes: initialData?.notes || '',
    })

    const defaultTitle = mode === 'create' ? 'Create New Client' : 'Edit Client'
    const defaultDescription = mode === 'create'
      ? 'Add a new client to your system'
      : 'Update client information'

    const handleChange = useCallback((field: keyof ClientFormData, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }))
      setError(null)
    }, [])

    const validateForm = (): boolean => {
      if (!formData.name.trim()) {
        setError('Client name is required')
        return false
      }
      if (!formData.email.trim()) {
        setError('Email is required')
        return false
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Invalid email format')
        return false
      }
      return true
    }

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
      e.preventDefault()
      
      if (!validateForm()) return

      setIsSubmitting(true)
      try {
        const endpoint = mode === 'create'
          ? '/api/admin/entities/clients'
          : `/api/admin/entities/clients/${initialData?.id}`
        const method = mode === 'create' ? 'POST' : 'PATCH'

        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `Failed to ${mode === 'create' ? 'create' : 'update'} client`)
        }

        const result = await response.json()
        toast.success(
          mode === 'create'
            ? 'Client created successfully'
            : 'Client updated successfully'
        )
        onSuccess?.(result.id)
        onClose()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setIsSubmitting(false)
      }
    }, [formData, mode, initialData?.id, onClose, onSuccess])

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent ref={ref} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{title || defaultTitle}</DialogTitle>
            <DialogDescription>{description || defaultDescription}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Client name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="client@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="Company name"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="tier">Tier</Label>
                <Select value={formData.tier} onValueChange={(value) => handleChange('tier', value as any)}>
                  <SelectTrigger id="tier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                    <SelectItem value="SMB">SMB</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value as any)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Street address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  mode === 'create' ? 'Create Client' : 'Update Client'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  }
)

ClientFormModal.displayName = 'ClientFormModal'
