import { createReadStream, statSync } from 'fs'
import { extname } from 'path'
import { Readable } from 'stream'
import { getStreamUrl } from './downloader'

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

// Proxies playback of a YouTube video's audio stream through the main process (rather than
// pointing the renderer straight at the resolved googlevideo URL), so the page's CSP never
// needs to allow arbitrary external media hosts — from the renderer's perspective this is just
// another media:// request.
export async function handleYoutubeStreamRequest(request: Request): Promise<Response> {
  try {
    const videoId = decodeURIComponent(request.url.slice('media://youtube/'.length).split('?')[0])
    const streamUrl = await getStreamUrl(videoId)

    // googlevideo's CDN stalls indefinitely on a request with no Range header at all (it expects
    // a real player to fetch incrementally), so we always send one upstream — but only pass a
    // 206 back to our own caller if it actually asked for a range itself, translating an
    // internally-forced range back into a plain 200 otherwise.
    const clientRangeHeader = request.headers.get('Range')
    const upstream = await fetch(streamUrl, { headers: { Range: clientRangeHeader || 'bytes=0-' } })

    if (!upstream.ok) {
      return new Response('Stream not available', { status: 502 })
    }

    const headers: Record<string, string> = {
      'Content-Type': upstream.headers.get('Content-Type') || 'audio/webm',
      'Accept-Ranges': 'bytes'
    }

    if (clientRangeHeader) {
      const contentRange = upstream.headers.get('Content-Range')
      const contentLength = upstream.headers.get('Content-Length')
      if (contentRange) headers['Content-Range'] = contentRange
      if (contentLength) headers['Content-Length'] = contentLength
      return new Response(upstream.body, { status: upstream.status, headers })
    }

    // Client made a plain (non-range) request — respond with the full body as a normal 200,
    // even though we had to ask the CDN for an explicit range ourselves to avoid it stalling.
    const totalLength = upstream.headers.get('Content-Range')?.split('/')[1]
    if (totalLength) headers['Content-Length'] = totalLength
    return new Response(upstream.body, { status: 200, headers })
  } catch (err) {
    console.error('[Media Protocol] Failed to proxy YouTube stream:', err)
    return new Response('Stream not available', { status: 502 })
  }
}
