const CHAVE_TOKEN = 'bps_token'

export const sessao = {
  get token(): string | null {
    try {
      return localStorage.getItem(CHAVE_TOKEN)
    } catch {
      return null
    }
  },
  set token(valor: string | null) {
    try {
      if (valor) localStorage.setItem(CHAVE_TOKEN, valor)
      else localStorage.removeItem(CHAVE_TOKEN)
    } catch {
      // Navegador sem storage: a sessão dura só até recarregar.
    }
  },
}

export class ApiError extends Error {
  readonly status: number

  constructor(mensagem: string, status: number) {
    super(mensagem)
    this.status = status
  }
}

let aoExpirar: (() => void) | null = null

export function definirAoExpirar(fn: (() => void) | null) {
  aoExpirar = fn
}

type Params = Record<string, string | number | undefined | null>

interface Opcoes {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  corpo?: unknown
  params?: Params
  signal?: AbortSignal
}

export async function api<T>(caminho: string, { metodo = 'GET', corpo, params, signal }: Opcoes = {}): Promise<T> {
  const busca = new URLSearchParams()
  for (const [chave, valor] of Object.entries(params ?? {})) {
    if (valor !== undefined && valor !== null && valor !== '') busca.set(chave, String(valor))
  }
  const query = busca.size ? `?${busca}` : ''

  const headers: Record<string, string> = {}
  if (sessao.token) headers.Authorization = `Bearer ${sessao.token}`
  let body: BodyInit | undefined
  if (corpo instanceof FormData) body = corpo
  else if (corpo !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(corpo)
  }

  const res = await fetch(`/api${caminho}${query}`, { method: metodo, headers, body, signal })

  if (res.status === 401 && !caminho.startsWith('/auth/login')) {
    sessao.token = null
    aoExpirar?.()
    throw new ApiError('Sessão expirada. Faça login novamente.', 401)
  }
  if (res.status === 204) return null as T

  const dados = (await res.json().catch(() => ({}))) as { message?: string | string[] }
  if (!res.ok) {
    const mensagem = Array.isArray(dados.message) ? dados.message.join(' ') : dados.message
    throw new ApiError(mensagem || `Erro ${res.status}`, res.status)
  }
  return dados as T
}

export const mensagemErro = (erro: unknown) => (erro instanceof Error ? erro.message : 'Erro inesperado.')
