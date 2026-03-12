'use client'

import { useApp } from '@/lib/store'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export function Notifications() {
  const { notifications, dismissNotification } = useApp()

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] space-y-2 max-w-sm">
      {notifications.map(n => (
        <div
          key={n.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-fade-in ${
            n.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            n.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {n.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
          {n.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {n.type === 'info' && <Info className="w-5 h-5 flex-shrink-0" />}
          <p className="text-sm font-medium flex-1">{n.message}</p>
          <button onClick={() => dismissNotification(n.id)} className="p-0.5 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
