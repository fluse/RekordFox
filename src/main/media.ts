import { createReadStream, statSync } from 'fs'
import { extname } from 'path'
import { Readable } from 'stream'

// Node's `stream/web` ReadableStream type and the DOM lib's ReadableStream type
// (expected by the global Response constructor) are structurally incompatible
// in TS even though they're the same object at runtime.
function toResponseBody(stream: Readable): ReadableStream<Uint8Array> {
  return Readable.toWeb(stream) as unknown as ReadableStream<Uint8Array>
}

const MIME_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/opus',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
}

function getMimeType(filePath: string): string {
  return MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
}

function parseFilePathFromRequestUrl(requestUrl: string): string {
  let filePath = requestUrl
  const prefix = 'media://'
  if (filePath.toLowerCase().startsWith(prefix)) {
    filePath = filePath.slice(prefix.length)
  }
  if (filePath.startsWith('local/')) {
    filePath = filePath.slice('local/'.length)
  }

  if (process.platform !== 'win32' && !filePath.startsWith('/')) {
    filePath = '/' + filePath
  }
  if (process.platform === 'win32' && filePath.startsWith('/')) {
    filePath = filePath.slice(1)
  }

  return decodeURIComponent(filePath)
}

// Serves local media files with byte-range support so <audio>/<video> elements can seek.
// A plain net.fetch(file://...) always returns the full body with a 200, which browsers
// treat as non-seekable — Range requests must be honored with a real 206 response.
export function handleMediaRequest(request: Request): Response {
  try {
    const filePath = parseFilePathFromRequestUrl(request.url)
    const stat = statSync(filePath)
    const fileSize = stat.size
    const mimeType = getMimeType(filePath)

    const rangeHeader = request.headers.get('Range')
    if (rangeHeader) {
      const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader)
      let start = match?.[1] ? parseInt(match[1], 10) : 0
      let end = match?.[2] ? parseInt(match[2], 10) : fileSize - 1
      if (Number.isNaN(start) || start < 0) start = 0
      if (Number.isNaN(end) || end > fileSize - 1) end = fileSize - 1

      if (start > end) {
        return new Response(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` }
        })
      }

      const stream = createReadStream(filePath, { start, end })
      return new Response(toResponseBody(stream), {
        status: 206,
        headers: {
          'Content-Type': mimeType,
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(end - start + 1)
        }
      })
    }

    const stream = createReadStream(filePath)
    return new Response(toResponseBody(stream), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(fileSize),
        'Accept-Ranges': 'bytes'
      }
    })
  } catch (err) {
    console.error('[Media Protocol] Failed to handle request:', err)
    return new Response('File not found', { status: 404 })
  }
}
