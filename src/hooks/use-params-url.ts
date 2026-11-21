import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Filtros guardados na URL: a tela pode ser recarregada e compartilhada sem perder o recorte. */
export function useParamsUrl() {
  const [busca, setBusca] = useSearchParams()
  const valores = useMemo(() => Object.fromEntries(busca) as Record<string, string | undefined>, [busca])

  const definir = useCallback(
    (mudancas: Record<string, string | number | null | undefined>) => {
      setBusca(
        (anterior) => {
          const proxima = new URLSearchParams(anterior)
          for (const [chave, valor] of Object.entries(mudancas)) {
            if (valor === undefined || valor === null || valor === '') proxima.delete(chave)
            else proxima.set(chave, String(valor))
          }
          return proxima
        },
        { replace: true },
      )
    },
    [setBusca],
  )

  return { valores, definir }
}
