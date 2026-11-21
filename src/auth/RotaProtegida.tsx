import { Loader2Icon } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Perfil } from '@/types/api'
import { useAuth } from './context'

export function RotaProtegida({ perfis }: { perfis?: Perfil[] }) {
  const { usuario, carregando } = useAuth()
  const local = useLocation()

  if (carregando) {
    return (
      <div className="grid min-h-svh place-items-center" role="status" aria-label="Carregando">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!usuario) return <Navigate to="/login" replace state={{ de: `${local.pathname}${local.search}` }} />
  if (perfis && !perfis.includes(usuario.perfil)) return <Navigate to="/mapa" replace />
  return <Outlet />
}
