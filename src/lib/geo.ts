import type { FeatureCollection } from 'geojson'

/** Código IBGE de cada UF (as malhas do IBGE identificam áreas por esse código). */
export const UF_IBGE: Record<string, number> = {
  RO: 11, AC: 12, AM: 13, RR: 14, PA: 15, AP: 16, TO: 17, MA: 21, PI: 22, CE: 23, RN: 24, PB: 25, PE: 26, AL: 27,
  SE: 28, BA: 29, MG: 31, ES: 32, RJ: 33, SP: 35, PR: 41, SC: 42, RS: 43, MS: 50, MT: 51, GO: 52, DF: 53,
}

export const IBGE_UF: Record<string, string> = Object.fromEntries(
  Object.entries(UF_IBGE).map(([uf, codigo]) => [String(codigo), uf]),
)

export const UFS = Object.keys(UF_IBGE).sort()

const IBGE = 'https://servicodados.ibge.gov.br/api'
const GEO = 'formato=application/vnd.geo+json&qualidade=minima'

async function buscarIbge<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`IBGE respondeu ${res.status}`)
  return res.json() as Promise<T>
}

export const malhaBrasil = () => buscarIbge<FeatureCollection>(`${IBGE}/v3/malhas/paises/BR?intrarregiao=UF&${GEO}`)

export const malhaEstado = (uf: string) =>
  buscarIbge<FeatureCollection>(`${IBGE}/v3/malhas/estados/${UF_IBGE[uf]}?intrarregiao=municipio&${GEO}`)

export const municipiosIbge = (uf: string) =>
  buscarIbge<{ id: number; nome: string }[]>(`${IBGE}/v1/localidades/estados/${uf}/municipios`)

export const RAMPA = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b']

/** Com poucas classes, espalha as cores pela rampa inteira em vez de usar só as mais claras. */
export function corClasse(i: number, total: number) {
  const k = RAMPA.length
  return RAMPA[total <= 1 ? k - 1 : Math.round((i * (k - 1)) / (total - 1))]
}

/** Limites superiores de k classes por quantil (classes com o mesmo número de áreas). */
export function quantis(valores: number[], k: number) {
  if (!valores.length) return []
  const cortes: number[] = []
  for (let i = 1; i <= k; i++) {
    const v = valores[Math.min(valores.length - 1, Math.ceil((i / k) * valores.length) - 1)]
    if (!cortes.length || v > cortes[cortes.length - 1]) cortes.push(v)
  }
  return cortes
}
