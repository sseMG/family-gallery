/** Normalize DB row for UI (aspect, display URL). */
export function normalizePhoto(row) {
  if (!row) return null
  const width = row.width ?? null
  const height = row.height ?? null
  return {
    ...row,
    aspect: row.aspect || deriveAspect(width, height),
  }
}

export function deriveAspect(width, height) {
  if (!width || !height) return 'square'
  const ratio = width / height
  if (ratio > 1.15) return 'wide'
  if (ratio < 0.85) return 'tall'
  return 'square'
}

export function getPhotoDisplayUrl(photo, width, height) {
  if (!photo?.url) return ''
  const url = photo.url
  if (!width || !url.includes('res.cloudinary.com')) return url
  return url.replace('/upload/', `/upload/w_${width},c_limit/`)
}

export function groupPhotosByYear(photos, yearsDescending = true) {
  const yearSet = new Set(photos.map((p) => p.year).filter(Boolean))
  const years = [...yearSet].sort((a, b) => (yearsDescending ? b - a : a - b))
  return years.map((year) => ({
    year,
    photos: photos.filter((p) => p.year === year),
  }))
}

export function getGalleryYears(photos) {
  const years = [...new Set(photos.map((p) => p.year).filter(Boolean))].sort(
    (a, b) => a - b,
  )
  return [...years, 'All']
}
