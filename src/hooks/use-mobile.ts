import { useSyncExternalStore } from 'react'

/** Abaixo disso (celulares, inclusive deitados, e tablets) o menu vira gaveta e as tabelas viram cartões. */
const MOBILE_BREAKPOINT = 1024
const CONSULTA = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function assinar(aoMudar: () => void) {
  const mql = window.matchMedia(CONSULTA)
  mql.addEventListener('change', aoMudar)
  return () => mql.removeEventListener('change', aoMudar)
}

export function useIsMobile() {
  return useSyncExternalStore(assinar, () => window.matchMedia(CONSULTA).matches)
}
