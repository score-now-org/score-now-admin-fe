export function attachmentName(disposition, fallback) {
  const encoded = /(?:^|;)\s*filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposition || '')
  if (!encoded) return fallback
  try { return decodeURIComponent(encoded[1].trim()) || fallback } catch { return fallback }
}

export function imageContentType(name) {
  if (/\.png$/i.test(name)) return 'image/png'
  if (/\.jpe?g$/i.test(name)) return 'image/jpeg'
  return ''
}
