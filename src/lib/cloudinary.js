const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY
const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET
const uploadPreset =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'family_gallery'

async function sha1Hex(message) {
  const buffer = await crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(message),
  )
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function signParams(params) {
  if (!apiSecret) {
    throw new Error('VITE_CLOUDINARY_API_SECRET is required for signed Cloudinary requests.')
  }
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  return sha1Hex(sorted + apiSecret)
}

export function isCloudinaryConfigured() {
  return Boolean(cloudName && (uploadPreset || (apiKey && apiSecret)))
}

/**
 * Upload image to Cloudinary. Uses unsigned preset when set, otherwise signed upload.
 * @returns {{ url, public_id, width, height }}
 */
export function uploadToCloudinary(file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!cloudName) {
      reject(new Error('VITE_CLOUDINARY_CLOUD_NAME is not configured.'))
      return
    }

    const runUpload = async () => {
      const formData = new FormData()
      formData.append('file', file)

      if (uploadPreset) {
        formData.append('upload_preset', uploadPreset)
      } else if (apiKey && apiSecret) {
        const timestamp = Math.round(Date.now() / 1000)
        const signature = await signParams({ timestamp })
        formData.append('api_key', apiKey)
        formData.append('timestamp', String(timestamp))
        formData.append('signature', signature)
      } else {
        reject(
          new Error(
            'Set VITE_CLOUDINARY_UPLOAD_PRESET or VITE_CLOUDINARY_API_KEY + VITE_CLOUDINARY_API_SECRET.',
          ),
        )
        return
      }

      const xhr = new XMLHttpRequest()
      xhr.open(
        'POST',
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      )

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100))
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            resolve({
              url: data.secure_url,
              public_id: data.public_id,
              width: data.width,
              height: data.height,
            })
          } catch {
            reject(new Error('Invalid response from Cloudinary.'))
          }
        } else {
          let message = 'Cloudinary upload failed.'
          try {
            const err = JSON.parse(xhr.responseText)
            message = err.error?.message || message
          } catch {
            /* use default */
          }
          reject(new Error(message))
        }
      }

      xhr.onerror = () => reject(new Error('Network error during upload.'))
      xhr.send(formData)
    }

    runUpload().catch(reject)
  })
}

/** Delete image from Cloudinary by public_id (signed destroy). */
export async function deleteFromCloudinary(publicId) {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured for delete.')
  }

  const timestamp = Math.round(Date.now() / 1000)
  const signature = await signParams({ public_id: publicId, timestamp })

  const body = new URLSearchParams({
    public_id: publicId,
    api_key: apiKey,
    timestamp: String(timestamp),
    signature,
  })

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    { method: 'POST', body },
  )

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error?.message || 'Failed to delete from Cloudinary.')
  }

  return data
}