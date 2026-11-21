import { createContext, useContext } from 'react'
import type { Usuario } from '@/types/api'

export interface AuthContexto {
  usuario: Usuario | null
  carregando: boolean
  entrar: (email: string, senha: string) => Promise<void>
  sair: () => void
}

export const ContextoAuth = createContext<AuthContexto | null>(null)

export function useAuth() {
  const contexto = useContext(ContextoAuth)
  if (!contexto) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return contexto
}
