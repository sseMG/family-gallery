import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Pencil, Trash2, Loader2, Settings2, Phone, MapPin, Cake } from 'lucide-react'

function FacebookIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function InstagramIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}
import { supabase } from '../lib/supabase'
import { uploadToCloudinary } from '../lib/cloudinary'
import { useAuth } from '../hooks/useAuth'

const GENERATIONS = [
  { value: 'all', label: 'All' },
  { value: 'lolo_lola', label: 'Lolo/Lola' },
  { value: 'parents', label: 'Parents' },
  { value: 'kids', label: 'Kids' },
]

const RELATIONSHIPS = [
  'Grandfather', 'Grandmother', 'Father', 'Mother',
  'Son', 'Daughter', 'Brother', 'Sister',
  'Uncle', 'Aunt', 'Nephew', 'Niece',
  'Cousin', 'Tito', 'Tita', 'Kuya', 'Ate', 'Other'
]

const RELATIONSHIP_TO_GEN = {
  Grandfather: 'lolo_lola', Grandmother: 'lolo_lola',
  Lolo: 'lolo_lola', Lola: 'lolo_lola',
  Father: 'parents', Mother: 'parents', Dad: 'parents', Mom: 'parents',
  Uncle: 'parents', Aunt: 'parents', Tito: 'parents', Tita: 'parents',
  Son: 'kids', Daughter: 'kids', Brother: 'kids', Sister: 'kids',
  Nephew: 'kids', Niece: 'kids', Cousin: 'kids',
  Kuya: 'kids', Ate: 'kids', Sibling: 'kids', Other: 'kids',
}

const memberGeneration = (m) => RELATIONSHIP_TO_GEN[m.relationship] || m.generation || 'kids'

const emptyForm = {
  full_name: '', nickname: '', generation: 'kids',
  relationship: 'Cousin', birth_year: '', bio: '', avatar_url: '',
  phone: '', facebook_url: '', instagram_url: '', birthday: '', location: '',
}

const inputClass = 'w-full rounded-lg border border-gold/20 bg-white/5 px-3 py-2.5 text-sm text-cream placeholder:text-cream/25 outline-none transition-colors focus:border-gold/60'

const DEFAULT_HEADER = {
  eyebrow: 'Silva Family',
  title: 'Family Members',
  subtitle: 'The people who make us who we are',
}

