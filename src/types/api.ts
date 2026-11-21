export type Perfil = 'ADMIN' | 'OPERADOR' | 'CONSULTA'

export interface Usuario {
  id: number
  nome: string
  perfil: Perfil
}

export type TipoColuna = 'int' | 'decimal' | 'string' | 'text' | 'date' | 'datetime' | 'flag' | 'enum' | 'senha'

export interface ColunaMeta {
  nome: string
  rotulo: string
  tipo: TipoColuna
  obrigatorio: boolean
  tamanho?: number
  opcoes?: string[]
  fk?: string
  auto?: 'pk' | 'usuarioAtual' | 'hoje' | 'banco'
  ocultaNaLista: boolean
  cnpj: boolean
}

export interface TabelaMeta {
  nome: string
  rotulo: string
  pk: string
  podeEscrever: boolean
  colunas: ColunaMeta[]
}

export type Registro = Record<string, string | number | null | undefined>

export interface ListaResposta {
  linhas: Registro[]
  total: number
  pagina: number
  tamanho: number
}

export interface Opcao {
  id: number
  rotulo: string
}

export interface OpcoesFiltros {
  anos: number[]
  esferas: string[]
  tipos: string[]
}

export interface MedicamentoBusca {
  co_catmat: number
  ds_item: string
  n: number
}

export interface TotaisRegiao {
  vl_total: number
  qt_itens: number
  qt_processos: number
  qt_instituicoes: number
}

export interface MapaEstado extends TotaisRegiao {
  sg_uf: string
  no_estado: string
}

export interface MapaMunicipio extends TotaisRegiao {
  id_municipio: number
  no_municipio: string
  co_ibge: number | null
}

export interface MapaResumo {
  kpi: TotaisRegiao & { qt_medicamentos: number; qt_fornecedores: number }
  medicamentos: { co_catmat: number; ds_item: string; vl_total: number; qt: number }[]
  instituicoes: { no_instituicao: string; no_municipio: string; sg_uf: string; vl_total: number }[]
}

export interface Estatisticas {
  n: number
  minimo: number
  p25: number
  mediana: number
  p75: number
  maximo: number
  media: number
  media_ponderada: number
}

export interface PrecoResposta {
  medicamento: { co_catmat: number; ds_item: string } | null
  geral: Estatisticas | null
  porUf: (Estatisticas & { sg_uf: string })[]
  porMes: (Estatisticas & { mes: string })[]
  porFornecedor: (Estatisticas & { id_fornecedor: number; no_fornecedor: string })[]
  compras: {
    co_seq_bps: number
    dt_compra: string
    sg_uf: string
    no_municipio: string
    no_instituicao: string
    no_fornecedor: string
    qt_medicamento: number
    vl_preco_unitario: number
    vl_preco_total: number
  }[]
}

export interface ItemSobrepreco {
  id_item_compra: number
  co_catmat: number
  ds_item: string
  un: string
  dt_compra: string
  nu_processo_compra: string
  sg_uf: string
  no_municipio: string
  no_instituicao: string
  no_fornecedor: string
  qt_medicamento: number
  vl_preco_unitario: number
  vl_preco_total: number
  mediana: number
  n_amostra: number
  razao: number
  vl_excedente: number
}

export interface SobreprecoResposta {
  parametros: { fator: number; minAmostra: number; limite: number }
  resumo: { qt_itens: number; vl_excedente: number; vl_pago: number; qt_medicamentos: number }
  porUf: { sg_uf: string; qt_itens: number; vl_excedente: number }[]
  porFornecedor: { no_fornecedor: string; qt_itens: number; vl_excedente: number }[]
  itens: ItemSobrepreco[]
}

export interface MercadoResposta {
  fornecedores: { nome: string; vl_total: number; qt_itens: number }[]
  fabricantes: { nome: string; vl_total: number; qt_itens: number }[]
  hhi: { qt_fornecedores: number; hhi: number; vl_total: number }
  genericos: { fg_generico: 'S' | 'N' | 'I'; vl_total: number; qt_itens: number }[]
  modalidades: { nome: string; vl_total: number; qt_processos: number }[]
  esferas: { nome: string; tp_compra: string; vl_total: number }[]
  mensal: { mes: string; vl_total: number; qt_itens: number }[]
}

export interface RelatorioImportacao {
  segundos: number
  linhas: number
  inseridos: number
  existentes: number
  ignorados: number
  novos: Record<string, number>
  erros: { linha: number; mensagem: string }[]
}
