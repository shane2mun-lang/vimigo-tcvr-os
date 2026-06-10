import { useEffect, useState } from 'react'

/**
 * Tracks which section is currently in view inside the #main-scroll container.
 * Returns the active section id (without the `section-` prefix).
 */
export function useScrollSpy(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? '')

  useEffect(() => {
    const main = document.getElementById('main-scroll')
    if (!main) return

    let raf = 0
    const compute = () => {
      raf = 0
      const mainTop = main.getBoundingClientRect().top
      let current = ids[0] ?? ''
      for (const id of ids) {
        const el = document.getElementById(`section-${id}`)
        if (!el) continue
        // Active = last section whose top has passed the reading line (~160px down).
        if (el.getBoundingClientRect().top - mainTop <= 160) current = id
      }
      setActive(current)
    }
    const onScroll = () => {
      if (raf === 0) raf = requestAnimationFrame(compute)
    }

    compute()
    main.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      main.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ids])

  return active
}
