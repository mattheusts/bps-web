import { useCallback, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { ContextoTema, type Tema } from './tema-contexto'

const CHAVE = 'bps_tema'

function temaInicial(): Tema {
  try {
    const salvo = localStorage.getItem(CHAVE)
    if (salvo === 'light' || salvo === 'dark') return salvo
  } catch {
    // Sem storage: segue a preferência do sistema.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(temaInicial)

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark')
    document.documentElement.style.colorScheme = tema
  }, [tema])

  const definirTema = useCallback((novo: Tema) => {
    setTema(novo)
    try {
      localStorage.setItem(CHAVE, novo)
    } catch {
      // Sem storage: o tema vale só até recarregar.
    }
  }, [])

  const valor = useMemo(() => ({ tema, definirTema }), [tema, definirTema])
  return <ContextoTema.Provider value={valor}>{children}</ContextoTema.Provider>
}
