import { create } from 'zustand'

export const useStore = create((set) => ({
  user: null,
  photos: [],
  selectedAlbum: null,
  uploadModalOpen: false,
  favoritePhotoIds: new Set(),

  setUser: (user) => set({ user }),
  setPhotos: (photos) => set({ photos }),
  setSelectedAlbum: (selectedAlbum) => set({ selectedAlbum }),
  setUploadModalOpen: (uploadModalOpen) => set({ uploadModalOpen }),
  setFavoritePhotoIds: (ids) =>
    set({ favoritePhotoIds: ids instanceof Set ? ids : new Set(ids) }),
  toggleFavoriteId: (photoId, favorited) =>
    set((state) => {
      const next = new Set(state.favoritePhotoIds)
      if (favorited) next.add(photoId)
      else next.delete(photoId)
      return { favoritePhotoIds: next }
    }),
}))
