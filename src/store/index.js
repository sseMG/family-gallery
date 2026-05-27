import { create } from 'zustand'

export const useStore = create((set) => ({
  user: null,
  photos: [],
  selectedAlbum: null,
  uploadModalOpen: false,
  favoritePhotoIds: new Set(),
  comments: {}, // { [photoId]: Comment[] }

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
  setComments: (photoId, comments) =>
    set((state) => ({
      comments: { ...state.comments, [photoId]: comments },
    })),
  addComment: (photoId, comment) =>
    set((state) => ({
      comments: {
        ...state.comments,
        [photoId]: [comment, ...(state.comments[photoId] || [])],
      },
    })),
  updateComment: (photoId, commentId, updates) =>
    set((state) => ({
      comments: {
        ...state.comments,
        [photoId]: (state.comments[photoId] || []).map((c) =>
          c.id === commentId ? { ...c, ...updates } : c
        ),
      },
    })),
  removeComment: (photoId, commentId) =>
    set((state) => ({
      comments: {
        ...state.comments,
        [photoId]: (state.comments[photoId] || []).filter(
          (c) => c.id !== commentId
        ),
      },
    })),
}))
