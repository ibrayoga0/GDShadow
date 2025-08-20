import { useEffect, useRef, useState } from 'react'

export default function ShadowPlayer({ fileId, autoplay = false, muted = false, poster }) {
  const videoRef = useRef(null)
  const wrapRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [mutedState, setMutedState] = useState(muted)
  const [duration, setDuration] = useState(0)
  const [time, setTime] = useState(0)
  const [idle, setIdle] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [error, setError] = useState('')

  const proxyBase = (import.meta.env.VITE_PROXY_BASE_URL || '').replace(/\/$/, '')
  const src = proxyBase ? `${proxyBase}/${fileId}` : `/api/stream/${fileId}`

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onPlay = () => { setPlaying(true); setBuffering(false) }
    const onPause = () => setPlaying(false)
    const onTime = () => setTime(v.currentTime || 0)
    const onDur = () => setDuration(v.duration || 0)
    const onWaiting = () => setBuffering(true)
    const onCanPlay = () => setBuffering(false)
    const onErr = () => setError('Gagal memutar sumber video')
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('durationchange', onDur)
    v.addEventListener('waiting', onWaiting)
    v.addEventListener('canplay', onCanPlay)
    v.addEventListener('error', onErr)
    return () => {
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('durationchange', onDur)
      v.removeEventListener('waiting', onWaiting)
      v.removeEventListener('canplay', onCanPlay)
      v.removeEventListener('error', onErr)
    }
  }, [])

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (!wrapRef.current?.contains(document.activeElement) && document.activeElement?.tagName === 'INPUT') return
      if (e.key === ' ') { e.preventDefault(); togglePlay() }
      if (e.key === 'ArrowLeft') seek(time - 5)
      if (e.key === 'ArrowRight') seek(time + 5)
      if (e.key.toLowerCase() === 'm') toggleMute()
      if (e.key.toLowerCase() === 'f') toggleFullscreen()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [time])

  // idle controls
  useEffect(() => {
    let t
    const onMove = () => { setIdle(false); clearTimeout(t); t = setTimeout(() => setIdle(true), 2000) }
    const el = wrapRef.current
    el?.addEventListener('mousemove', onMove)
    el?.addEventListener('touchstart', onMove)
    t = setTimeout(() => setIdle(true), 2000)
    return () => { clearTimeout(t); el?.removeEventListener('mousemove', onMove); el?.removeEventListener('touchstart', onMove) }
  }, [])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().catch(() => setError('Autoplay diblokir'))
    else v.pause()
  }
  const seek = (sec) => {
    const v = videoRef.current
    if (!v || !isFinite(sec)) return
    v.currentTime = Math.max(0, Math.min(duration || 0, sec))
  }
  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMutedState(v.muted)
  }
  const toggleFullscreen = () => {
    const el = wrapRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen().catch(() => {})
  }

  const pct = duration ? (time / duration) * 100 : 0
  const onBarClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const p = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    seek((duration || 0) * p)
  }

  return (
    <div ref={wrapRef} className="relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full"
        playsInline
        muted={muted}
        autoPlay={autoplay}
        preload="metadata"
        poster={poster}
        controls={false}
      />

      {/* overlay controls */}
      {!idle && (
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center gap-2">
            <button aria-label={playing ? 'Pause' : 'Play'} className="btn btn-ghost h-9 px-3" onClick={togglePlay}>{playing ? 'Pause' : 'Play'}</button>
            <button aria-label={mutedState ? 'Unmute' : 'Mute'} className="btn btn-ghost h-9 px-3" onClick={toggleMute}>{mutedState ? 'Unmute' : 'Mute'}</button>
            <div className="ml-auto flex items-center gap-2">
              <button aria-label="Fullscreen" className="btn btn-ghost h-9 px-3" onClick={toggleFullscreen}>Full</button>
            </div>
          </div>
          <div className="mt-2 h-1.5 rounded bg-neutral-700 cursor-pointer" onClick={onBarClick}>
            <div className="h-full rounded bg-brand-600" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* watermark */}
      <div className="absolute right-2 bottom-2 text-xs px-2 py-1 rounded bg-black/50 border border-white/10 select-none">Shadow</div>

      {/* states */}
      {buffering && <div className="absolute inset-0 grid place-items-center text-sm text-neutral-300">Buffering…</div>}
      {error && <div className="absolute inset-0 grid place-items-center text-sm text-red-400">{error}</div>}
    </div>
  )
}
