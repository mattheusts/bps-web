import { useQuery } from '@tanstack/react-query'
import { ChevronsUpDownIcon, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useDebounce } from '@/hooks/use-debounce'
import { api } from '@/lib/api'
import { fmt, truncar } from '@/lib/format'
import type { MedicamentoBusca } from '@/types/api'

export function BuscaMedicamento({ rotulo, aoEscolher }: { rotulo: string; aoEscolher: (catmat: number) => void }) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const termo = useDebounce(busca.trim())
  const { data = [], isFetching, isError } = useQuery({
    queryKey: ['medicamentos', termo],
    queryFn: () => api<MedicamentoBusca[]>('/dashboard/medicamentos', { params: { q: termo } }),
    enabled: termo.length >= 2,
  })

  return (
    <div className="grid min-w-0 flex-1 gap-1.5 md:min-w-96">
      <Label className="text-xs text-muted-foreground">Medicamento (nome ou CATMAT)</Label>
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={aberto} className="w-full justify-between bg-card font-normal">
            <span className="flex min-w-0 items-center gap-2">
              <SearchIcon className="text-muted-foreground" />
              <span className="truncate">{rotulo || 'Ex.: amoxicilina ou 267510'}</span>
            </span>
            <ChevronsUpDownIcon className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) min-w-80 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Digite ao menos 2 caracteres…" value={busca} onValueChange={setBusca} />
            <CommandList>
              <CommandEmpty>
                {termo.length < 2
                  ? 'Digite para buscar.'
                  : isError
                    ? 'Erro ao buscar.'
                    : isFetching
                      ? 'Buscando…'
                      : 'Nenhum medicamento com compras.'}
              </CommandEmpty>
              <CommandGroup>
                {data.map((m) => (
                  <CommandItem
                    key={m.co_catmat}
                    value={String(m.co_catmat)}
                    onSelect={() => {
                      aoEscolher(m.co_catmat)
                      setAberto(false)
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{truncar(m.ds_item, 90)}</span>
                      <span className="text-xs text-muted-foreground">
                        CATMAT {m.co_catmat} · {fmt.int(m.n)} compras
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
