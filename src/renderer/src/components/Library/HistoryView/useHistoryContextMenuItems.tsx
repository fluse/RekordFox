import { Play, ListPlus, Search, Disc3, SquarePlay, ExternalLink, Compass } from 'lucide-react'
import type { Track } from '@main/db'
import { usePreviewStore } from '@renderer/store/usePreviewStore'
import { useLanguage } from '@renderer/i18n'
import {
  openDiscogsArtistSearch,
  openBandcampArtistSearch,
  openYoutubeArtistSearch,
  openYoutubeVideo
} from '@renderer/utils/artistSearch'
import type { TrackContextMenuItem } from '@renderer/components/ContextMenu/TrackContextMenu'

// Builds the right-click menu for a history track: playback, YouTube, optional "find similar",
// and external artist searches.
export function useHistoryContextMenuItems(
  historyTracks: Track[],
  onFindSimilarTrack?: (track: Track) => void
): (track: Track) => TrackContextMenuItem[] {
  const { t } = useLanguage()
  const playNow = usePreviewStore((s) => s.playNow)
  const addToQueue = usePreviewStore((s) => s.addToQueue)

  return (track: Track): TrackContextMenuItem[] => [
    {
      key: 'playNow',
      label: t('contextMenu.playNow'),
      icon: <Play className="h-3.5 w-3.5" />,
      onClick: () => playNow(track, historyTracks)
    },
    {
      key: 'addToQueue',
      label: t('contextMenu.addToQueue'),
      icon: <ListPlus className="h-3.5 w-3.5" />,
      onClick: () => addToQueue(track)
    },
    {
      key: 'openYoutubeVideo',
      label: t('contextMenu.openYoutubeVideo'),
      icon: <ExternalLink className="h-3.5 w-3.5" />,
      onClick: () => openYoutubeVideo(track.id),
      divider: true
    },
    ...(onFindSimilarTrack
      ? [
          {
            key: 'findSimilar',
            label: t('contextMenu.findSimilar'),
            icon: <Compass className="h-3.5 w-3.5" />,
            onClick: () => onFindSimilarTrack(track)
          }
        ]
      : []),
    {
      key: 'searchDiscogs',
      label: t('contextMenu.searchDiscogs'),
      icon: <Search className="h-3.5 w-3.5" />,
      onClick: () => openDiscogsArtistSearch(track.artist)
    },
    {
      key: 'searchBandcamp',
      label: t('contextMenu.searchBandcamp'),
      icon: <Disc3 className="h-3.5 w-3.5" />,
      onClick: () => openBandcampArtistSearch(track.artist)
    },
    {
      key: 'searchYoutube',
      label: t('contextMenu.searchYoutube'),
      icon: <SquarePlay className="h-3.5 w-3.5" />,
      onClick: () => openYoutubeArtistSearch(track.artist)
    }
  ]
}
