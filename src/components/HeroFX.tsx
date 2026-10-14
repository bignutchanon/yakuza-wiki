'use client'

import { useEffect, useRef, useState } from 'react'
import type { HeroQuality, HeroSceneData } from '@/lib/heroFx'

interface HeroFXProps {
  scenes: HeroSceneData[]
  quality?: HeroQuality
}

export default function HeroFX({ scenes, quality = 'auto' }: HeroFXProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [activeScene, setActiveScene] = useState<number | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const params = new URLSearchParams(window.location.search)
    const requested = params.get('fx')
    if (requested === 'off') return
    const forced = requested === 'low' || requested === 'high' ? requested : null
    const device = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number }
    const weakTouch = window.matchMedia('(pointer: coarse)').matches &&
      ((navigator.hardwareConcurrency || 8) <= 6 || (device.deviceMemory || 8) <= 4)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!forced && (device.connection?.saveData || weakTouch)) return

    const probe = document.createElement('canvas')
    let supported = false
    try {
      const context = probe.getContext('webgl2')
      supported = Boolean(context)
      context?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch {
      supported = false
    }
    if (!supported) return

    let cancelled = false
    let stop: (() => void) | undefined
    let idleId: number | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const start = async () => {
      try {
        const { startHeroFx } = await import('@/lib/heroFx')
        if (cancelled) return
        const debug = process.env.NODE_ENV !== 'production'
          ? {
              scene: params.get('scene'),
              at: params.has('at') ? Number(params.get('at')) : null,
            }
          : undefined
        stop = startHeroFx(host, scenes, setActiveScene, forced ?? quality, debug)
      } catch (error) {
        console.warn('Hero effects could not start.', error)
      }
    }

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
      cancelIdleCallback?: (handle: number) => void
    }
    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(() => void start(), { timeout: 2000 })
    } else {
      timeoutId = setTimeout(() => void start(), 600)
    }

    return () => {
      cancelled = true
      if (idleId !== undefined) idleWindow.cancelIdleCallback?.(idleId)
      if (timeoutId !== undefined) clearTimeout(timeoutId)
      stop?.()
    }
  }, [quality, scenes])

  const credit = activeScene === null ? null : scenes[activeScene]
  return (
    <>
      <div className="hero-fx" ref={hostRef} aria-hidden="true" />
      {credit && <span className="hero-fx-credit" aria-hidden="true">ภาพ: {credit.credit} © SEGA</span>}
    </>
  )
}