function formatBirthday(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function SocialIcons({ member, size = 'sm' }) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5'
  const btnSize = size === 'sm'
    ? 'h-7 w-7'
    : 'h-9 w-9'
  if (!member.facebook_url && !member.instagram_url) return null
  return (
    <div className="flex items-center gap-2">
      {member.facebook_url && (
        <a
          href={member.facebook_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className={`${btnSize} inline-flex items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 transition-all hover:border-blue-400 hover:bg-blue-500/25 hover:text-blue-300 hover:shadow-[0_0_12px_rgba(59,130,246,0.3)]`}
          title="Facebook"
        >
          <FacebookIcon className={iconSize} />
        </a>
      )}
      {member.instagram_url && (
        <a
          href={member.instagram_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className={`${btnSize} inline-flex items-center justify-center rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-400 transition-all hover:border-pink-400 hover:bg-pink-500/25 hover:text-pink-300 hover:shadow-[0_0_12px_rgba(236,72,153,0.3)]`}
          title="Instagram"
        >
          <InstagramIcon className={iconSize} />
        </a>
      )}
    </div>
  )
}

export default function FamilyMembers() {
  const { user, isAdmin } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeGen, setActiveGen] = useState('all')
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [header, setHeader] = useState(DEFAULT_HEADER)
  const [editHeaderOpen, setEditHeaderOpen] = useState(false)
  const [headerDraft, setHeaderDraft] = useState(DEFAULT_HEADER)
  const [headerSaving, setHeaderSaving] = useState(false)

  useEffect(() => {
    fetchMembers()
    fetchHeader()
  }, [])

  async function fetchHeader() {
    if (!supabase) return
    const { data } = await supabase
      .from('page_settings')
      .select('eyebrow, title, subtitle')
      .eq('page', 'members')
      .maybeSingle()
    if (data) {
      setHeader({
        eyebrow: data.eyebrow ?? '',
        title: data.title ?? DEFAULT_HEADER.title,
        subtitle: data.subtitle ?? '',
      })
    }
  }

  function openHeaderEditor() {
    setHeaderDraft(header)
    setEditHeaderOpen(true)
  }

  async function saveHeader() {
    if (!supabase) return
    setHeaderSaving(true)
    setError(null)
    const payload = {
      page: 'members',
      eyebrow: headerDraft.eyebrow.trim() || null,
      title: headerDraft.title.trim() || DEFAULT_HEADER.title,
      subtitle: headerDraft.subtitle.trim() || null,
      updated_at: new Date().toISOString(),
    }
    const { error: upsertError } = await supabase
      .from('page_settings')
      .upsert(payload, { onConflict: 'page' })
    setHeaderSaving(false)
    if (upsertError) {
      setError(upsertError.message)
      return
    }
    setHeader({
      eyebrow: payload.eyebrow ?? '',
      title: payload.title,
      subtitle: payload.subtitle ?? '',
    })
    setEditHeaderOpen(false)
  }

  async function fetchMembers() {
    setLoading(true)
    setError(null)
    if (!supabase) {
      setError('Supabase is not configured.')
      setLoading(false)
      return
    }
    const { data, error: fetchError } = await supabase
      .from('family_members')
      .select('*')
      .order('generation', { ascending: true })
      .order('created_at', { ascending: true })
    if (fetchError) setError(fetchError.message)
    setMembers(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditTarget(null)
    setForm(emptyForm)
    setAvatarPreview(null)
    setError(null)
    setShowAdd(true)
  }

  function openEdit(member) {
    setEditTarget(member)
    setForm({
      full_name: member.full_name || '',
      nickname: member.nickname || '',
      generation: member.generation || 'kids',
      relationship: member.relationship || 'Cousin',
      birth_year: member.birth_year || '',
      bio: member.bio || '',
      avatar_url: member.avatar_url || '',
      phone: member.phone || '',
      facebook_url: member.facebook_url || '',
      instagram_url: member.instagram_url || '',
      birthday: member.birthday || '',
      location: member.location || '',
    })
    setAvatarPreview(member.avatar_url || null)
    setError(null)
    setShowAdd(true)
  }

  async function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const result = await uploadToCloudinary(file)
      setForm(f => ({ ...f, avatar_url: result.url }))
    } catch (err) {
      setError('Photo upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!form.full_name.trim()) { setError('Full name is required'); return }
    setSaving(true)
    setError(null)
    const payload = {
      full_name: form.full_name.trim(),
      nickname: form.nickname.trim() || null,
      generation: form.generation,
      relationship: form.relationship,
      birth_year: form.birth_year ? Number(form.birth_year) : null,
      bio: form.bio.trim() || null,
      avatar_url: form.avatar_url || null,
      phone: form.phone.trim() || null,
      facebook_url: form.facebook_url.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
      birthday: form.birthday || null,
      location: form.location.trim() || null,
    }
    let err
    let savedMember
    if (editTarget) {
      const res = await supabase.from('family_members').update(payload).eq('id', editTarget.id).select().single()
      err = res.error
      savedMember = res.data
    } else {
      const res = await supabase.from('family_members').insert(payload).select().single()
      err = res.error
      savedMember = res.data
    }
    setSaving(false)
    if (err) { setError(err.message); return }
    setShowAdd(false)
    setEditTarget(null)
    setSelected(prev => prev?.id === savedMember?.id ? savedMember : prev)
    fetchMembers()
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this family member?')) return
    setSaving(true)
    setError(null)
    const { error: deleteError } = await supabase.from('family_members').delete().eq('id', id)
    setSaving(false)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setShowAdd(false)
    setSelected(null)
    fetchMembers()
  }

  const filtered = activeGen === 'all' ? members : members.filter(m => memberGeneration(m) === activeGen)

  return (
    <main className="min-h-screen bg-dark px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="group/header relative">
            {header.eyebrow && (
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold/70">{header.eyebrow}</p>
            )}
            <h1 className="mt-2 font-serif text-4xl font-bold text-gold sm:text-5xl">{header.title}</h1>
            {header.subtitle && (
              <p className="mt-1 text-sm text-cream/50">{header.subtitle}</p>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={openHeaderEditor}
                title="Edit page header"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-gold/70 transition-all hover:border-gold/55 hover:bg-gold/10 hover:text-gold"
              >
                <Settings2 className="h-3 w-3" /> Edit Header
              </button>
            )}
          </div>
          {isAdmin && (
            <button onClick={openAdd}
              className="flex items-center gap-2 rounded border border-gold/40 bg-gold/15 px-4 py-2.5 text-sm font-semibold uppercase tracking-widest text-gold transition-all hover:bg-gold/25">
              <Plus className="h-4 w-4" /> Add Member
            </button>
          )}
        </div>

        {/* Generation Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {GENERATIONS.map(g => (
            <button key={g.value} onClick={() => setActiveGen(g.value)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition-all ${activeGen === g.value ? 'border-gold bg-gold text-dark' : 'border-gold/30 text-gold/60 hover:border-gold hover:text-gold'}`}>
              {g.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="font-serif text-xl text-cream/40">No members yet</p>
            {isAdmin && (
              <button onClick={openAdd} className="mt-4 text-sm text-gold underline underline-offset-4">
                Add the first member
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map(member => (
              <motion.div key={member.id} whileHover={{ scale: 1.03 }} className="group relative">
                {isAdmin && (
                  <button
                    onClick={e => { e.stopPropagation(); openEdit(member) }}
                    className="absolute right-2 top-2 z-10 hidden rounded-full border border-gold/30 bg-dark/80 p-1.5 text-gold/60 transition-all hover:bg-gold/20 hover:text-gold group-hover:flex">
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
                <button onClick={() => setSelected(member)}
                  className="flex w-full flex-col items-center gap-3 rounded-xl border border-gold/10 bg-black/20 px-3 py-5 text-center transition-all hover:border-gold/35 hover:bg-gold/5">
                  <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-gold/20 bg-gold/10 shadow-lg transition-all group-hover:border-gold/60 group-hover:shadow-[0_0_25px_rgba(201,169,110,0.2)]">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.full_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="font-serif text-3xl font-bold text-gold/60">
                          {member.full_name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="font-serif text-sm font-semibold text-cream">{member.full_name}</p>
                    {member.nickname && <p className="text-xs text-cream/40">&ldquo;{member.nickname}&rdquo;</p>}
                    <span className="inline-block rounded-full border border-gold/20 bg-gold/10 px-2 py-0.5 text-xs text-gold">
                      {member.relationship}
                    </span>
                    {member.location && (
                      <span className="inline-flex items-center gap-1 text-xs text-cream/35">
                        <MapPin className="h-3 w-3" /> {member.location}
                      </span>
                    )}
                    <SocialIcons member={member} size="sm" />
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Side Panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)} className="fixed inset-0 z-30 bg-black/50" />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 z-40 flex h-full w-full max-w-sm flex-col border-l border-gold/15 bg-dark shadow-2xl">
              <div className="flex items-center justify-between border-b border-gold/15 px-5 py-4">
                <h2 className="font-serif text-lg text-gold">{selected.full_name}</h2>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button onClick={() => { setSelected(null); openEdit(selected) }}
                      className="rounded p-1.5 text-cream/50 hover:text-gold">
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => setSelected(null)} className="text-cream/50 hover:text-gold">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Avatar + Core Info */}
                <div className="flex flex-col items-center gap-4 border-b border-gold/10 px-5 py-8">
                  <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-gold/40 bg-dark shadow-[0_0_30px_rgba(201,169,110,0.15)]">
                    {selected.avatar_url ? (
                      <img src={selected.avatar_url} alt={selected.full_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gold/10">
                        <span className="font-serif text-4xl font-bold text-gold/50">{selected.full_name?.[0]}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="font-serif text-xl font-bold text-cream">{selected.full_name}</h3>
                    {selected.nickname && (
                      <p className="mt-0.5 text-sm text-cream/50">&ldquo;{selected.nickname}&rdquo;</p>
                    )}
                    <span className="mt-2 inline-block rounded-full border border-gold/30 bg-gold/10 px-3 py-0.5 text-xs font-medium uppercase tracking-wider text-gold">
                      {selected.relationship}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4 border-b border-gold/10 px-5 py-6">
                  {(selected.birthday || selected.birth_year) && (
                    <div className="flex items-start gap-3">
                      <Cake className="mt-0.5 h-4 w-4 shrink-0 text-gold/60" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-cream/40">Birthday</p>
                        <p className="text-sm text-cream">
                          {selected.birthday ? formatBirthday(selected.birthday) : `b. ${selected.birth_year}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {selected.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold/60" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-cream/40">Location</p>
                        <p className="text-sm text-cream">{selected.location}</p>
                      </div>
                    </div>
                  )}

                  {user && selected.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold/60" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-cream/40">Phone</p>
                        <a href={`tel:${selected.phone}`} className="text-sm font-medium text-gold transition-colors hover:text-gold/80">
                          {selected.phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bio */}
                {selected.bio && (
                  <div className="border-b border-gold/10 px-5 py-6">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream/40">About</p>
                    <p className="text-sm leading-relaxed text-cream/70">{selected.bio}</p>
                  </div>
                )}

                {/* Social Links */}
                {(selected.facebook_url || selected.instagram_url) && (
                  <div className="px-5 py-6">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-cream/40">Social Media</p>
                    <div className="flex gap-3">
                      {selected.facebook_url && (
                        <a
                          href={selected.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400 transition-all hover:border-blue-400 hover:bg-blue-500/25 hover:shadow-[0_0_16px_rgba(59,130,246,0.25)]"
                        >
                          <FacebookIcon className="h-4 w-4" /> Facebook
                        </a>
                      )}
                      {selected.instagram_url && (
                        <a
                          href={selected.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-pink-500/30 bg-pink-500/10 px-4 py-2 text-sm font-medium text-pink-400 transition-all hover:border-pink-400 hover:bg-pink-500/25 hover:shadow-[0_0_16px_rgba(236,72,153,0.25)]"
                        >
                          <InstagramIcon className="h-4 w-4" /> Instagram
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)} className="fixed inset-0 z-40 bg-black/60" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="pointer-events-auto w-full max-w-md rounded-xl border border-gold/20 bg-dark p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-serif text-xl text-gold">{editTarget ? 'Edit Member' : 'Add Member'}</h2>
                <button onClick={() => setShowAdd(false)} className="text-cream/50 hover:text-gold">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Avatar */}
              <div className="mb-5 flex flex-col items-center">
                <label className="cursor-pointer">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-gold/30 bg-gold/10 hover:border-gold/60">
                    {avatarPreview ? (
                      <img src={avatarPreview} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-xs text-gold/40">Photo</span>
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="h-5 w-5 animate-spin text-gold" />
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
                <p className="mt-1 text-xs text-cream/30">Click to upload photo</p>
              </div>

              <div className="flex flex-col gap-3">
                <input placeholder="Full Name *" value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className={inputClass} />
                <input placeholder="Nickname e.g. Lolo Jun" value={form.nickname}
                  onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} className={inputClass} />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.generation}
                    onChange={e => setForm(f => ({ ...f, generation: e.target.value }))}
                    className={inputClass + ' bg-dark'}>
                    <option value="lolo_lola">Lolo/Lola</option>
                    <option value="parents">Parents</option>
                    <option value="kids">Kids</option>
                  </select>
                  <select value={form.relationship}
                    onChange={e => {
                      const relationship = e.target.value
                      setForm(f => ({
                        ...f,
                        relationship,
                        generation: RELATIONSHIP_TO_GEN[relationship] || f.generation,
                      }))
                    }}
                    className={inputClass + ' bg-dark'}>
                    {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>

                {/* Birthday (date) */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gold/70">Birthday</label>
                  <input type="date" value={form.birthday}
                    onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))}
                    className={inputClass + ' bg-dark'} />
                </div>

                <input placeholder="Birth Year e.g. 1970 (fallback if no birthday)" type="number" value={form.birth_year}
                  onChange={e => setForm(f => ({ ...f, birth_year: e.target.value }))} className={inputClass} />

                <input placeholder="Location e.g. Lian, Batangas" value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inputClass} />

                <textarea placeholder="Short bio or memory..." value={form.bio} rows={3}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  className={inputClass + ' resize-none'} />

                {/* Contact & Social section */}
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gold/50">Contact & Social</p>

                <input placeholder="Phone number e.g. +63 917 123 4567" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} />

                <input placeholder="Facebook URL" value={form.facebook_url}
                  onChange={e => setForm(f => ({ ...f, facebook_url: e.target.value }))} className={inputClass} />

                <input placeholder="Instagram URL" value={form.instagram_url}
                  onChange={e => setForm(f => ({ ...f, instagram_url: e.target.value }))} className={inputClass} />

                {error && <p className="text-xs text-red-400">{error}</p>}

                <button onClick={handleSave} disabled={saving || uploading}
                  className="w-full rounded-lg border border-gold bg-gold/20 py-2.5 text-sm font-semibold uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-dark disabled:opacity-50">
                  {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : editTarget ? 'Save Changes' : 'Add Member'}
                </button>

                {editTarget && (
                  <button onClick={() => handleDelete(editTarget.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 py-2.5 text-sm font-semibold text-red-400 transition-all hover:bg-red-400/20">
                    <Trash2 className="h-4 w-4" /> Remove Member
                  </button>
                )}
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Header Modal */}
      <AnimatePresence>
        {editHeaderOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditHeaderOpen(false)} className="fixed inset-0 z-40 bg-black/60" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="pointer-events-auto w-full max-w-md rounded-xl border border-gold/20 bg-dark p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-serif text-xl text-gold">Edit Page Header</h2>
                  <button onClick={() => setEditHeaderOpen(false)} className="text-cream/50 hover:text-gold">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gold/70">Eyebrow</label>
                    <input value={headerDraft.eyebrow}
                      onChange={e => setHeaderDraft(d => ({ ...d, eyebrow: e.target.value }))}
                      placeholder="Silva Family" className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gold/70">Title</label>
                    <input value={headerDraft.title}
                      onChange={e => setHeaderDraft(d => ({ ...d, title: e.target.value }))}
                      placeholder="Family Members" className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gold/70">Subtitle</label>
                    <textarea value={headerDraft.subtitle} rows={2}
                      onChange={e => setHeaderDraft(d => ({ ...d, subtitle: e.target.value }))}
                      placeholder="The people who make us who we are"
                      className={inputClass + ' resize-none'} />
                  </div>

                  {error && <p className="text-xs text-red-400">{error}</p>}

                  <button onClick={saveHeader} disabled={headerSaving}
                    className="w-full rounded-lg border border-gold bg-gold/20 py-2.5 text-sm font-semibold uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-dark disabled:opacity-50">
                    {headerSaving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Save Header'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}