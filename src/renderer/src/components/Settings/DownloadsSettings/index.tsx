import React from 'react'
import { useDownloadsActions } from './useDownloadsActions'
import type { DownloadsSettingsProps } from './types'
import DownloadPathSection from './components/DownloadPathSection'
import StorageSection from './components/StorageSection'
import RekordboxXmlSection from './components/RekordboxXmlSection'
import WorkersSection from './components/WorkersSection'

export default function DownloadsSettings({
  settings,
  onUpdateSettings,
  onMigrate,
  isSyncing
}: DownloadsSettingsProps): React.JSX.Element {
  const {
    loading,
    maxWorkers,
    setMaxWorkers,
    storageStats,
    handleSelectXmlFile,
    handleClearXmlFile,
    handleExportXmlNow,
    handleSelectFolder,
    handleCommitWorkers
  } = useDownloadsActions({ settings, onUpdateSettings, onMigrate })

  return (
    <div className="space-y-8">
      <DownloadPathSection
        settings={settings}
        loading={loading}
        isSyncing={isSyncing}
        onSelectFolder={handleSelectFolder}
      />

      <StorageSection storageStats={storageStats} />

      <RekordboxXmlSection
        settings={settings}
        loading={loading}
        onSelectXmlFile={handleSelectXmlFile}
        onExportXmlNow={handleExportXmlNow}
        onClearXmlFile={handleClearXmlFile}
      />

      <WorkersSection
        maxWorkers={maxWorkers}
        loading={loading}
        onChangeWorkers={setMaxWorkers}
        onCommitWorkers={handleCommitWorkers}
      />
    </div>
  )
}
