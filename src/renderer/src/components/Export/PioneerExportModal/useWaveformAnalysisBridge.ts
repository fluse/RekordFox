import { useEffect } from 'react'
import { analyzeWaveform } from '@renderer/utils/waveform/waveformAnalyzer'

// Bridges the main process's per-track waveform-analysis requests: fetches and decodes the audio
// in the renderer, runs the 3-band analysis, and sends the result back. Failures respond with
// empty data so the backend export queue never freezes.
export function useWaveformAnalysisBridge(isOpen: boolean): void {
  useEffect((): (() => void) | undefined => {
    if (!isOpen) return undefined

    const unsubscribeAnalysis = window.api.onWaveformAnalysisRequest(async (data) => {
      try {
        console.log(`[PioneerExportModal] Analyzing track ${data.trackId} from ${data.filepath}`)

        // Normalize path to media protocol
        const normalized = data.filepath.replace(/\\/g, '/')
        const encoded = normalized.split('/').map(encodeURIComponent).join('/')
        const mediaUrl = `media://${encoded}`

        // Fetch file data into memory
        const response = await fetch(mediaUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch media file for decoding: ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()

        // Decode using OfflineAudioContext (mono)
        const tempCtx = new OfflineAudioContext(1, 1, 44100)
        const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer)
        const channelData = audioBuffer.getChannelData(0)

        // Perform 3-band peak/RMS analysis
        const analysis = await analyzeWaveform(channelData, audioBuffer.sampleRate)

        // Send results back to Main Process
        window.api.sendWaveformAnalysisResponse(data.trackId, analysis)
      } catch (err: unknown) {
        const error = err as Error
        console.error(
          `[PioneerExportModal] Waveform analysis failed for track ${data.trackId}:`,
          error
        )
        // Respond with empty peak/RMS data to prevent freezing the queue
        window.api.sendWaveformAnalysisResponse(data.trackId, { peaks: [], rms: [] })
      }
    })

    return (): void => {
      unsubscribeAnalysis()
    }
  }, [isOpen])
}
