'use client'

import { useState } from 'react'
import { BudgetBreakdown } from '@/types'
import { formatCurrency } from '@/lib/utils'
import {
  Bed, UtensilsCrossed, Wine, Ticket, Car, Package,
  AlertTriangle, Users, ChevronDown, ChevronUp, TrendingUp, PieChart,
} from 'lucide-react'

interface BudgetSummaryProps {
  budget: BudgetBreakdown
  groupSize: number
  maxBudget?: number
}

const categories = [
  { key: 'lodging' as const, label: 'Lodging', detail: 'Hotels, resorts, or rentals for your stay', icon: Bed, color: 'bg-blue-500', lightBg: 'bg-blue-50', textColor: 'text-blue-700' },
  { key: 'food' as const, label: 'Food & Dining', detail: 'Restaurants, cafes, and meal costs', icon: UtensilsCrossed, color: 'bg-emerald-500', lightBg: 'bg-emerald-50', textColor: 'text-emerald-700' },
  { key: 'drinks' as const, label: 'Drinks & Nightlife', detail: 'Bars, clubs, and cocktail lounges', icon: Wine, color: 'bg-purple-500', lightBg: 'bg-purple-50', textColor: 'text-purple-700' },
  { key: 'activities' as const, label: 'Activities', detail: 'Tours, museums, spas, and experiences', icon: Ticket, color: 'bg-amber-500', lightBg: 'bg-amber-50', textColor: 'text-amber-700' },
  { key: 'transportation' as const, label: 'Transportation', detail: 'Rideshare, taxis, and local transit', icon: Car, color: 'bg-rose-500', lightBg: 'bg-rose-50', textColor: 'text-rose-700' },
  { key: 'misc' as const, label: 'Misc & Tips', detail: 'Tips, souvenirs, and unexpected expenses', icon: Package, color: 'bg-gray-500', lightBg: 'bg-gray-50', textColor: 'text-gray-700' },
]

export function BudgetSummary({ budget, groupSize, maxBudget }: BudgetSummaryProps) {
  const [showBreakdown, setShowBreakdown] = useState(true)
  const overBudget = maxBudget ? budget.total > maxBudget : false

  // Find the biggest spending category
  const topCategory = categories.reduce((max, cat) =>
    budget[cat.key] > budget[max.key] ? cat : max
  , categories[0])

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Budget Breakdown</h3>
          </div>
          {overBudget && (
            <div className="flex items-center gap-1.5 text-amber-600 text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              Over budget
            </div>
          )}
        </div>

        {/* Total + Per Person hero */}
        <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4 mb-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Estimated Total</p>
              <p className={`text-3xl font-bold mt-0.5 ${overBudget ? 'text-red-500' : 'gradient-text'}`}>
                {formatCurrency(budget.total)}
              </p>
            </div>
            {groupSize > 1 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                  <Users className="w-3.5 h-3.5" />
                  Per person ({groupSize})
                </p>
                <p className="text-xl font-bold text-foreground mt-0.5">
                  {formatCurrency(budget.perPerson)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual bar breakdown */}
      <div className="px-5 mb-3">
        <div className="h-3 rounded-full overflow-hidden flex bg-gray-100 shadow-inner">
          {categories.map(cat => {
            const pct = (budget[cat.key] / budget.total) * 100
            if (pct < 1) return null
            return (
              <div
                key={cat.key}
                className={`${cat.color} transition-all duration-500 hover:opacity-80`}
                style={{ width: `${pct}%` }}
                title={`${cat.label}: ${formatCurrency(budget[cat.key])} (${Math.round(pct)}%)`}
              />
            )
          })}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {categories.map(cat => {
            const pct = Math.round((budget[cat.key] / budget.total) * 100)
            if (pct < 1) return null
            return (
              <div key={cat.key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                {cat.label} {pct}%
              </div>
            )
          })}
        </div>
      </div>

      {/* Toggle detailed breakdown */}
      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="w-full px-5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center gap-1 border-t"
      >
        {showBreakdown ? 'Hide' : 'Show'} detailed breakdown
        {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {/* Category list with details */}
      {showBreakdown && (
        <div className="px-5 pb-5 space-y-2.5 animate-fade-in">
          {categories.map(cat => {
            const Icon = cat.icon
            const pct = Math.round((budget[cat.key] / budget.total) * 100)
            const isTop = cat.key === topCategory.key
            return (
              <div key={cat.key} className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${isTop ? cat.lightBg : 'hover:bg-secondary/40'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${cat.color} bg-opacity-15 flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${cat.textColor}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium">{cat.label}</p>
                      {isTop && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <TrendingUp className="w-2.5 h-2.5" /> Biggest
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{cat.detail}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <span className="font-semibold text-sm">{formatCurrency(budget[cat.key])}</span>
                  <p className="text-[10px] text-muted-foreground">{pct}%</p>
                </div>
              </div>
            )
          })}

          {/* Per person breakdown */}
          {groupSize > 1 && (
            <div className="border-t pt-3 mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Per Person Breakdown
              </p>
              <div className="grid grid-cols-3 gap-2">
                {categories.map(cat => {
                  const perPerson = Math.round(budget[cat.key] / groupSize)
                  if (perPerson < 1) return null
                  const Icon = cat.icon
                  return (
                    <div key={cat.key} className="text-center p-2 rounded-lg bg-secondary/30">
                      <Icon className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-0.5" />
                      <p className="text-[10px] text-muted-foreground">{cat.label.split(' ')[0]}</p>
                      <p className="text-xs font-semibold">{formatCurrency(perPerson)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
