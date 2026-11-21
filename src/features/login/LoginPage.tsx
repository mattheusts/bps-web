import { ActivityIcon, Loader2Icon, MapIcon, ShieldAlertIcon, TrendingUpIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/context'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mensagemErro } from '@/lib/api'

const DESTAQUES = [
  { icone: MapIcon, titulo: 'Compras por território', texto: 'Do Brasil ao município, em um mapa interativo.' },
  { icone: TrendingUpIcon, titulo: 'Preço de referência', texto: 'Mediana, quartis e evolução por medicamento.' },
  { icone: ShieldAlertIcon, titulo: 'Alerta de sobrepreço', texto: 'Compras acima da mediana nacional comparável.' },
]

export function LoginPage() {
  const { usuario, carregando, entrar } = useAuth()
  const local = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!carregando && usuario) {
    const destino = (local.state as { de?: string } | null)?.de ?? '/mapa'
    return <Navigate to={destino} replace />
  }

  async function enviar(ev: FormEvent) {
    ev.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await entrar(email, senha)
    } catch (e) {
      setErro(mensagemErro(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-[#0d2f5e] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -top-32 -right-24 size-96 rounded-full bg-[#2a78d6]/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 size-[28rem] rounded-full bg-[#1baf7a]/20 blur-3xl" />
        <div className="relative flex items-center gap-3 font-semibold">
          <span className="grid size-10 place-items-center rounded-xl bg-white/15">
            <ActivityIcon className="size-5" />
          </span>
          Banco de Preços em Saúde
        </div>
        <div className="relative max-w-lg">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight">
            Transparência para as compras públicas de medicamentos.
          </h1>
          <ul className="mt-10 grid gap-6">
            {DESTAQUES.map(({ icone: Icone, titulo, texto }) => (
              <li key={titulo} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/10">
                  <Icone className="size-5" />
                </span>
                <span>
                  <span className="block font-medium">{titulo}</span>
                  <span className="text-sm text-white/70">{texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/55">Dados do BPS · Malhas do IBGE</p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-12">
        <form onSubmit={enviar} className="w-full max-w-sm">
          <span className="mb-6 grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground lg:hidden">
            <ActivityIcon className="size-5" />
          </span>
          <h2 className="text-2xl font-semibold tracking-tight">Entrar</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use seu e-mail e senha para acessar o painel.</p>

          {erro && (
            <Alert variant="destructive" className="mt-6">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" disabled={enviando} className="mt-2 w-full">
              {enviando && <Loader2Icon className="animate-spin" />}
              {enviando ? 'Entrando…' : 'Entrar'}
            </Button>
          </div>
        </form>
      </section>
    </main>
  )
}
