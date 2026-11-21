import { createContext, useContext } from 'react'

export type Tema = 'light' | 'dark'

export interface TemaContexto {
  tema: Tema
  definirTema: (tema: Tema) => void
}

export const ContextoTema = createContext<TemaContexto | null>(null)

export function useTema() {
  const contexto = useContext(ContextoTema)
  if (!contexto) throw new Error('useTema precisa estar dentro de TemaProvider')
  return contexto
}
