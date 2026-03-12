'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Plus, ThumbsUp, ThumbsDown, MessageSquare, DollarSign, Crown, Trash2, Sparkles, Share2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DestinationCard } from '@/components/destination/DestinationCard'
import { destinations } from '@/data/destinations'
import { formatCurrency } from '@/lib/utils'
import { useApp } from '@/lib/store'
import { Vibe, vibeLabels, vibeEmojis } from '@/types'

const votableDestinations = [
  destinations.find(d => d.id === 'miami')!,
  destinations.find(d => d.id === 'nashville')!,
  destinations.find(d => d.id === 'las-vegas')!,
  destinations.find(d => d.id === 'scottsdale')!,
  destinations.find(d => d.id === 'austin')!,
  destinations.find(d => d.id === 'san-diego')!,
].filter(Boolean)

export default function GroupPlannerPage() {
  const app = useApp()
  const trip = app.activeGroupTrip

  const [newNote, setNewNote] = useState('')
  const [newTravelerName, setNewTravelerName] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [showNewGroupForm, setShowNewGroupForm] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // If no active group trip, show a creation prompt
  if (!trip) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="text-6xl mb-6">👥</div>
        <h1 className="text-3xl font-bold mb-3">Group Trip Planner</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">Coordinate with your crew, vote on destinations, and split costs together.</p>
        <div className="max-w-sm mx-auto space-y-3">
          <input
            type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Name your trip (e.g., Spring Break 2026)"
            className="w-full h-12 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newGroupName.trim()) {
                app.createGroupTrip(newGroupName.trim())
                app.notify(`Created "${newGroupName.trim()}"!`, 'success')
                app.addActivity(`Created group trip "${newGroupName.trim()}"`, '👥')
                setNewGroupName('')
              }
            }}
          />
          <Button variant="gradient" size="lg" className="w-full" onClick={() => {
            if (newGroupName.trim()) {
              app.createGroupTrip(newGroupName.trim())
              app.notify(`Created "${newGroupName.trim()}"!`, 'success')
              app.addActivity(`Created group trip "${newGroupName.trim()}"`, '👥')
              setNewGroupName('')
            }
          }}>
            <Plus className="w-4 h-4 mr-2" /> Create Group Trip
          </Button>
        </div>
      </div>
    )
  }

  const getVoteCount = (destId: string) => {
    const destVotes = trip.votes[destId] || {}
    const ups = Object.values(destVotes).filter(v => v === 'up').length
    const downs = Object.values(destVotes).filter(v => v === 'down').length
    return { ups, downs, net: ups - downs }
  }

  const addNote = () => {
    if (!newNote.trim()) return
    app.addGroupNote('me', newNote)
    setNewNote('')
    app.notify('Note posted!', 'info')
  }

  const addTraveler = () => {
    if (!newTravelerName.trim()) return
    app.addTraveler(newTravelerName.trim())
    app.notify(`${newTravelerName.trim()} added to the group!`, 'success')
    setNewTravelerName('')
  }

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      app.notify('Invite link copied!', 'info')
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const handleGenerateItinerary = () => {
    const sorted = votableDestinations
      .map(d => ({ dest: d, ...getVoteCount(d.id) }))
      .sort((a, b) => b.net - a.net)
    const winner = sorted[0]
    if (winner) {
      app.setGroupDestination(winner.dest.id)
      app.addActivity(`Group chose ${winner.dest.name}!`, '🎯')
      app.notify(`Heading to ${winner.dest.name}! Redirecting to planner...`, 'success')
      // Small delay so user sees the toast
      setTimeout(() => {
        window.location.href = `/planner?destination=${winner.dest.id}`
      }, 1200)
    }
  }

  const perPerson = trip.travelers.length > 0 ? Math.round(trip.budgetTotal / trip.travelers.length) : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">{trip.name}</h1>
          <p className="text-muted-foreground mt-1">Coordinate with your crew, vote on destinations, and split costs</p>
        </div>
        {app.groupTrips.length > 1 && (
          <select
            value={trip.id}
            onChange={(e) => app.setActiveGroupTrip(e.target.value)}
            className="h-10 px-3 rounded-xl border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {app.groupTrips.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Traveler List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Travelers ({trip.travelers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trip.travelers.map((t, i) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-accent/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center text-lg">
                        {t.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-sm flex items-center gap-1.5">
                          {t.name}
                          {i === 0 && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                        </p>
                        <div className="flex gap-1 mt-0.5">
                          {t.vibePreferences.map(v => (
                            <span key={v} className="text-[10px] text-muted-foreground">{vibeEmojis[v as Vibe]} {v}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{t.budgetPreference}</Badge>
                      {t.id !== 'me' && (
                        <button onClick={() => { app.removeTraveler(t.id); app.notify(`Removed ${t.name}`, 'info') }}
                          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <input type="text" value={newTravelerName} onChange={(e) => setNewTravelerName(e.target.value)}
                    placeholder="Add traveler name..."
                    className="flex-1 h-10 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    onKeyDown={(e) => e.key === 'Enter' && addTraveler()} />
                  <Button size="sm" onClick={addTraveler}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voting */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Vote on Destinations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {votableDestinations.map(dest => {
                  const { ups, downs, net } = getVoteCount(dest.id)
                  const myVote = trip.votes[dest.id]?.['me']
                  return (
                    <div key={dest.id} className="flex items-center gap-4 p-4 rounded-xl border hover:shadow-sm transition-all">
                      <div className="w-16 h-16 rounded-lg bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${dest.heroImage})` }} />
                      <div className="flex-1 min-w-0">
                        <Link href={`/destinations/${dest.id}`} className="font-semibold hover:text-primary transition-colors">{dest.name}</Link>
                        <p className="text-xs text-muted-foreground mt-0.5">{dest.tags.slice(0, 3).join(' · ')}</p>
                        <div className="flex gap-1 mt-1">
                          {Array(ups).fill(0).map((_, i) => <span key={`up-${i}`} className="text-xs">👍</span>)}
                          {Array(downs).fill(0).map((_, i) => <span key={`dn-${i}`} className="text-xs">👎</span>)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => app.castVote(dest.id, 'me', 'up')}
                          className={`p-2 rounded-lg border transition-all ${myVote === 'up' ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'hover:bg-accent'}`}>
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <span className={`font-bold text-lg min-w-[2ch] text-center ${net > 0 ? 'text-emerald-600' : net < 0 ? 'text-red-500' : ''}`}>
                          {net > 0 ? '+' : ''}{net}
                        </span>
                        <button onClick={() => app.castVote(dest.id, 'me', 'down')}
                          className={`p-2 rounded-lg border transition-all ${myVote === 'down' ? 'bg-red-50 border-red-300 text-red-600' : 'hover:bg-accent'}`}>
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Group Notes ({trip.notes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                {trip.notes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No notes yet. Start the conversation!</p>
                )}
                {trip.notes.map(note => {
                  const traveler = trip.travelers.find(t => t.id === note.travelerId)
                  return (
                    <div key={note.id} className="p-3 rounded-xl bg-accent/50">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{traveler?.avatar || '💬'}</span>
                        <span className="font-medium text-sm">{traveler?.name || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{note.createdAt}</span>
                      </div>
                      <p className="text-sm">{note.content}</p>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 h-10 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onKeyDown={(e) => e.key === 'Enter' && addNote()} />
                <Button size="sm" onClick={addNote}>Post</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Budget Split */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Budget Split
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-3xl font-bold gradient-text">{formatCurrency(trip.budgetTotal || 4800)}</p>
                <p className="text-sm text-muted-foreground">Estimated total</p>
              </div>
              <div className="space-y-3">
                {trip.travelers.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>{t.avatar}</span>
                      <span className="text-sm font-medium">{t.name}</span>
                    </div>
                    <span className="font-semibold text-sm">{formatCurrency(Math.round((trip.budgetTotal || 4800) / trip.travelers.length))}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 mt-3 flex items-center justify-between">
                <span className="text-sm font-medium">Per Person</span>
                <span className="text-lg font-bold">{formatCurrency(Math.round((trip.budgetTotal || 4800) / trip.travelers.length))}</span>
              </div>
            </CardContent>
          </Card>

          {/* Winning Destination */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Leading Destination</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const sorted = votableDestinations
                  .map(d => ({ dest: d, ...getVoteCount(d.id) }))
                  .sort((a, b) => b.net - a.net)
                const winner = sorted[0]
                if (!winner) return null
                return (
                  <div>
                    <DestinationCard destination={winner.dest} variant="compact" />
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      {winner.ups} votes in favor · {winner.net > 0 ? `+${winner.net}` : winner.net} net
                    </p>
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button variant="gradient" className="w-full" size="lg" onClick={handleGenerateItinerary}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Group Itinerary
            </Button>
            <Button variant="outline" className="w-full" onClick={handleShare}>
              {copiedLink ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copiedLink ? 'Copied!' : 'Share Invite Link'}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setShowNewGroupForm(!showNewGroupForm)}>
              <Plus className="w-4 h-4 mr-2" /> New Group Trip
            </Button>
            {showNewGroupForm && (
              <div className="flex gap-2">
                <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Trip name..."
                  className="flex-1 h-10 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newGroupName.trim()) {
                      app.createGroupTrip(newGroupName.trim())
                      app.notify(`Created "${newGroupName.trim()}"!`, 'success')
                      setNewGroupName('')
                      setShowNewGroupForm(false)
                    }
                  }} />
                <Button size="sm" onClick={() => {
                  if (newGroupName.trim()) {
                    app.createGroupTrip(newGroupName.trim())
                    app.notify(`Created "${newGroupName.trim()}"!`, 'success')
                    setNewGroupName('')
                    setShowNewGroupForm(false)
                  }
                }}>Create</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
