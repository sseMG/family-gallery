/** Placeholder gallery data until Supabase is connected. */

const pic = (seed, w = 800, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`

export const photos = [
  { id: 'p1', seed: 'silva-1', year: 2024, caption: 'Summer evening on the porch', albumId: 'vacation-2024', aspect: 'tall' },
  { id: 'p2', seed: 'silva-2', year: 2024, caption: 'Sunday brunch together', albumId: 'vacation-2024', aspect: 'wide' },
  { id: 'p3', seed: 'silva-3', year: 2024, caption: 'Birthday candles and laughter', albumId: 'graduation-2024', aspect: 'square' },
  { id: 'p4', seed: 'silva-4', year: 2024, caption: 'Graduation day pride', albumId: 'graduation-2024', aspect: 'tall' },
  { id: 'p5', seed: 'silva-5', year: 2023, caption: 'Christmas morning light', albumId: 'christmas-2023', aspect: 'wide' },
  { id: 'p6', seed: 'silva-6', year: 2023, caption: 'Tree trimming with the kids', albumId: 'christmas-2023', aspect: 'tall' },
  { id: 'p7', seed: 'silva-7', year: 2023, caption: 'Fireplace and cocoa', albumId: 'christmas-2023', aspect: 'square' },
  { id: 'p8', seed: 'silva-8', year: 2023, caption: 'Coastal walk at golden hour', albumId: 'vacation-2023', aspect: 'wide' },
  { id: 'p9', seed: 'silva-9', year: 2023, caption: 'Harbor boats at dusk', albumId: 'vacation-2023', aspect: 'tall' },
  { id: 'p10', seed: 'silva-10', year: 2022, caption: 'Backyard barbecue', albumId: 'summer-2022', aspect: 'square' },
  { id: 'p11', seed: 'silva-11', year: 2022, caption: 'Road trip rest stop smiles', albumId: 'summer-2022', aspect: 'wide' },
  { id: 'p12', seed: 'silva-12', year: 2022, caption: 'Anniversary dinner toast', albumId: 'anniversary-2022', aspect: 'tall' },
  { id: 'p13', seed: 'silva-13', year: 2021, caption: 'First snow of the season', albumId: 'winter-2021', aspect: 'wide' },
  { id: 'p14', seed: 'silva-14', year: 2021, caption: 'Holiday table setting', albumId: 'winter-2021', aspect: 'tall' },
  { id: 'p15', seed: 'silva-15', year: 2021, caption: 'Park picnic under the oaks', albumId: 'spring-2021', aspect: 'square' },
  { id: 'p16', seed: 'silva-16', year: 2020, caption: 'Quiet evening at home', albumId: 'home-2020', aspect: 'tall' },
  { id: 'p17', seed: 'silva-17', year: 2020, caption: 'Garden blooms in May', albumId: 'home-2020', aspect: 'wide' },
  { id: 'p18', seed: 'silva-18', year: 2020, caption: 'Family game night', albumId: 'home-2020', aspect: 'square' },
  { id: 'p19', seed: 'silva-19', year: 2019, caption: 'New Year sparklers', albumId: 'new-year-2019', aspect: 'wide' },
  { id: 'p20', seed: 'silva-20', year: 2019, caption: 'Autumn leaves and sweaters', albumId: 'new-year-2019', aspect: 'tall' },
]

export const albums = [
  {
    id: 'christmas-2023',
    title: 'Christmas 2023',
    year: 2023,
    coverSeed: 'silva-5',
    description: 'Holiday warmth at home',
  },
  {
    id: 'vacation-2024',
    title: 'Summer Vacation 2024',
    year: 2024,
    coverSeed: 'silva-1',
    description: 'Sun, sea, and togetherness',
  },
  {
    id: 'graduation-2024',
    title: 'Graduation',
    year: 2024,
    coverSeed: 'silva-4',
    description: 'A milestone worth celebrating',
  },
  {
    id: 'vacation-2023',
    title: 'Coastal Getaway',
    year: 2023,
    coverSeed: 'silva-8',
    description: 'Salt air and slow mornings',
  },
  {
    id: 'summer-2022',
    title: 'Summer 2022',
    year: 2022,
    coverSeed: 'silva-10',
    description: 'Long days and loud laughter',
  },
  {
    id: 'anniversary-2022',
    title: 'Anniversary',
    year: 2022,
    coverSeed: 'silva-12',
    description: 'Another year of us',
  },
  {
    id: 'winter-2021',
    title: 'Winter Memories',
    year: 2021,
    coverSeed: 'silva-13',
    description: 'Cozy nights in',
  },
  {
    id: 'home-2020',
    title: 'At Home',
    year: 2020,
    coverSeed: 'silva-16',
    description: 'Everyday moments that matter',
  },
]

export const GALLERY_YEARS = [2020, 2021, 2022, 2023, 2024, 'All']

export const TIMELINE_YEARS = [2024, 2023, 2022, 2021, 2020, 2019]

export function getPhotoUrl(photo, width = 800, height = 600) {
  const h =
    photo.aspect === 'tall' ? Math.round(height * 1.35) : photo.aspect === 'wide' ? Math.round(height * 0.72) : height
  const w = photo.aspect === 'wide' ? Math.round(width * 1.25) : width
  return pic(photo.seed, w, h)
}

export function getCoverUrl(seed, size = 600) {
  return pic(seed, size, size)
}

export function getPhotosByYear(year) {
  if (year === 'All') return photos
  return photos.filter((p) => p.year === year)
}

export function getPhotosByAlbum(albumId) {
  return photos.filter((p) => p.albumId === albumId)
}

export function getAlbumById(id) {
  return albums.find((a) => a.id === id)
}

export function getAlbumPhotoCount(albumId) {
  return getPhotosByAlbum(albumId).length
}

export function getPhotosGroupedByYear(years = TIMELINE_YEARS) {
  return years.map((year) => ({
    year,
    photos: photos.filter((p) => p.year === year),
  }))
}
