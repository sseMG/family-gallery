import UploadModal from '../ui/Modal'
import { useStore } from '../../store'
import { usePhotos } from '../../hooks/usePhotos'

export default function UploadModalHost() {
  const open = useStore((s) => s.uploadModalOpen)
  const setUploadModalOpen = useStore((s) => s.setUploadModalOpen)
  const { fetchPhotos } = usePhotos()

  return (
    <UploadModal
      open={open}
      onClose={() => setUploadModalOpen(false)}
      onSuccess={() => fetchPhotos()}
    />
  )
}
