import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { api, definirAoExpirar, sessao } from '@/lib/api'
import type { Usuario } from '@/types/api'
import { ContextoAuth } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(() => !!sessao.token)

  const limpar = useCallback(() => {
    sessao.token = null
    setUsuario(null)
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    definirAoExpirar(() => {
      limpar()
      toast.error('Sessão expirada. Faça login novamente.')
    })
    return () => definirAoExpirar(null)
  }, [limpar])

  useEffect(() => {
    if (!sessao.token) return
    let ativo = true
    api<Usuario>('/auth/me')
      .then((u) => {
        if (ativo) setUsuario(u)
      })
      .catch(() => {
        if (ativo) setUsuario(null)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  const entrar = useCallback(
    async (email: string, senha: string) => {
      const r = await api<{ token: string; usuario: Usuario }>('/auth/login', {
        metodo: 'POST',
        corpo: { email, senha },
      })
      queryClient.clear()
      sessao.token = r.token
      setUsuario(r.usuario)
    },
    [queryClient],
  )

  const valor = useMemo(() => ({ usuario, carregando, entrar, sair: limpar }), [usuario, carregando, entrar, limpar])

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>
}
