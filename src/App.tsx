import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RotaProtegida } from '@/auth/RotaProtegida'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/features/login/LoginPage'

const MapaPage = lazy(() => import('@/features/mapa/MapaPage'))
const PrecosPage = lazy(() => import('@/features/precos/PrecosPage'))
const SobreprecoPage = lazy(() => import('@/features/sobrepreco/SobreprecoPage'))
const MercadoPage = lazy(() => import('@/features/mercado/MercadoPage'))
const CrudPage = lazy(() => import('@/features/crud/CrudPage'))
const ImportacaoPage = lazy(() => import('@/features/importacao/ImportacaoPage'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RotaProtegida />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/mapa" replace />} />
            <Route path="/mapa" element={<MapaPage />} />
            <Route path="/precos" element={<PrecosPage />} />
            <Route path="/sobrepreco" element={<SobreprecoPage />} />
            <Route path="/mercado" element={<MercadoPage />} />
            <Route path="/cadastros/:tabela" element={<CrudPage />} />
            <Route element={<RotaProtegida perfis={['ADMIN', 'OPERADOR']} />}>
              <Route path="/importar" element={<ImportacaoPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/mapa" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
