import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Pencil, Trash2, Loader2, Settings2 } from 'lucide-react'
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
}

const inputClass = 'w-full rounded-lg border border-gold/20 bg-white/5 px-3 py-2.5 text-sm text-cream placeholder:text-cream/25 outline-none transition-colors focus:border-gold/60'

const DEFAULT_HEADER = {
  eyebrow: 'Silva Family',
  title: 'Family Members',
  subtitle: 'The people who make us who we are',
}

export default function FamilyMembers() {
  const { user } = useAuth()
  const isAdmin = Boolean(user)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeGen, setActiveGen] = useState('all')
  const [selected, setSelected] = useState(null)
  const [memberPhotos, setMemberPhotos] = useState([])
  const [photosLoading, setPhotosLoading] = useState(false)
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

  async function handleMemberClick(member) {
    setSelected(member)
    setMemberPhotos([])
    setPhotosLoading(true)
    const { data, error: photosError } = await supabase
      .from('photo_family_members')
      .select('photos(id, url, caption, year, aspect)')
      .eq('member_id', member.id)
      .limit(24)
    if (photosError) setError(photosError.message)
    setMemberPhotos((data || []).map(item => item.photos).filter(Boolean))
    setPhotosLoading(false)
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
      ...form,
      full_name: form.full_name.trim(),
      nickname: form.nickname.trim() || null,
      birth_year: form.birth_year ? Number(form.birth_year) : null,
      bio: form.bio.trim() || null,
      avatar_url: form.avatar_url || null,
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
                {/* Edit button */}
                {isAdmin && (
                  <button
                    onClick={e => { e.stopPropagation(); openEdit(member) }}
                    className="absolute right-2 top-2 z-10 hidden rounded-full border border-gold/30 bg-dark/80 p-1.5 text-gold/60 transition-all hover:bg-gold/20 hover:text-gold group-hover:flex">
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
                <button onClick={() => handleMemberClick(member)}
                  className="flex w-full flex-col items-center gap-3 rounded-xl border border-gold/10 bg-black/20 px-3 py-5 text-center transition-all hover:border-gold/35 hover:bg-gold/5">
                  {/* Avatar */}
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
                  <div>
                    <p className="font-serif text-sm font-semibold text-cream">{member.full_name}</p>
                    {member.nickname && <p className="text-xs text-cream/40">"{member.nickname}"</p>}
                    <span className="mt-1 inline-block rounded-full border border-gold/20 bg-gold/10 px-2 py-0.5 text-xs text-gold">
                      {member.relationship}
                    </span>
                    {member.birth_year && <p className="mt-1 text-xs text-cream/30">b. {member.birth_year}</p>}
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

              <div className="flex flex-col items-center gap-3 border-b border-gold/10 px-5 py-6">
                <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-gold/40 bg-dark">
                  {selected.avatar_url ? (
                    <img src={selected.avatar_url} alt={selected.full_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gold/10">
                      <span className="font-serif text-3xl font-bold text-gold/50">{selected.full_name?.[0]}</span>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  {selected.nickname && <p className="text-sm text-cream/50">"{selected.nickname}"</p>}
                  <span className="mt-1 inline-block rounded-full border border-gold/30 bg-gold/10 px-3 py-0.5 text-xs font-medium uppercase tracking-wider text-gold">
                    {selected.relationship}
                  </span>
                  {selected.birth_year && <p className="mt-1 text-xs text-cream/40">b. {selected.birth_year}</p>}
                  {selected.bio && <p className="mt-3 text-sm leading-relaxed text-cream/60">{selected.bio}</p>}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-widest text-cream/40">Photos</p>
                {photosLoading ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="aspect-square animate-pulse rounded bg-gold/10" />
                    ))}
                  </div>
                ) : memberPhotos.length === 0 ? (
                  <p className="py-8 text-center text-sm text-cream/30">No photos yet</p>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {memberPhotos.map(p => (
                      <div key={p.id} className="aspect-square overflow-hidden rounded border border-gold/10">
                        <img src={p.url} alt={p.caption || ''} className="h-full w-full object-cover" />
                      </div>
                    ))}
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
                <input placeholder="Birth Year e.g. 1970" type="number" value={form.birth_year}
                  onChange={e => setForm(f => ({ ...f, birth_year: e.target.value }))} className={inputClass} />
                <textarea placeholder="Short bio or memory..." value={form.bio} rows={3}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  className={inputClass + ' resize-none'} />

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