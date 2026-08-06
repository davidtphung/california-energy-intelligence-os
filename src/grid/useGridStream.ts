/**
 * Simulated live stream (WebSocket stand-in).
 * Production: connect wss://…/grid, apply incremental patches, cache last N frames.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildTimeline, getTopology, sampleFrame } from './generateGrid'
import { computeKpis } from './metrics'
import type { GridFrame, GridMode, GridTopology } from './types'

import { REFRESH } from '../data/refreshRates'

const LIVE_MS = REFRESH.mapStreamMs

export function useGridStream(mode: GridMode) {
  const topo = useMemo(() => getTopology(), [])
  const [now, setNow] = useState(() => Date.now())
  const [frame, setFrame] = useState<GridFrame>(() => sampleFrame(Date.now(), 'live'))
  const [prevFrame, setPrevFrame] = useState<GridFrame | null>(null)
  const [history, setHistory] = useState<GridFrame[]>(() => buildTimeline(Date.now(), 24, 30))
  const [histIndex, setHistIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [connected, setConnected] = useState(true)
  const [tick, setTick] = useState(0)
  const playRef = useRef<number | null>(null)

  // Live tick
  useEffect(() => {
    if (mode !== 'live') return
    setConnected(true)
    const id = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      setFrame((prev) => {
        setPrevFrame(prev)
        return sampleFrame(t, 'live')
      })
      setTick((x) => x + 1)
    }, LIVE_MS)
    return () => window.clearInterval(id)
  }, [mode])

  // Historical / forecast: use timeline
  useEffect(() => {
    if (mode === 'live') return
    const t = Date.now()
    const frames =
      mode === 'forecast'
        ? buildTimeline(t + 6 * 3_600_000, 6, 15).map((f) => ({
            ...f,
            mode: 'forecast' as const,
            summary: sampleFrame(f.t, 'forecast').summary,
          }))
        : buildTimeline(t, 24, 30)
    // re-sample with correct mode
    const rebuilt = frames.map((f) => sampleFrame(f.t, mode))
    setHistory(rebuilt)
    setHistIndex(rebuilt.length - 1)
    setFrame(rebuilt[rebuilt.length - 1])
    setPrevFrame(rebuilt.length > 1 ? rebuilt[rebuilt.length - 2] : null)
    setNow(rebuilt[rebuilt.length - 1].t)
    setPlaying(false)
  }, [mode])

  // Playback
  useEffect(() => {
    if (!playing || mode === 'live') {
      if (playRef.current) window.clearInterval(playRef.current)
      playRef.current = null
      return
    }
    playRef.current = window.setInterval(() => {
      setHistIndex((i) => {
        const next = i + 1
        if (next >= history.length) {
          setPlaying(false)
          return i
        }
        setPrevFrame(history[i] ?? null)
        setFrame(history[next])
        setNow(history[next].t)
        return next
      })
    }, REFRESH.scrubPlaybackMs)
    return () => {
      if (playRef.current) window.clearInterval(playRef.current)
    }
  }, [playing, mode, history])

  const scrubTo = useCallback(
    (index: number) => {
      if (!history.length) return
      const i = Math.max(0, Math.min(history.length - 1, index))
      setHistIndex(i)
      setPrevFrame(i > 0 ? history[i - 1] : null)
      setFrame(history[i])
      setNow(history[i].t)
    },
    [history]
  )

  const kpis = useMemo(() => computeKpis(frame, topo), [frame, topo])

  const reconnect = useCallback(() => {
    setConnected(true)
    const t = Date.now()
    setFrame(sampleFrame(t, mode === 'live' ? 'live' : mode))
    setNow(t)
  }, [mode])

  return {
    topo: topo as GridTopology,
    frame,
    prevFrame,
    kpis,
    now,
    connected,
    tick,
    history,
    histIndex,
    playing,
    setPlaying,
    scrubTo,
    reconnect,
  }
}
