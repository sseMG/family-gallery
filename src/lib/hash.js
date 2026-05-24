/**
 * Generate SHA-256 hash of an image file for duplicate detection
 * @param {File} file - The image file to hash
 * @returns {Promise<string>} - The hex hash string
 */
export async function generateImageHash(file) {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Check if an image with the given hash already exists in the database
 * @param {string} hash - The hash to check
 * @param {object} supabase - Supabase client instance
 * @returns {Promise<boolean>} - True if duplicate exists
 */
export async function checkDuplicateHash(hash, supabase) {
  if (!supabase) throw new Error('Supabase is not configured.')
  
  const { data, error } = await supabase
    .from('photos')
    .select('id')
    .eq('hash', hash)
    .single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    throw new Error(`Error checking duplicate: ${error.message}`)
  }
  
  return !!data
}
