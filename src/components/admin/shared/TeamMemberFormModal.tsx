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

interface TeamMemberFormData {
  name: string
  email: string
  title: string
  department: string
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'
  phone?: string
  specialties?: string[]
  certifications?: string[]
  availability?: string
  notes?: string
}

interface TeamMemberFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (memberId: string) => void
  mode?: 'create' | 'edit'
  initialData?: Partial<TeamMemberFormData & { id: string }>
  title?: string
  description?: string
}

export const TeamMemberFormModal = React.forwardRef<HTMLDivElement, TeamMemberFormModalProps>(
  function TeamMemberFormModal({
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
    const [formData, setFormData] = useState<TeamMemberFormData>({
      name: initialData?.name || '',
      email: initialData?.email || '',
      title: initialData?.title || '',
      department: initialData?.department || '',
      status: initialData?.status || 'ACTIVE',
      phone: initialData?.phone || '',
      specialties: initialData?.specialties || [],
      certifications: initialData?.certifications || [],
      availability: initialData?.availability || '9am-5pm',
      notes: initialData?.notes || '',
    })

    const defaultTitle = mode === 'create' ? 'Add Team Member' : 'Edit Team Member'
    const defaultDescription = mode === 'create'
      ? 'Add a new team member to your organization'
      : 'Update team member information'

    const handleChange = useCallback((field: keyof TeamMemberFormData, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }))
      setError(null)
    }, [])

    const validateForm = (): boolean => {
      if (!formData.name.trim()) {
        setError('Team member name is required')
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
      if (!formData.title.trim()) {
        setError('Job title is required')
        return false
      }
      if (!formData.department.trim()) {
        setError('Department is required')
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
          ? '/api/admin/entities/team-members'
          : `/api/admin/entities/team-members/${initialData?.id}`
        const method = mode === 'create' ? 'POST' : 'PATCH'

        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `Failed to ${mode === 'create' ? 'create' : 'update'} team member`)
        }

        const result = await response.json()
        toast.success(
          mode === 'create'
            ? 'Team member added successfully'
            : 'Team member updated successfully'
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
        <DialogContent ref={ref} className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                placeholder="Team member name"
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
                placeholder="member@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Senior Accountant"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select value={formData.department} onValueChange={(value) => handleChange('department', value)}>
                  <SelectTrigger id="department">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Accounting">Accounting</SelectItem>
                    <SelectItem value="Tax">Tax</SelectItem>
                    <SelectItem value="Audit">Audit</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Administration">Administration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value as any)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability">Availability</Label>
              <Input
                id="availability"
                placeholder="e.g., 9am-5pm, Mon-Fri"
                value={formData.availability}
                onChange={(e) => handleChange('availability', e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties (comma-separated)</Label>
              <Input
                id="specialties"
                placeholder="e.g., Tax Planning, Compliance, Audit"
                value={Array.isArray(formData.specialties) ? formData.specialties.join(', ') : ''}
                onChange={(e) => handleChange('specialties', e.target.value.split(',').map(s => s.trim()))}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certifications">Certifications (comma-separated)</Label>
              <Input
                id="certifications"
                placeholder="e.g., CPA, CIA, CFE"
                value={Array.isArray(formData.certifications) ? formData.certifications.join(', ') : ''}
                onChange={(e) => handleChange('certifications', e.target.value.split(',').map(s => s.trim()))}
                disabled={isSubmitting}
              />
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
                    {mode === 'create' ? 'Adding...' : 'Updating...'}
                  </>
                ) : (
                  mode === 'create' ? 'Add Member' : 'Update Member'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  }
)

TeamMemberFormModal.displayName = 'TeamMemberFormModal'
