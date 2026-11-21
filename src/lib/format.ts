type Valor = number | string | null | undefined

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const brlCompacto = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 })

const vazio = (v: Valor): v is null | undefined => v === null || v === undefined || v === ''
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export const fmt = {
  moeda: (v: Valor) => (vazio(v) ? '—' : brl.format(Number(v))),
  moedaCurta: (v: Valor) => (vazio(v) ? '—' : brlCompacto.format(Number(v))),
  /** Preço unitário: até 4 casas, porque há itens de R$ 0,005. */
  preco: (v: Valor) => (vazio(v) ? '—' : `R$ ${decimal.format(Number(v))}`),
  int: (v: Valor) => (vazio(v) ? '—' : inteiro.format(Number(v))),
  num: (v: Valor) => (vazio(v) ? '—' : decimal.format(Number(v))),
  pct: (v: Valor) => (vazio(v) ? '—' : `${(Number(v) * 100).toFixed(1).replace('.', ',')}%`),
  data: (v: Valor) => (v ? String(v).slice(0, 10).split('-').reverse().join('/') : '—'),
  mes: (v: Valor) => {
    const [ano, mes] = String(v).split('-')
    return `${MESES[Number(mes) - 1]}/${ano.slice(2)}`
  },
  cnpj: (v: Valor) => {
    const s = String(v ?? '')
    return s.length === 14 ? s.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : s || '—'
  },
}

export function mascaraCnpj(valor: string) {
  const d = valor.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

/** Remove acentos e pontuação para comparar nomes (ex.: "Ijuí" == "IJUI"). */
export const normalizar = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()

export const truncar = (s: unknown, n = 40) => {
  const texto = String(s ?? '')
  return texto.length > n ? `${texto.slice(0, n - 1)}…` : texto
}

export const esc = (s: unknown) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )
