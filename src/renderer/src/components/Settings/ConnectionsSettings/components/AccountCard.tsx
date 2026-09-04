import React from 'react'
import { Loader2, Trash2, Download, RefreshCw } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Label } from '@renderer/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import type { RemotePlaylistSummary } from '@main/sync/youtubeSync'
import { useLanguage } from '@renderer/i18n'
import type { PublicOAuthAccount } from '../types'

interface AccountCardProps {
  account: PublicOAuthAccount
  remotePlaylists: RemotePlaylistSummary[]
  reconcilingId: string | null
  importingId: string | null
  onLoadPlaylists: (accountId: string) => void
  onReconcile: (accountId: string) => void
  onDisconnect: (accountId: string) => void
  onImport: (accountId: string, remotePlaylistId: string) => void
}

export default function AccountCard({
  account,
  remotePlaylists,
  reconcilingId,
  importingId,
  onLoadPlaylists,
  onReconcile,
  onDisconnect,
  onImport
}: AccountCardProps): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <div className="rounded-lg border border-border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{account.label}</span>
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => onReconcile(account.id)}
                disabled={reconcilingId === account.id}
              >
                {reconcilingId === account.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('connections.reconcileButton')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => onDisconnect(account.id)}
                className="hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('connections.disconnectButton')}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            {t('connections.importPlaylistsTitle')}
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onLoadPlaylists(account.id)}
          >
            {t('connections.loadPlaylistsButton')}
          </Button>
        </div>
        {remotePlaylists.length === 0 ? (
          <p className="text-[10px] text-muted-foreground">{t('connections.noRemotePlaylists')}</p>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {remotePlaylists.map((remote) => (
              <div
                key={remote.id}
                className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5"
              >
                <span className="truncate text-xs text-foreground" title={remote.title}>
                  {remote.title} <span className="text-muted-foreground">({remote.itemCount})</span>
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => onImport(account.id, remote.id)}
                      disabled={importingId === remote.id}
                    >
                      {importingId === remote.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('connections.importButton')}</TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
