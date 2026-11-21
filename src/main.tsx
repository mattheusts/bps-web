import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import { AuthProvider } from '@/auth/AuthProvider'
import { TemaProvider } from '@/components/layout/TemaProvider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ApiError } from '@/lib/api'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (falhas, erro) => !(erro instanceof ApiError && erro.status < 500) && falhas < 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TemaProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </QueryClientProvider>
    </TemaProvider>
  </StrictMode>,
)
