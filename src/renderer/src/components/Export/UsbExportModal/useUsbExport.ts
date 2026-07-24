import { useState, useEffect, useCallback, useRef } from 'react'
import { useLanguage } from '@renderer/i18n'
import type { UsbDrive, UsbExportStep, ExportFormat, ExportProgress } from './types'

interface UseUsbExportParams {
  isOpen: boolean
  playlistId: string
  onClose: () => void
}

export interface UseUsbExportResult {
  step: UsbExportStep
  drives: UsbDrive[]
  selectedDrive: UsbDrive | null
  setSelectedDrive: (drive: UsbDrive) => void
  exportFormat: ExportFormat
  setExportFormat: (format: ExportFormat) => void
  progress: ExportProgress | null
  errorMessage: string
  isRefreshing: boolean
  isInitGuideOpen: boolean
  toggleInitGuide: () => void
  percent: number
  refreshDrives: () => void
  rescan: () => void
  goToSelect: () => void
  handleExport: (forceOverwrite?: boolean) => Promise<void>
  handleClose: () => void
}

// Owns the full USB-export state machine: scanning for drives (with a latest-scan guard and quiet
// background polling), running the export, tracking progress, and resetting on close.
export function useUsbExport({
  isOpen,
  playlistId,
  onClose
}: UseUsbExportParams): UseUsbExportResult {
  const { t } = useLanguage()
  const [step, setStep] = useState<UsbExportStep>('scanning')
  const [drives, setDrives] = useState<UsbDrive[]>([])
  const [selectedDrive, setSelectedDrive] = useState<UsbDrive | null>(null)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('m3u8')
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isInitGuideOpen, setIsInitGuideOpen] = useState(false)

  // Latest-scan guard so a slow in-flight scan can't overwrite a newer result,
  // and so background refreshes never clobber the visible UI.
  const scanTokenRef = useRef(0)

  const fetchDrives = useCallback(
    async (initial: boolean): Promise<void> => {
      const token = ++scanTokenRef.current
      if (initial) {
        setStep('scanning')
        setErrorMessage('')
      } else {
        setIsRefreshing(true)
      }
      try {
        const detected = await window.api.getUsbDrives()
        // A newer scan started while we were waiting — discard this result.
        if (token !== scanTokenRef.current) return
        setDrives(detected)
        // Preserve the user's current selection across refreshes; only fall back
        // to the first drive when the selected one is gone (or nothing selected).
        setSelectedDrive((prev) => {
          if (prev) {
            const stillPresent = detected.find((d) => d.path === prev.path)
            if (stillPresent) return stillPresent
          }
          return detected[0] ?? null
        })
        if (initial) setStep('select')
      } catch (err: unknown) {
        if (token !== scanTokenRef.current) return
        // Background refreshes fail silently — keep the current view intact.
        if (initial) {
          const msg = err instanceof Error ? err.message : String(err)
          setErrorMessage(msg || t('usbExport.errorScanDrives'))
          setStep('error')
        }
      } finally {
        if (token === scanTokenRef.current) setIsRefreshing(false)
      }
    },
    [t]
  )

  // Hold the freshest fetchDrives in a ref so the mount/poll effects can invoke
  // it WITHOUT depending on it. `t` (and thus fetchDrives) changes identity on
  // every parent re-render; depending on it would re-fire the mount effect and
  // reset the modal to the "scanning" step, wiping already-found drives.
  const fetchDrivesRef = useRef(fetchDrives)
  useEffect((): void => {
    fetchDrivesRef.current = fetchDrives
  }, [fetchDrives])

  const refreshDrives = (): void => {
    void fetchDrivesRef.current(false)
  }

  const rescan = (): void => {
    void fetchDrivesRef.current(true)
  }

  // Run the initial scan exactly once each time the modal opens.
  useEffect((): void => {
    if (isOpen) {
      void fetchDrivesRef.current(true)
    }
  }, [isOpen])

  // While the user is choosing a drive, quietly poll for changes (sticks being
  // plugged in / removed) without disrupting the view or resetting the step.
  useEffect((): (() => void) | undefined => {
    if (!isOpen || step !== 'select') return undefined
    const id = setInterval((): void => {
      void fetchDrivesRef.current(false)
    }, 4000)
    return (): void => clearInterval(id)
  }, [isOpen, step])

  useEffect((): (() => void) | undefined => {
    if (step === 'exporting') {
      const unsubscribe = window.api.onExportProgress((data) => {
        if (data.playlistId === playlistId) {
          setProgress({
            current: data.current,
            total: data.total,
            trackTitle: data.trackTitle
          })
        }
      })
      return (): void => {
        unsubscribe()
      }
    }
    return undefined
  }, [step, playlistId])

  const handleExport = async (forceOverwrite = false): Promise<void> => {
    if (!selectedDrive) return
    setStep('exporting')
    setProgress(null)
    setErrorMessage('')

    try {
      const res = await window.api.exportPlaylist(playlistId, selectedDrive.path, forceOverwrite)
      if (res.success) {
        setStep('success')
      } else if (res.exists) {
        setStep('confirm_overwrite')
      } else {
        setErrorMessage(res.error || t('usbExport.failedError'))
        setStep('error')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMessage(msg || t('usbExport.failedError'))
      setStep('error')
    }
  }

  const handleClose = (): void => {
    // Invalidate any in-flight scan so it can't resurrect state after close.
    scanTokenRef.current++
    setStep('scanning')
    setDrives([])
    setSelectedDrive(null)
    setProgress(null)
    setErrorMessage('')
    setIsRefreshing(false)
    setIsInitGuideOpen(false)
    onClose()
  }

  const percent = progress ? Math.floor((progress.current / progress.total) * 100) : 0

  return {
    step,
    drives,
    selectedDrive,
    setSelectedDrive,
    exportFormat,
    setExportFormat,
    progress,
    errorMessage,
    isRefreshing,
    isInitGuideOpen,
    toggleInitGuide: () => setIsInitGuideOpen((prev) => !prev),
    percent,
    refreshDrives,
    rescan,
    goToSelect: () => setStep('select'),
    handleExport,
    handleClose
  }
}
