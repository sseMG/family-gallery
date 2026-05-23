/** Normalize DB row for UI (aspect, display URL, favorites). */
export function normalizePhoto(row, { favoriteIds } = {}) {
  if (!row) return null
  const width = row.width ?? null
  const height = row.height ?? null
  const favoriteCount = row.favorites?.[0]?.count ?? row.favorite_count ?? 0

  return {
    ...row,
    aspect: row.aspect || deriveAspect(width, height),
    favorite_count: favoriteCount,
    is_favorited: favoriteIds ? favoriteIds.has(row.id) : Boolean(row.is_favorited),
  }
}

export function deriveAspect(width, height) {
  if (!width || !height) return null
  return parseFloat((width / height).toFixed(4))
}

export function getPhotoDisplayUrl(photo, width) {
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
