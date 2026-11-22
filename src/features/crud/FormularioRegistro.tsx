import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
import { Fragment } from 'react'
import { Controller, useForm, type RegisterOptions } from 'react-hook-form'
import { toast } from 'sonner'
import { Erro } from '@/components/estados'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { api, mensagemErro } from '@/lib/api'
import { fmt, mascaraCnpj } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ColunaMeta, Registro, TabelaMeta } from '@/types/api'
import { FkSelect } from './FkSelect'

type Valores = Record<string, string>

/** Só existe no formulário: nunca é enviado à API. */
const CONFIRMACAO_SENHA = '__confirmacao_senha'

const campoLargo = (c: ColunaMeta) => !!c.fk || c.tipo === 'text' || (c.tipo === 'string' && (c.tamanho ?? 0) > 60)

function valoresIniciais(campos: ColunaMeta[], registro: Registro | null): Valores {
  return Object.fromEntries(
    campos.map((c) => {
      const v = registro?.[c.nome]
      if (c.tipo === 'senha' || v === null || v === undefined) return [c.nome, '']
      if (c.cnpj) return [c.nome, fmt.cnpj(v)]
      if (c.tipo === 'date') return [c.nome, String(v).slice(0, 10)]
      return [c.nome, String(v)]
    }),
  )
}

