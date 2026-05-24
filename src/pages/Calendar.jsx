import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, ExternalLink, Loader2, MapPin, Plus, Trash2 } from 'lucide-react'
import { EVENT_TYPES, formatEventDate, getEventMonthDay, useFamilyEvents } from '../hooks/useFamilyEvents'
import { useAuth } from '../hooks/useAuth'

const inputClass =
  'w-full rounded-sm border border-gold/20 bg-dark px-4 py-3 text-cream placeholder:text-cream/30 outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold/30'

const emptyForm = {
  title: '',
  description: '',
  event_date: '',
  event_time: '',
  location: '',
  type: 'Other',
}

const todayKey = new Date().toISOString().slice(0, 10)
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const toDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const monthLabel = (date) =>
  new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date)

const buildMonthDays = (monthDate) => {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return {
      date,
      key: toDateKey(date),
      inMonth: date.getMonth() === month,
    }
  })
}

const googleDate = (event) => event.event_date.replaceAll('-', '')

const googleCalendarUrl = (event) => {
  const date = googleDate(event)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${date}/${date}`,
    details: event.description || '',
    location: event.location || '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function EventCard({ event, isAdmin, onDelete }) {
  const { month, day } = getEventMonthDay(event.event_date)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group overflow-hidden rounded-xl border border-gold/15 bg-black/20 shadow-xl shadow-black/20 backdrop-blur-sm"
    >
      <div className="flex gap-4 p-4 sm:p-5">
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg border border-gold/25 bg-gold/10 text-gold">
          <span className="text-xs uppercase tracking-[0.22em]">{month}</span>
          <span className="font-serif text-3xl font-bold leading-none">{day}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gold/60">{event.type}</p>
              <h2 className="mt-1 font-serif text-xl font-semibold text-gold sm:text-2xl">
                {event.title}
              </h2>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => onDelete(event.id)}
                className="rounded-full border border-gold/15 p-2 text-cream/35 opacity-100 transition-colors hover:border-red-400/40 hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label={`Delete ${event.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-cream/55">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-gold/60" />
              {formatEventDate(event.event_date)}
            </span>
            {event.event_time && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gold/60" />
                {event.event_time}
              </span>
            )}
            {event.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gold/60" />
                {event.location}
              </span>
            )}
          </div>

          {event.description && (
            <p className="mt-3 text-sm leading-relaxed text-cream/65">{event.description}</p>
          )}

          <a
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold/70 transition-colors hover:text-gold"
          >
            Add to Google Calendar
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </motion.article>
  )
}

