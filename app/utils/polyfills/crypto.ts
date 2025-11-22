const ensureCrypto = () => {
  const globalScope = globalThis as typeof globalThis & { crypto?: Crypto & Record<string, unknown> }

  if (typeof globalScope.crypto !== 'object' || globalScope.crypto === null) {
    globalScope.crypto = {} as Crypto & Record<string, unknown>
  }

  const cryptoObj = globalScope.crypto as Crypto & Record<string, unknown>

  if (typeof cryptoObj.getRandomValues !== 'function') {
    cryptoObj.getRandomValues = getRandomValuesFallback as Crypto['getRandomValues']
  }

  if (typeof cryptoObj.randomUUID !== 'function') {
    cryptoObj.randomUUID = randomUUIDFallback as Crypto['randomUUID']
  }
}

const getRandomValuesFallback = <T extends ArrayBufferView>(array: T): T => {
  const view = new Uint8Array(array.buffer, array.byteOffset, array.byteLength)
  for (let i = 0; i < view.length; i += 1) {
    view[i] = Math.floor(Math.random() * 256)
  }
  return array
}

const randomUUIDFallback = (): string => {
  const bytes = getRandomValuesFallback(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-')
}

ensureCrypto()

export {}