function Formulario({
  tabela,
  registro,
  aoFechar,
}: {
  tabela: TabelaMeta
  registro: Registro | null
  aoFechar: () => void
}) {
  const queryClient = useQueryClient()
  const campos = tabela.colunas.filter((c) => !c.auto)
  const editando = registro !== null
  const {
    control,
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<Valores>({
    defaultValues: { ...valoresIniciais(campos, registro), [CONFIRMACAO_SENHA]: '' },
  })

  const salvar = useMutation({
    mutationFn: (dados: Valores) =>
      editando
        ? api(`/crud/${tabela.nome}/${registro[tabela.pk]}`, { metodo: 'PUT', corpo: dados })
        : api(`/crud/${tabela.nome}`, { metodo: 'POST', corpo: dados }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crud', tabela.nome] })
      queryClient.invalidateQueries({ queryKey: ['opcoes', tabela.nome] })
      toast.success('Registro salvo.')
      aoFechar()
    },
  })

  const regras = (c: ColunaMeta): RegisterOptions<Valores, string> => {
    const exigido = c.tipo === 'senha' ? !editando : c.obrigatorio
    return {
      required: exigido ? `${c.rotulo} é obrigatório.` : false,
      ...(c.tipo === 'senha' && {
        deps: [CONFIRMACAO_SENHA],
        validate: (v: string) => !v || v.length >= 8 || 'A senha precisa ter pelo menos 8 caracteres.',
      }),
      ...(c.tamanho && !c.cnpj && c.tipo === 'string'
        ? { maxLength: { value: c.tamanho, message: `Máximo de ${c.tamanho} caracteres.` } }
        : {}),
    }
  }

  const controle = (c: ColunaMeta) => {
    const invalido = !!errors[c.nome]
    if (c.fk) {
      return (
        <Controller
          control={control}
          name={c.nome}
          rules={regras(c)}
          render={({ field }) => (
            <FkSelect
              id={c.nome}
              tabela={c.fk as string}
              valor={field.value}
              rotuloInicial={registro?.[`${c.nome}__rotulo`] as string | undefined}
              obrigatorio={c.obrigatorio}
              invalido={invalido}
              aoMudar={field.onChange}
            />
          )}
        />
      )
    }
    if (c.tipo === 'enum' || c.tipo === 'flag') {
      const opcoes =
        c.tipo === 'flag'
          ? [
              { valor: 'S', rotulo: 'Sim' },
              { valor: 'N', rotulo: 'Não' },
            ]
          : (c.opcoes ?? []).map((o) => ({ valor: o, rotulo: o }))
      return (
        <Controller
          control={control}
          name={c.nome}
          rules={regras(c)}
          render={({ field }) => (
            <Select value={field.value || undefined} onValueChange={field.onChange}>
              <SelectTrigger id={c.nome} className="w-full" aria-invalid={invalido}>
                <SelectValue placeholder="Selecione…" />
              </SelectTrigger>
              <SelectContent>
                {opcoes.map((o) => (
                  <SelectItem key={o.valor} value={o.valor}>
                    {o.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      )
    }
    if (c.tipo === 'text') {
      return <Textarea id={c.nome} aria-invalid={invalido} {...register(c.nome, regras(c))} />
    }
    if (c.tipo === 'senha') {
      return (
        <Input
          id={c.nome}
          type="password"
          autoComplete="new-password"
          aria-invalid={invalido}
          placeholder={editando ? 'Em branco mantém a atual' : 'Mínimo de 8 caracteres'}
          {...register(c.nome, regras(c))}
        />
      )
    }
    if (c.cnpj) {
      const campo = register(c.nome, regras(c))
      return (
        <Input
          id={c.nome}
          inputMode="numeric"
          placeholder="00.000.000/0000-00"
          aria-invalid={invalido}
          {...campo}
          onChange={(ev) => {
            ev.target.value = mascaraCnpj(ev.target.value)
            return campo.onChange(ev)
          }}
        />
      )
    }
    const tipo = c.tipo === 'date' ? 'date' : c.tipo === 'int' || c.tipo === 'decimal' ? 'number' : 'text'
    return (
      <Input
        id={c.nome}
        type={tipo}
        step={c.tipo === 'decimal' ? 'any' : c.tipo === 'int' ? 1 : undefined}
        aria-invalid={invalido}
        {...register(c.nome, regras(c))}
      />
    )
  }

  return (
    <form
      onSubmit={handleSubmit(({ [CONFIRMACAO_SENHA]: _confirmacao, ...dados }) => salvar.mutate(dados))}
      noValidate
    >
      <div className="grid max-h-[62vh] gap-4 overflow-y-auto p-1 sm:grid-cols-2">
        {campos.map((c) => {
          const exigido = c.tipo === 'senha' ? !editando : c.obrigatorio
          return (
            <Fragment key={c.nome}>
              <div className={cn('grid content-start gap-1.5', campoLargo(c) && 'sm:col-span-2')}>
                <Label htmlFor={c.nome}>
                  {c.rotulo}
                  {exigido && <span className="text-destructive">*</span>}
                </Label>
                {controle(c)}
                {errors[c.nome] && <p className="text-xs text-destructive">{errors[c.nome]?.message}</p>}
              </div>
              {c.tipo === 'senha' && (
                <div className="grid content-start gap-1.5">
                  <Label htmlFor={CONFIRMACAO_SENHA}>
                    Confirmar senha
                    {exigido && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id={CONFIRMACAO_SENHA}
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!errors[CONFIRMACAO_SENHA]}
                    placeholder="Repita a senha"
                    {...register(CONFIRMACAO_SENHA, {
                      validate: (v) => {
                        const senha = getValues(c.nome)
                        if (!senha && !v) return true
                        if (!v) return 'Confirme a senha.'
                        return v === senha || 'As senhas não coincidem.'
                      },
                    })}
                  />
                  {errors[CONFIRMACAO_SENHA] && (
                    <p className="text-xs text-destructive">{errors[CONFIRMACAO_SENHA]?.message}</p>
                  )}
                </div>
              )}
            </Fragment>
          )
        })}
      </div>
      {salvar.isError && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{mensagemErro(salvar.error)}</AlertDescription>
        </Alert>
      )}
      <DialogFooter className="mt-5">
        <Button type="button" variant="outline" onClick={aoFechar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvar.isPending}>
          {salvar.isPending && <Loader2Icon className="animate-spin" />}
          Salvar
        </Button>
      </DialogFooter>
    </form>
  )
}

export function FormularioRegistro({
  tabela,
  id,
  aoFechar,
}: {
  tabela: TabelaMeta
  id: string | number | null
  aoFechar: () => void
}) {
  const editando = id !== null
  const consulta = useQuery({
    queryKey: ['crud', tabela.nome, 'registro', id],
    queryFn: () => api<Registro>(`/crud/${tabela.nome}/${id}`),
    enabled: editando,
    gcTime: 0,
    staleTime: 0,
  })

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editando ? 'Editar' : 'Novo'} · {tabela.rotulo}
          </DialogTitle>
          <DialogDescription>Campos com * são obrigatórios.</DialogDescription>
        </DialogHeader>
        {editando && consulta.isPending && <Skeleton className="h-64" />}
        {editando && consulta.isError && <Erro erro={consulta.error} tentar={() => consulta.refetch()} />}
        {(!editando || consulta.isSuccess) && (
          <Formulario tabela={tabela} registro={editando ? (consulta.data ?? null) : null} aoFechar={aoFechar} />
        )}
      </DialogContent>
    </Dialog>
  )
}
