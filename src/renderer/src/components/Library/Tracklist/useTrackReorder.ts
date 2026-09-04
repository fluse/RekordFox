import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Track } from '@main/db'

export const PLACEHOLDER_KEY = '__reorder-placeholder__'

export type DisplayItem =
  | { key: string; type: 'track'; track: Track; isDragging: boolean }
  | { key: typeof PLACEHOLDER_KEY; type: 'placeholder' }

interface UseTrackReorderOptions {
  tracks: Track[]
  enabled: boolean
  onReorder: (draggedId: string, targetId: string, position: 'above' | 'below') => void
  // The scrollable element the rows live in. When the pointer drags near its top/bottom
  // edge during a reorder, that element auto-scrolls so rows outside the viewport come
  // into view. Optional — omit it and dragging just has no auto-scroll.
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
}

interface UseTrackReorderResult {
  displayItems: DisplayItem[]
  registerRow: (key: string) => (el: HTMLTableRowElement | null) => void
  onRowPointerDown: (track: Track, e: React.PointerEvent<HTMLTableRowElement>) => void
}

// Pointer-position based instead of native HTML5 drag-and-drop. Native drag relies on
// dragenter/dragleave firing when the pointer crosses an element's *painted* box — but
// inserting the placeholder can shift the very row under the cursor, which fires a spurious
// dragleave, clears the target, removes the placeholder, snaps the row back under the cursor,
// and re-triggers dragenter. That feedback loop made reordering unreliable. Tracking the pointer
// directly and picking the nearest row by distance has no enter/leave step, so it can't loop.
const DRAG_THRESHOLD_PX = 4

// Auto-scroll while dragging near the top/bottom edge of the scroll container. Speed ramps
// up quadratically with proximity to the edge, so it starts gently and gets much faster
// right at the edge rather than a flat linear ramp.
const AUTO_SCROLL_EDGE_PX = 60
const AUTO_SCROLL_MAX_SPEED_PX = 30

interface DragState {
  draggedId: string | null
  overId: string | null
  overPosition: 'above' | 'below' | null
}

