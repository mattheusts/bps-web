import { useQuery } from '@tanstack/react-query'
import {
  ActivityIcon,
  BadgeDollarSignIcon,
  BoxesIcon,
  Building2Icon,
  ChevronsUpDownIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FactoryIcon,
  FileUpIcon,
  LandmarkIcon,
  LogOutIcon,
  MapIcon,
  MapPinIcon,
  MoonIcon,
  PillIcon,
  ReceiptTextIcon,
  ShieldAlertIcon,
  SunIcon,
  TruckIcon,
  UsersIcon,
  type LucideIcon,
  PieChartIcon,
} from 'lucide-react'
import { Suspense } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/context'
import { CarregandoPagina } from '@/components/estados'
import { useTema } from '@/components/layout/tema-contexto'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { api } from '@/lib/api'
import type { TabelaMeta } from '@/types/api'

const PAINEIS = [
  { para: '/mapa', rotulo: 'Mapa de compras', icone: MapIcon },
  { para: '/precos', rotulo: 'Preço de referência', icone: BadgeDollarSignIcon },
  { para: '/sobrepreco', rotulo: 'Alerta de sobrepreço', icone: ShieldAlertIcon },
  { para: '/mercado', rotulo: 'Mercado', icone: PieChartIcon },
]

const ICONES: Record<string, LucideIcon> = {
  estado: LandmarkIcon,
  municipio: MapPinIcon,
  fabricante: FactoryIcon,
  fornecedor: TruckIcon,
  instituicao: Building2Icon,
  usuario: UsersIcon,
  pdm: BoxesIcon,
  medicamento: PillIcon,
  processo_compra: ClipboardListIcon,
  item_compra: ReceiptTextIcon,
}

function ItemMenu({ para, rotulo, icone: Icone }: { para: string; rotulo: string; icone: LucideIcon }) {
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={pathname === para} tooltip={rotulo}>
        <NavLink to={para} onClick={() => isMobile && setOpenMobile(false)}>
          <Icone />
          <span>{rotulo}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function MenuUsuario() {
  const { usuario, sair } = useAuth()
  const { isMobile } = useSidebar()
  const iniciais = (usuario?.nome ?? '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary/15 text-xs font-medium text-primary">
                  {iniciais}
                </AvatarFallback>
              </Avatar>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{usuario?.nome}</span>
                <span className="truncate text-xs text-muted-foreground">{usuario?.perfil}</span>
              </span>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side={isMobile ? 'top' : 'right'} align="end" className="min-w-52">
            <DropdownMenuLabel>{usuario?.nome}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={sair}>
              <LogOutIcon />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function BotaoTema() {
  const { tema, definirTema } = useTema()
  const escuro = tema === 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
      onClick={() => definirTema(escuro ? 'light' : 'dark')}
    >
      {escuro ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}

export function AppLayout() {
  const { usuario } = useAuth()
  const { pathname } = useLocation()
  const { data: tabelas = [] } = useQuery({
    queryKey: ['crud-meta'],
    queryFn: () => api<TabelaMeta[]>('/crud'),
    staleTime: Infinity,
  })
  const podeImportar = usuario?.perfil === 'ADMIN' || usuario?.perfil === 'OPERADOR'
  const atual =
    PAINEIS.find((p) => p.para === pathname)?.rotulo ??
    tabelas.find((t) => pathname === `/cadastros/${t.nome}`)?.rotulo ??
    (pathname === '/importar' ? 'Importar CSV' : 'BPS')

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <NavLink to="/mapa">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <ActivityIcon className="size-4" />
                  </span>
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="font-semibold">BPS</span>
                    <span className="truncate text-xs text-muted-foreground">Banco de Preços em Saúde</span>
                  </span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Painéis</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {PAINEIS.map((p) => (
                  <ItemMenu key={p.para} {...p} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Cadastros</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {tabelas.map((t) => (
                  <ItemMenu
                    key={t.nome}
                    para={`/cadastros/${t.nome}`}
                    rotulo={t.rotulo}
                    icone={ICONES[t.nome] ?? DatabaseIcon}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {podeImportar && (
            <SidebarGroup>
              <SidebarGroupLabel>Dados</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <ItemMenu para="/importar" rotulo="Importar CSV" icone={FileUpIcon} />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter>
          <MenuUsuario />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur">
          <SidebarTrigger aria-label="Alternar menu" className="size-9" />
          <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />
          <span className="truncate text-sm font-medium">{atual}</span>
          <span className="ml-auto">
            <BotaoTema />
          </span>
        </header>
        <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6">
          <Suspense fallback={<CarregandoPagina />}>
            <Outlet />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
