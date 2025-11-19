const textEncoder = new TextEncoder();

async function importKey(secret: string) {
  const keyData = textEncoder.encode(secret)
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await importKey(secret)
  const data = textEncoder.encode(message)
  const signature = await crypto.subtle.sign('HMAC', key, data)
  const bytes = new Uint8Array(signature)

  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}