export default function Calendar() {
  const { isAdmin } = useAuth()
  const { events, loading, error, fetchEvents, createEvent, deleteEvent } = useFamilyEvents()
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [viewMonth, setViewMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(todayKey)

  useEffect(() => {
    fetchEvents({ upcomingOnly: true })
  }, [fetchEvents])

  const eventsByDate = useMemo(() => {
    return events.reduce((map, event) => {
      const list = map.get(event.event_date) ?? []
      list.push(event)
      map.set(event.event_date, list)
      return map
    }, new Map())
  }, [events])

  const monthDays = useMemo(() => buildMonthDays(viewMonth), [viewMonth])
  const selectedEvents = eventsByDate.get(selectedDate) ?? []

  const changeMonth = (offset) => {
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  const jumpToday = () => {
    const today = new Date()
    setViewMonth(today)
    setSelectedDate(todayKey)
  }

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')

    try {
      await createEvent(form)
      setForm(emptyForm)
      setFormOpen(false)
    } catch (err) {
      setFormError(err.message || 'Could not save event.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteEvent(id)
    } catch (err) {
      setFormError(err.message || 'Could not delete event.')
    }
  }

  return (
    <main className="min-h-screen bg-dark">
      <div className="pointer-events-none absolute inset-x-0 top-16 h-48 bg-gradient-to-b from-gold/5 to-transparent sm:top-[4.5rem]" />

      <div className="relative mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-gold/70">
              Family Calendar
            </p>
            <h1 className="font-serif text-4xl font-bold text-gold sm:text-5xl">
              Family Calendar
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream/60 sm:text-base">
              Birthdays, reunions, trips, and the dates worth remembering together.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setFormOpen((open) => !open)}
              className="inline-flex items-center justify-center gap-2 rounded border border-gold/35 bg-gold/10 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-gold transition-colors hover:bg-gold/20"
            >
              <Plus className="h-4 w-4" />
              Add Moment
            </button>
          )}
        </motion.header>

        {formOpen && isAdmin && (
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="mb-8 rounded-xl border border-gold/15 bg-black/20 p-5 shadow-xl shadow-black/20 backdrop-blur-sm"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80">
                  Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  required
                  className={inputClass}
                  placeholder="Mom's birthday dinner"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80">
                  Date
                </label>
                <input
                  type="date"
                  value={form.event_date}
                  onChange={(e) => set('event_date', e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80">
                  Time
                </label>
                <input
                  type="time"
                  value={form.event_time}
                  onChange={(e) => set('event_time', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80">
                  Type
                </label>
                <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputClass}>
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80">
                  Location
                </label>
                <input
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                  className={inputClass}
                  placeholder="Silva home"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  className={`${inputClass} min-h-24 resize-y`}
                  placeholder="Bring old albums, printed photos, or anything special."
                />
              </div>
            </div>

            {formError && <p className="mt-4 text-sm text-red-400">{formError}</p>}

            <div className="mt-5 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded border border-gold/40 bg-gold/15 px-5 py-2.5 text-sm font-semibold uppercase tracking-widest text-gold transition-all hover:bg-gold/25 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Moment
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded border border-gold/15 px-5 py-2.5 text-sm text-cream/60 transition-colors hover:text-gold"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gold">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-200">
            {error}
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <section className="rounded-2xl border border-gold/15 bg-black/20 p-4 shadow-xl shadow-black/20 backdrop-blur-sm sm:p-5">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-serif text-2xl text-gold">{monthLabel(viewMonth)}</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changeMonth(-1)}
                    className="rounded border border-gold/20 p-2 text-cream/60 transition-colors hover:text-gold"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={jumpToday}
                    className="rounded border border-gold/20 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gold/70 transition-colors hover:bg-gold/10 hover:text-gold"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => changeMonth(1)}
                    className="rounded border border-gold/20 p-2 text-cream/60 transition-colors hover:text-gold"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wider text-gold/50">
                {weekDays.map((day) => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((day) => {
                  const dayEvents = eventsByDate.get(day.key) ?? []
                  const selected = selectedDate === day.key
                  const isToday = todayKey === day.key

                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => setSelectedDate(day.key)}
                      className={`min-h-20 rounded-lg border p-2 text-left transition-all ${
                        selected
                          ? 'border-gold bg-gold/15 shadow-lg shadow-gold/5'
                          : 'border-gold/10 bg-dark/40 hover:border-gold/30 hover:bg-gold/10'
                      } ${day.inMonth ? 'opacity-100' : 'opacity-35'}`}
                    >
                      <span className={`text-sm ${isToday ? 'text-gold' : 'text-cream/70'}`}>
                        {day.date.getDate()}
                      </span>
                      <div className="mt-2 space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div key={event.id} className="truncate rounded bg-gold/15 px-1.5 py-0.5 text-[10px] text-gold">
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] text-cream/35">+{dayEvents.length - 2} more</div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-gold/15 bg-black/20 p-5 shadow-xl shadow-black/20 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold/60">
                  Selected Day
                </p>
                <h2 className="mt-2 font-serif text-2xl text-gold">
                  {formatEventDate(selectedDate)}
                </h2>
              </div>

              {selectedEvents.length > 0 ? (
                <div className="space-y-4">
                  {selectedEvents.map((event) => (
                    <EventCard key={event.id} event={event} isAdmin={isAdmin} onDelete={handleDelete} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-gold/15 bg-black/20 p-6 text-center">
                  <CalendarDays className="mx-auto mb-4 h-9 w-9 text-gold/45" />
                  <h3 className="font-serif text-xl text-gold">No plans on this day</h3>
                  <p className="mt-2 text-sm text-cream/45">
                    Pick another date or add a family moment.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <h2 className="mb-4 font-serif text-2xl text-gold">Upcoming</h2>
                {events.length === 0 ? (
                  <div className="rounded-xl border border-gold/15 bg-black/20 p-6 text-center">
                    <p className="text-sm text-cream/50">
                      Add birthdays, reunions, trips, and family plans here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.slice(0, 4).map((event) => (
                      <EventCard key={event.id} event={event} isAdmin={isAdmin} onDelete={handleDelete} />
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
