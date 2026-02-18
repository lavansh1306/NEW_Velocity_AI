import React, { useState } from 'react'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ManagerGantt from '@/components/ManagerGantt'

export default function GlobalGanttDashboard() {
  const navigate = useNavigate()
  const [expandedView] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-full mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-4xl font-light text-gray-900">📊 Global Gantt Dashboard</h1>
          </div>
        </div>

        {/* Main Gantt Chart Component */}
        <ManagerGantt autoFetch={true} />
      </div>
    </div>
  )
}
