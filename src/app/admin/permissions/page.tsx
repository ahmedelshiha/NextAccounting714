'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Shield } from 'lucide-react'
import { PermissionHierarchy } from '@/app/admin/users/components/PermissionHierarchy'
import { PermissionSimulator } from '@/app/admin/users/components/PermissionSimulator'
import { ConflictResolver } from '@/app/admin/users/components/ConflictResolver'

export default function PermissionsPage() {
  const [activeTab, setActiveTab] = useState('hierarchy')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Role & Permission Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage role hierarchies, permissions, and access control
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search roles or permissions..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          <TabsTrigger value="simulator">Test Access</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
        </TabsList>

        {/* Hierarchy Tab */}
        <TabsContent value="hierarchy" className="space-y-4">
          <PermissionHierarchy />
        </TabsContent>

        {/* Simulator Tab */}
        <TabsContent value="simulator" className="space-y-4">
          <PermissionSimulator />
        </TabsContent>

        {/* Conflicts Tab */}
        <TabsContent value="conflicts" className="space-y-4">
          <ConflictResolver />
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-4 gap-4">
          <StatItem label="Total Roles" value="12" color="blue" />
          <StatItem label="Permissions" value="48" color="green" />
          <StatItem label="Users" value="256" color="purple" />
          <StatItem label="Conflicts" value="3" color="red" />
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Stat Item Component
 */
function StatItem({
  label,
  value,
  color
}: {
  label: string
  value: string
  color: 'blue' | 'green' | 'purple' | 'red'
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-900',
    green: 'bg-green-50 text-green-900',
    purple: 'bg-purple-50 text-purple-900',
    red: 'bg-red-50 text-red-900'
  }

  return (
    <div className={`${colorMap[color]} p-4 rounded-lg`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm opacity-75 mt-1">{label}</div>
    </div>
  )
}
