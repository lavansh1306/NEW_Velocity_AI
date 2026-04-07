import React, { useState, useRef } from 'react'
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Image } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ManagerGantt from '@/components/ManagerGantt'
import { toast } from 'sonner'

export default function GlobalGanttDashboard() {
  const navigate = useNavigate()
  const [expandedView] = useState(true)
  const ganttRef = useRef<HTMLDivElement>(null)

  const handleExportPDF = () => {
    try {
      const style = document.createElement('style')
      style.textContent = `
        @media print {
          body * { visibility: hidden; }
          #gantt-export-area, #gantt-export-area * { visibility: visible; }
          #gantt-export-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `
      document.head.appendChild(style)
      window.print()
      document.head.removeChild(style)
      toast.success('PDF export opened — use your browser print dialog to save')
    } catch (e) {
      toast.error('Export failed')
    }
  }

  const handleExportPNG = async () => {
    try {
      const el = document.getElementById('gantt-export-area')
      if (!el) return toast.error('Gantt chart not found')

      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(el, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      })

      const link = document.createElement('a')
      link.download = `velocity-gantt-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Gantt chart exported as PNG')
    } catch (e) {
      // Fallback if html2canvas not installed — use print
      toast.info('Tip: Use PDF export for best results')
      handleExportPDF()
    }
  }

  return (
    <VelocityAISidebar>
      <div className="min-h-screen bg-[#FAFAF9]">
        <div className="max-w-full mx-auto p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 no-print">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-4xl font-light text-gray-900">📊 Global Gantt Dashboard</h1>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPNG}
                className="gap-2 text-gray-600 hover:text-gray-900"
              >
                <Image className="w-4 h-4" />
                Export PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="gap-2 text-gray-600 hover:text-gray-900"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Main Gantt Chart Component — wrapped for export */}
          <div id="gantt-export-area" ref={ganttRef}>
            <ManagerGantt autoFetch={true} />
          </div>
        </div>
      </div>
    </VelocityAISidebar>
  )
}
