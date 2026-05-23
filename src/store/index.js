import { create } from 'zustand'

export const useStore = create((set) => ({
  user: null,
  photos: [],
  selectedAlbum: null,

  setUser: (user) => set({ user }),
  setPhotos: (photos) => set({ photos }),
  setSelectedAlbum: (selectedAlbum) => set({ selectedAlbum }),
}))
