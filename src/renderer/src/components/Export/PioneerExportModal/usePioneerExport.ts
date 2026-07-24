import { useState, useEffect } from 'react'
import type { PioneerExportStep, PioneerProgress } from './types'

const INITIAL_PROGRESS: PioneerProgress = {
  currentTrack: 0,
  totalTracks: 0,
  statusText: 'Initialisiere Export...',
  progressPercent: 0
}

export interface UsePioneerExportResult {
  step: PioneerExportStep
  errorMessage: string
  progress: PioneerProgress
  handleCancel: () => Promise<void>
}

// Drives the Pioneer export: starts the backend job when the modal opens, listens for progress,
// and maps backend results / cancellation into the step state machine.
export function usePioneerExport(
  isOpen: boolean,
  playlistId: string,
  usbPath: string
): UsePioneerExportResult {
  const [step, setStep] = useState<PioneerExportStep>('exporting')
  const [errorMessage, setErrorMessage] = useState('')
  const [progress, setProgress] = useState<PioneerProgress>(INITIAL_PROGRESS)

  useEffect((): (() => void) | undefined => {
    if (!isOpen) return undefined

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep('exporting')
    setErrorMessage('')
    setProgress(INITIAL_PROGRESS)

    // Listen for progress updates from the Main Process
    const unsubscribeProgress = window.api.onPioneerExportProgress((data) => {
      setProgress(data)
      if (data.statusText.startsWith('Fehler:')) {
        setErrorMessage(data.statusText.replace('Fehler:', '').trim())
        setStep('error')
      } else if (data.statusText === 'Export abgebrochen.') {
        setStep('canceled')
      }
    })

    // Start the export in the backend
    window.api
      .startPioneerExport(playlistId, usbPath)
      .then((res) => {
        if (res.success) {
          setStep('success')
        } else if (res.error === 'Export abgebrochen') {
          setStep('canceled')
        } else {
          setErrorMessage(res.error || 'Export fehlgeschlagen.')
          setStep('error')
        }
      })
      .catch((err) => {
        setErrorMessage(err.message || 'Export fehlgeschlagen.')
        setStep('error')
      })

    return (): void => {
      unsubscribeProgress()
    }
  }, [isOpen, playlistId, usbPath])

  const handleCancel = async (): Promise<void> => {
    try {
      await window.api.cancelPioneerExport()
    } catch (err) {
      console.error('Failed to send cancel signal to backend export queue:', err)
    }
  }

  return { step, errorMessage, progress, handleCancel }
}
