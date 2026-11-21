import type { Feature, FeatureCollection } from 'geojson'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, useMap } from 'react-leaflet'
import { esc, fmt } from '@/lib/format'
import { corClasse, quantis, RAMPA } from '@/lib/geo'
import type { TotaisRegiao } from '@/types/api'

export type Metrica = keyof TotaisRegiao

export const METRICAS: Record<Metrica, { rotulo: string; formatar: (v: number) => string }> = {
  vl_total: { rotulo: 'Valor total', formatar: fmt.moedaCurta },
  qt_itens: { rotulo: 'Itens comprados', formatar: fmt.int },
  qt_processos: { rotulo: 'Processos', formatar: fmt.int },
  qt_instituicoes: { rotulo: 'Instituições', formatar: fmt.int },
}

const SEM_DADO = 'var(--muted)'

interface Props {
  geo: FeatureCollection
  metrica: Metrica
  detalhado: boolean
  dadoDe: (f: Feature) => TotaisRegiao | undefined
  nomeDe: (f: Feature) => string
  aoClicar: (f: Feature) => void
}

function dica(nome: string, d: TotaisRegiao | undefined) {
  if (!d) return `<strong>${esc(nome)}</strong><br>Sem compras no recorte`
  return `<strong>${esc(nome)}</strong><br>Valor: ${esc(fmt.moeda(d.vl_total))}<br>
    Itens: ${esc(fmt.int(d.qt_itens))} · Processos: ${esc(fmt.int(d.qt_processos))}<br>
    Instituições: ${esc(fmt.int(d.qt_instituicoes))}`
}

function Camada({ geo, metrica, detalhado, dadoDe, nomeDe, aoClicar, cortes }: Props & { cortes: number[] }) {
  const mapa = useMap()
  // Handlers em ref: trocar a função não pode recriar a camada nem refazer o enquadramento.
  const clique = useRef(aoClicar)
  useEffect(() => {
    clique.current = aoClicar
  }, [aoClicar])

  useEffect(() => {
    const cor = (v: number | undefined) => {
      if (!v) return SEM_DADO
      const i = cortes.findIndex((c) => v <= c)
      return corClasse(i === -1 ? cortes.length - 1 : i, cortes.length)
    }
    const estilo = (f?: Feature): L.PathOptions => ({
      fillColor: f ? cor(dadoDe(f)?.[metrica]) : SEM_DADO,
      fillOpacity: 1,
      color: 'var(--background)',
      weight: detalhado ? 0.6 : 1.2,
    })
    const camada = L.geoJSON(geo, {
      style: estilo,
      onEachFeature: (f, layer) => {
        layer.bindTooltip(dica(nomeDe(f), dadoDe(f)), { sticky: true, className: 'dica-mapa' })
        layer.on({
          mouseover: () => (layer as L.Path).setStyle({ weight: 2.5, color: 'var(--foreground)' }),
          mouseout: () => camada.resetStyle(layer),
          click: () => clique.current(f),
        })
      },
    }).addTo(mapa)
    mapa.fitBounds(camada.getBounds(), { padding: [8, 8] })
    return () => {
      camada.remove()
    }
  }, [mapa, geo, metrica, detalhado, dadoDe, nomeDe, cortes])

  return null
}

export function MapaCoropletico(props: Props) {
  const { geo, metrica, dadoDe } = props
  const m = METRICAS[metrica]
  const cortes = useMemo(() => {
    const valores = geo.features
      .map((f) => dadoDe(f)?.[metrica] ?? 0)
      .filter((v) => v > 0)
      .sort((a, b) => a - b)
    return quantis(valores, RAMPA.length)
  }, [geo, metrica, dadoDe])

  return (
    <div className="relative isolate">
      <MapContainer
        center={[-14, -52]}
        zoom={4}
        zoomSnap={0.25}
        attributionControl={false}
        className="h-[420px] w-full rounded-lg bg-transparent! md:h-[560px]"
      >
        <Camada {...props} cortes={cortes} />
      </MapContainer>
      <div className="absolute bottom-2 left-2 z-[500] rounded-lg border bg-popover/95 p-2.5 text-[11px] shadow-sm backdrop-blur">
        <p className="mb-1 font-medium">{m.rotulo}</p>
        <ul className="grid gap-0.5">
          {cortes.map((c, i) => (
            <li key={c} className="flex items-center gap-1.5 tabular-nums">
              <i className="size-3 rounded-xs" style={{ background: corClasse(i, cortes.length) }} />
              {m.formatar(i === 0 ? 0 : cortes[i - 1])} – {m.formatar(c)}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <i className="size-3 rounded-xs border" style={{ background: SEM_DADO }} />
            Sem compras
          </li>
        </ul>
      </div>
    </div>
  )
}
