'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users, Plus, ThumbsUp, ThumbsDown, MessageSquare, DollarSign, Crown,
  Trash2, Sparkles, Copy, Check, BarChart3, Lock, Unlock, Wallet,
  AlertTriangle, ArrowDownToLine, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DestinationCard } from '@/components/destination/DestinationCard'
import { destinations } from '@/data/destinations'
import { formatCurrency } from '@/lib/utils'
import { useApp } from '@/lib/store'
import { Vibe, vibeEmojis } from '@/types'

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
  const [copiedCode, setCopiedCode] = useState(false)

  // Polls
  const [showCreatePoll, setShowCreatePoll] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState<string[]>(['', ''])

  // Invite
  const [inviteCode, setInviteCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinName, setJoinName] = useState('')
  const [showJoinForm, setShowJoinForm] = useState(false)

  // Budget editing
  const [editingBudget, setEditingBudget] = useState<string | null>(null)
  const [budgetInput, setBudgetInput] = useState('')

  // ─── No active trip: show create / join ───
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
            <div className="relative flex justify-center"><span className="bg-background px-3 text-sm text-muted-foreground">or join an existing trip</span></div>
          </div>

          <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Paste invite code..."
            className="w-full h-12 px-4 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" />
          <input type="text" value={joinName} onChange={(e) => setJoinName(e.target.value)}
            placeholder="Your name"
            className="w-full h-12 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          <Button variant="outline" size="lg" className="w-full" onClick={() => {
            if (joinCode.trim() && joinName.trim()) {
              const ok = app.joinTripFromCode(joinCode.trim(), joinName.trim())
              if (ok) {
                app.notify(`Joined trip as ${joinName.trim()}!`, 'success')
                setJoinCode(''); setJoinName('')
              } else {
                app.notify('Invalid invite code', 'error')
              }
            }
          }}>
            <ArrowDownToLine className="w-4 h-4 mr-2" /> Join Trip
          </Button>
        </div>
      </div>
    )
  }

  // ─── Helpers ───
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

  const handleGenerateInvite = () => {
    const code = app.generateInviteCode()
    setInviteCode(code)
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code)
      setCopiedCode(true)
      app.notify('Invite code copied!', 'info')
      setTimeout(() => setCopiedCode(false), 3000)
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
      setTimeout(() => { window.location.href = `/planner?destination=${winner.dest.id}` }, 1200)
    }
  }

  const handleCreatePoll = () => {
    const opts = pollOptions.filter(o => o.trim())
    if (!pollQuestion.trim() || opts.length < 2) {
      app.notify('Need a question and at least 2 options', 'error')
      return
    }
    app.createPoll(pollQuestion.trim(), opts)
    app.notify('Poll created!', 'success')
    setPollQuestion('')
    setPollOptions(['', ''])
    setShowCreatePoll(false)
  }

  const saveBudgetLimit = (travelerId: string) => {
    const val = parseInt(budgetInput)
    if (!isNaN(val) && val > 0) {
      app.setTravelerBudgetLimit(travelerId, val)
      app.notify('Budget limit updated', 'success')
    }
    setEditingBudget(null)
    setBudgetInput('')
  }

  const polls = trip.polls || []
  const perPerson = trip.travelers.length > 0 ? Math.round((trip.budgetTotal || 4800) / trip.travelers.length) : 0
  const budgetLimits = trip.travelers.filter(t => t.budgetLimit && t.budgetLimit > 0)
  const minBudgetLimit = budgetLimits.length > 0 ? Math.min(...budgetLimits.map(t => t.budgetLimit!)) : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">{trip.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">Coordinate with your crew, vote on destinations, and split costs</p>
        </div>
        {app.groupTrips.length > 1 && (
          <select value={trip.id} onChange={(e) => app.setActiveGroupTrip(e.target.value)}
            className="h-10 px-3 rounded-xl border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/20">
            {app.groupTrips.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ═══ Main Content ═══ */}
        <div className="lg:col-span-2 space-y-5">

          {/* ─── Travelers ─── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" /> Travelers ({trip.travelers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {trip.travelers.map((t, i) => (
                  <div key={t.id} className="flex items-center justify-between p-2.5 rounded-xl bg-accent/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white border flex items-center justify-center text-base">{t.avatar}</div>
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
                      {/* Budget limit display/edit */}
                      {editingBudget === t.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">$</span>
                          <input type="number" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)}
                            className="w-20 h-7 px-2 rounded-lg border text-xs bg-background focus:outline-none focus:ring-1 focus:ring-violet-500"
                            placeholder="Max" autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && saveBudgetLimit(t.id)}
                            onBlur={() => saveBudgetLimit(t.id)} />
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingBudget(t.id); setBudgetInput(t.budgetLimit ? String(t.budgetLimit) : '') }}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                            t.budgetLimit ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-accent/50 text-muted-foreground hover:bg-accent'
                          }`}
                          title="Set budget limit"
                        >
                          <Wallet className="w-3 h-3" />
                          {t.budgetLimit ? formatCurrency(t.budgetLimit) : 'Set limit'}
                        </button>
                      )}
                      <Badge variant="secondary" className="text-[10px]">{t.budgetPreference}</Badge>
                      {t.id !== 'me' && (
                        <button onClick={() => { app.removeTraveler(t.id); app.notify(`Removed ${t.name}`, 'info') }}
                          className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <input type="text" value={newTravelerName} onChange={(e) => setNewTravelerName(e.target.value)}
                    placeholder="Add traveler name..."
                    className="flex-1 h-9 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    onKeyDown={(e) => e.key === 'Enter' && addTraveler()} />
                  <Button size="sm" onClick={addTraveler}><Plus className="w-4 h-4 mr-1" /> Add</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Destination Voting ─── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Vote on Destinations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {votableDestinations.map(dest => {
                  const { ups, downs, net } = getVoteCount(dest.id)
                  const myVote = trip.votes[dest.id]?.['me']
                  return (
                    <div key={dest.id} className="flex items-center gap-3 p-3 rounded-xl border hover:border-violet-500/30 transition-all">
                      <div className="w-14 h-14 rounded-lg bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${dest.heroImage})` }} />
                      <div className="flex-1 min-w-0">
                        <Link href={`/destinations/${dest.id}`} className="font-semibold text-sm hover:text-violet-400 transition-colors">{dest.name}</Link>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{dest.tags.slice(0, 3).join(' · ')}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => app.castVote(dest.id, 'me', 'up')}
                          className={`p-1.5 rounded-lg border transition-all ${myVote === 'up' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'hover:bg-accent'}`}>
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <span className={`font-bold text-sm min-w-[2ch] text-center ${net > 0 ? 'text-emerald-400' : net < 0 ? 'text-red-400' : ''}`}>
                          {net > 0 ? '+' : ''}{net}
                        </span>
                        <button onClick={() => app.castVote(dest.id, 'me', 'down')}
                          className={`p-1.5 rounded-lg border transition-all ${myVote === 'down' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'hover:bg-accent'}`}>
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* ─── Polls ─── */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" /> Polls ({polls.length})
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowCreatePoll(!showCreatePoll)}>
                  {showCreatePoll ? <X className="w-3.5 h-3.5 mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                  {showCreatePoll ? 'Cancel' : 'New Poll'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Create poll form */}
              {showCreatePoll && (
                <div className="mb-4 p-3 rounded-xl border border-violet-500/30 bg-violet-500/5 space-y-2">
                  <input type="text" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    className="w-full h-9 px-3 rounded-lg border text-sm bg-background focus:outline-none focus:ring-1 focus:ring-violet-500" />
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" value={opt}
                        onChange={(e) => {
                          const next = [...pollOptions]
                          next[i] = e.target.value
                          setPollOptions(next)
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 h-8 px-3 rounded-lg border text-xs bg-background focus:outline-none focus:ring-1 focus:ring-violet-500" />
                      {pollOptions.length > 2 && (
                        <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                          className="p-1 text-muted-foreground hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    {pollOptions.length < 6 && (
                      <Button size="sm" variant="ghost" onClick={() => setPollOptions([...pollOptions, ''])}>
                        <Plus className="w-3 h-3 mr-1" /> Add Option
                      </Button>
                    )}
                    <Button size="sm" className="ml-auto" onClick={handleCreatePoll}>Create Poll</Button>
                  </div>
                </div>
              )}

              {/* Poll list */}
              {polls.length === 0 && !showCreatePoll && (
                <p className="text-sm text-muted-foreground text-center py-4">No polls yet. Create one to get your group&apos;s opinion!</p>
              )}
              <div className="space-y-3">
                {polls.map(poll => {
                  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0)
                  return (
                    <div key={poll.id} className="p-3 rounded-xl bg-accent/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm flex items-center gap-1.5">
                          {poll.question}
                          {poll.closed && <Lock className="w-3 h-3 text-muted-foreground" />}
                        </h4>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
                          {!poll.closed && (
                            <button onClick={() => { app.closePoll(poll.id); app.notify('Poll closed', 'info') }}
                              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-amber-400" title="Close poll">
                              <Lock className="w-3 h-3" />
                            </button>
                          )}
                          <button onClick={() => { app.deletePoll(poll.id); app.notify('Poll deleted', 'info') }}
                            className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400" title="Delete poll">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {poll.options.map(opt => {
                          const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0
                          const myVote = opt.votes.includes('me')
                          return (
                            <button key={opt.id} disabled={poll.closed}
                              onClick={() => app.votePoll(poll.id, opt.id, 'me')}
                              className={`w-full relative overflow-hidden rounded-lg border p-2 text-left transition-all ${
                                poll.closed ? 'cursor-default' : 'cursor-pointer hover:border-violet-500/40'
                              } ${myVote ? 'border-violet-500/50 bg-violet-500/10' : ''}`}>
                              <div className="absolute inset-0 bg-violet-500/10 transition-all" style={{ width: `${pct}%` }} />
                              <div className="relative flex items-center justify-between">
                                <span className="text-xs font-medium flex items-center gap-1.5">
                                  {myVote && <Check className="w-3 h-3 text-violet-400" />}
                                  {opt.text}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <div className="flex -space-x-1">
                                    {opt.votes.slice(0, 4).map(vid => {
                                      const voter = trip.travelers.find(t => t.id === vid)
                                      return voter ? (
                                        <span key={vid} className="text-[10px]" title={voter.name}>{voter.avatar}</span>
                                      ) : null
                                    })}
                                    {opt.votes.length > 4 && <span className="text-[10px] text-muted-foreground ml-1">+{opt.votes.length - 4}</span>}
                                  </div>
                                  <span className="text-[11px] font-semibold min-w-[3ch] text-right">{pct}%</span>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5">{poll.createdAt}{poll.closed ? ' · Closed' : ''}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* ─── Notes ─── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Group Notes ({trip.notes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                {trip.notes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No notes yet. Start the conversation!</p>
                )}
                {trip.notes.map(note => {
                  const traveler = trip.travelers.find(t => t.id === note.travelerId)
                  return (
                    <div key={note.id} className="p-2.5 rounded-xl bg-accent/50">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm">{traveler?.avatar || '💬'}</span>
                        <span className="font-medium text-xs">{traveler?.name || 'Unknown'}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">{note.createdAt}</span>
                      </div>
                      <p className="text-sm">{note.content}</p>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 h-9 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onKeyDown={(e) => e.key === 'Enter' && addNote()} />
                <Button size="sm" onClick={addNote}>Post</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══ Sidebar ═══ */}
        <div className="space-y-5">

          {/* ─── Budget & Limits ─── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-3">
                <p className="text-3xl font-bold gradient-text">{formatCurrency(trip.budgetTotal || 4800)}</p>
                <p className="text-xs text-muted-foreground">Estimated total</p>
              </div>
              <div className="space-y-2">
                {trip.travelers.map(t => {
                  const overBudget = t.budgetLimit && t.budgetLimit < perPerson
                  return (
                    <div key={t.id} className="flex items-center justify-between p-1.5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{t.avatar}</span>
                        <span className="text-xs font-medium">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {t.budgetLimit ? (
                          <span className={`text-[10px] flex items-center gap-0.5 ${overBudget ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {overBudget && <AlertTriangle className="w-3 h-3" />}
                            max {formatCurrency(t.budgetLimit)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">no limit</span>
                        )}
                        <span className="font-semibold text-xs">{formatCurrency(perPerson)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="border-t pt-2 mt-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Per Person</span>
                  <span className="text-base font-bold">{formatCurrency(perPerson)}</span>
                </div>
                {minBudgetLimit !== null && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                    <span className="text-xs font-medium flex items-center gap-1"><Wallet className="w-3 h-3" /> Effective Group Budget</span>
                    <span className="text-sm font-bold text-violet-400">{formatCurrency(minBudgetLimit * trip.travelers.length)}</span>
                  </div>
                )}
                {minBudgetLimit !== null && minBudgetLimit < perPerson && (
                  <p className="text-[10px] text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Some travelers are over their budget limit
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ─── Leading Destination ─── */}
          <Card>
            <CardHeader className="pb-2">
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
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {winner.ups} votes in favor · {winner.net > 0 ? `+${winner.net}` : winner.net} net
                    </p>
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* ─── Invite System ─── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" /> Invite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" size="sm" onClick={handleGenerateInvite}>
                {copiedCode ? <Check className="w-3.5 h-3.5 mr-2" /> : <Copy className="w-3.5 h-3.5 mr-2" />}
                {copiedCode ? 'Copied!' : 'Generate Invite Code'}
              </Button>
              {inviteCode && (
                <div className="p-2 rounded-lg bg-gray-900 border">
                  <p className="text-[10px] text-muted-foreground mb-1">Share this code with your group:</p>
                  <p className="text-xs font-mono break-all select-all text-violet-300">{inviteCode}</p>
                </div>
              )}

              <Button variant="ghost" className="w-full" size="sm" onClick={() => setShowJoinForm(!showJoinForm)}>
                <ArrowDownToLine className="w-3.5 h-3.5 mr-2" /> {showJoinForm ? 'Hide' : 'Join a Trip'}
              </Button>
              {showJoinForm && (
                <div className="space-y-1.5">
                  <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Paste invite code..."
                    className="w-full h-8 px-3 rounded-lg border text-xs font-mono bg-background focus:outline-none focus:ring-1 focus:ring-violet-500" />
                  <input type="text" value={joinName} onChange={(e) => setJoinName(e.target.value)}
                    placeholder="Your name"
                    className="w-full h-8 px-3 rounded-lg border text-xs bg-background focus:outline-none focus:ring-1 focus:ring-violet-500" />
                  <Button size="sm" className="w-full" onClick={() => {
                    if (joinCode.trim() && joinName.trim()) {
                      const ok = app.joinTripFromCode(joinCode.trim(), joinName.trim())
                      if (ok) {
                        app.notify(`Joined as ${joinName.trim()}!`, 'success')
                        setJoinCode(''); setJoinName(''); setShowJoinForm(false)
                      } else {
                        app.notify('Invalid invite code', 'error')
                      }
                    }
                  }}>Join</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─── Quick Actions ─── */}
          <div className="space-y-2">
            <Button variant="gradient" className="w-full" size="lg" onClick={handleGenerateItinerary}>
              <Sparkles className="w-4 h-4 mr-2" /> Generate Group Itinerary
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setShowNewGroupForm(!showNewGroupForm)}>
              <Plus className="w-4 h-4 mr-2" /> New Group Trip
            </Button>
            {showNewGroupForm && (
              <div className="flex gap-2">
                <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Trip name..."
                  className="flex-1 h-9 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newGroupName.trim()) {
                      app.createGroupTrip(newGroupName.trim())
                      app.notify(`Created "${newGroupName.trim()}"!`, 'success')
                      setNewGroupName(''); setShowNewGroupForm(false)
                    }
                  }} />
                <Button size="sm" onClick={() => {
                  if (newGroupName.trim()) {
                    app.createGroupTrip(newGroupName.trim())
                    app.notify(`Created "${newGroupName.trim()}"!`, 'success')
                    setNewGroupName(''); setShowNewGroupForm(false)
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