export function useTrackReorder({
  tracks,
  enabled,
  onReorder,
  scrollContainerRef
}: UseTrackReorderOptions): UseTrackReorderResult {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [overId, setOverId] = useState<string | null>(null)
  const [overPosition, setOverPosition] = useState<'above' | 'below' | null>(null)

  const rowRefs = useRef(new Map<string, HTMLTableRowElement>())
  const stateRef = useRef<DragState>({ draggedId: null, overId: null, overPosition: null })
  const ghostElRef = useRef<HTMLDivElement | null>(null)
  const grabOffsetRef = useRef({ x: 0, y: 0 })
  const originRef = useRef({ x: 0, y: 0 })
  const autoScrollRafRef = useRef<number | null>(null)
  const autoScrollSpeedRef = useRef(0)
  const lastPointerYRef = useRef(0)

  const registerRow = useCallback(
    (key: string) =>
      (el: HTMLTableRowElement | null): void => {
        if (el) rowRefs.current.set(key, el)
        else rowRefs.current.delete(key)
      },
    []
  )

  const setOver = (id: string | null, position: 'above' | 'below' | null): void => {
    stateRef.current.overId = id
    stateRef.current.overPosition = position
    setOverId(id)
    setOverPosition(position)
  }

  const findClosestTarget = useCallback(
    (clientY: number, excludeId: string): { id: string; position: 'above' | 'below' } | null => {
      let bestId: string | null = null
      let bestPosition: 'above' | 'below' = 'below'
      let bestDistance = Infinity

      for (const track of tracks) {
        if (track.id === excludeId) continue
        const rowEl = rowRefs.current.get(track.id)
        if (!rowEl) continue
        const rect = rowEl.getBoundingClientRect()
        const midpoint = rect.top + rect.height / 2
        const distance = Math.abs(clientY - midpoint)
        if (distance < bestDistance) {
          bestDistance = distance
          bestId = track.id
          bestPosition = clientY < midpoint ? 'above' : 'below'
        }
      }

      return bestId ? { id: bestId, position: bestPosition } : null
    },
    [tracks]
  )

  const stopAutoScroll = useCallback((): void => {
    if (autoScrollRafRef.current !== null) {
      cancelAnimationFrame(autoScrollRafRef.current)
      autoScrollRafRef.current = null
    }
    autoScrollSpeedRef.current = 0
  }, [])

  // Scrolling moves rows without a pointermove event firing, so each step re-runs the
  // same nearest-row lookup the pointermove handler uses to keep the placeholder in sync.
  const runAutoScrollStep = useCallback((): void => {
    const container = scrollContainerRef?.current
    const speed = autoScrollSpeedRef.current
    if (!container || speed === 0) {
      autoScrollRafRef.current = null
      return
    }

    container.scrollTop += speed

    const draggedTrackId = stateRef.current.draggedId
    if (draggedTrackId) {
      const target = findClosestTarget(lastPointerYRef.current, draggedTrackId)
      if (
        target &&
        (target.id !== stateRef.current.overId || target.position !== stateRef.current.overPosition)
      ) {
        setOver(target.id, target.position)
      }
    }

    autoScrollRafRef.current = requestAnimationFrame(runAutoScrollStep)
  }, [findClosestTarget, scrollContainerRef])

  const updateAutoScroll = useCallback(
    (clientY: number): void => {
      lastPointerYRef.current = clientY
      const container = scrollContainerRef?.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      let speed = 0
      if (clientY < rect.top + AUTO_SCROLL_EDGE_PX) {
        const proximity = (rect.top + AUTO_SCROLL_EDGE_PX - clientY) / AUTO_SCROLL_EDGE_PX
        speed = -Math.ceil(proximity * proximity * AUTO_SCROLL_MAX_SPEED_PX)
      } else if (clientY > rect.bottom - AUTO_SCROLL_EDGE_PX) {
        const proximity = (clientY - (rect.bottom - AUTO_SCROLL_EDGE_PX)) / AUTO_SCROLL_EDGE_PX
        speed = Math.ceil(proximity * proximity * AUTO_SCROLL_MAX_SPEED_PX)
      }

      autoScrollSpeedRef.current = speed
      if (speed !== 0 && autoScrollRafRef.current === null) {
        autoScrollRafRef.current = requestAnimationFrame(runAutoScrollStep)
      }
    },
    [runAutoScrollStep, scrollContainerRef]
  )

  useEffect(() => stopAutoScroll, [stopAutoScroll])

  const createGhost = (rowEl: HTMLTableRowElement, clientX: number, clientY: number): void => {
    const rect = rowEl.getBoundingClientRect()
    const sourceTable = rowEl.closest('table')

    const wrapper = document.createElement('div')
    wrapper.style.position = 'fixed'
    wrapper.style.top = '0'
    wrapper.style.left = '0'
    wrapper.style.zIndex = '9999'
    wrapper.style.pointerEvents = 'none'
    wrapper.style.width = `${rect.width}px`
    wrapper.style.opacity = '0.85'
    wrapper.style.boxShadow = '0 18px 40px rgba(0, 0, 0, 0.55)'
    wrapper.style.borderRadius = '10px'
    wrapper.style.overflow = 'hidden'
    wrapper.style.background = 'hsl(var(--background))'
    wrapper.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`

    const table = document.createElement('table')
    table.style.width = '100%'
    table.style.tableLayout = 'fixed'
    table.style.borderCollapse = 'collapse'

    const colgroup = sourceTable?.querySelector('colgroup')
    if (colgroup) table.appendChild(colgroup.cloneNode(true))

    const tbody = document.createElement('tbody')
    const rowClone = rowEl.cloneNode(true) as HTMLTableRowElement
    rowClone.style.transform = 'none'
    rowClone.style.visibility = 'visible'
    tbody.appendChild(rowClone)
    table.appendChild(tbody)
    wrapper.appendChild(table)
    document.body.appendChild(wrapper)

    grabOffsetRef.current = { x: clientX - rect.left, y: clientY - rect.top }
    ghostElRef.current = wrapper
  }

  const cleanup = useCallback((): void => {
    stopAutoScroll()
    ghostElRef.current?.remove()
    ghostElRef.current = null
    document.body.style.removeProperty('cursor')
    document.body.style.removeProperty('user-select')
    stateRef.current = { draggedId: null, overId: null, overPosition: null }
    setDraggedId(null)
    setHasStarted(false)
    setOverId(null)
    setOverPosition(null)
  }, [stopAutoScroll])

  // Both listeners are (re-)created per drag gesture, inside onRowPointerDown, rather than as
  // top-level useCallbacks. That sidesteps a circular reference (pointerup needs to remove
  // pointermove and itself) and — more importantly — means each gesture's closures always see
  // the `tracks`/`onReorder` that were current when the drag started, with no dependency array
  // to keep in sync.
  const onRowPointerDown = useCallback(
    (track: Track, e: React.PointerEvent<HTMLTableRowElement>): void => {
      if (!enabled || e.button !== 0) return
      if ((e.target as HTMLElement).closest('button, a, input')) return

      const draggedTrackId = track.id
      originRef.current = { x: e.clientX, y: e.clientY }
      stateRef.current = { draggedId: draggedTrackId, overId: null, overPosition: null }
      setDraggedId(draggedTrackId)

      function handlePointerMove(moveEvent: PointerEvent): void {
        if (!ghostElRef.current) {
          const dx = moveEvent.clientX - originRef.current.x
          const dy = moveEvent.clientY - originRef.current.y
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return

          const rowEl = rowRefs.current.get(draggedTrackId)
          if (!rowEl) return
          createGhost(rowEl, moveEvent.clientX, moveEvent.clientY)
          document.body.style.cursor = 'grabbing'
          document.body.style.userSelect = 'none'
          setHasStarted(true)
        }

        const ghostEl = ghostElRef.current
        if (!ghostEl) return
        const { x: offsetX, y: offsetY } = grabOffsetRef.current
        ghostEl.style.transform = `translate3d(${moveEvent.clientX - offsetX}px, ${moveEvent.clientY - offsetY}px, 0)`

        const target = findClosestTarget(moveEvent.clientY, draggedTrackId)
        if (
          target &&
          (target.id !== stateRef.current.overId ||
            target.position !== stateRef.current.overPosition)
        ) {
          setOver(target.id, target.position)
        }

        updateAutoScroll(moveEvent.clientY)
      }

      function handlePointerUp(): void {
        const { overId: oId, overPosition: oPos } = stateRef.current
        if (ghostElRef.current && oId && oPos) {
          onReorder(draggedTrackId, oId, oPos)
        }
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
        window.removeEventListener('pointercancel', handlePointerUp)
        cleanup()
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)
    },
    [enabled, findClosestTarget, onReorder, cleanup, updateAutoScroll]
  )

  const displayItems = useMemo((): DisplayItem[] => {
    const baseItems: DisplayItem[] = tracks.map((track) => ({
      key: track.id,
      type: 'track',
      track,
      isDragging: hasStarted && track.id === draggedId
    }))

    if (!hasStarted || !draggedId || !overId || !overPosition) return baseItems

    const targetIndex = tracks.findIndex((t) => t.id === overId)
    if (targetIndex === -1) return baseItems

    const insertIndex = overPosition === 'above' ? targetIndex : targetIndex + 1
    const items = [...baseItems]
    items.splice(insertIndex, 0, { key: PLACEHOLDER_KEY, type: 'placeholder' })
    return items
  }, [tracks, draggedId, overId, overPosition, hasStarted])

  // FLIP animation: measure row positions before/after the display order changes and
  // animate the delta away so tracks glide into place instead of jumping.
  const prevRectsRef = useRef(new Map<string, DOMRect>())
  const displayItemsKey = displayItems.map((item) => item.key).join('|')

  useLayoutEffect(() => {
    const currentRects = new Map<string, DOMRect>()
    rowRefs.current.forEach((el, key) => {
      currentRects.set(key, el.getBoundingClientRect())
    })

    const prevRects = prevRectsRef.current
    rowRefs.current.forEach((el, key) => {
      const prev = prevRects.get(key)
      const next = currentRects.get(key)
      if (!prev || !next) return

      const deltaY = prev.top - next.top
      if (Math.abs(deltaY) < 1) return

      el.style.transition = 'none'
      el.style.transform = `translateY(${deltaY}px)`
      // Force a reflow so the browser registers the starting transform before animating away from it.
      void el.offsetHeight
      requestAnimationFrame(() => {
        el.style.transition = ''
        el.style.transform = ''
      })
    })

    prevRectsRef.current = currentRects
  }, [displayItemsKey])

  return { displayItems, registerRow, onRowPointerDown }
}
