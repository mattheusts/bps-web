# BPS Web

Interface do Banco de Preços em Saúde, feita com Vite, React, TypeScript, Tailwind CSS e shadcn/ui. Consome a API do projeto `bps-api`.

## Como rodar

Pré-requisitos: Node 20.19+ e a `bps-api` em execução.

```bash
npm install
cp .env.example .env   # opcional: muda o endereço da API
npm run dev            # http://localhost:5173
```

O Vite encaminha `/api` para `VITE_API_PROXY`, que por padrão é `http://localhost:3000`.

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia o ambiente de desenvolvimento |
| `npm run build` | Verifica os tipos e gera o build em `dist/` |
| `npm run preview` | Serve o build localmente, com o proxy da API |
| `npm run lint` | Roda o linter |

## Deploy no Railway

O GitHub Actions valida cada PR e push. Na `main`, depois de passar, publica com `railway up`. O deploy fica desligado até a variável `RAILWAY_SERVICE` existir no repositório.

1. No mesmo projeto da API, crie um serviço vazio chamado `bps-web`, sem conectar ao GitHub.
2. Defina `API_URL=http://${{bps-api.RAILWAY_PRIVATE_DOMAIN}}:3000` e `PORT=8080`.
3. Configure o healthcheck como `/healthz` e gere um domínio público para este serviço.
4. Crie um token de projeto para o ambiente `production` e salve no GitHub: secret `RAILWAY_TOKEN` e variável `RAILWAY_SERVICE=bps-web`.

## Telas

| Tela | Requisitos |
|---|---|
| Login e sessão | RF01 |
| Cadastros, guiados pelos metadados da API | RF02 a RF08, RN01, RN02 |
| Importar CSV | RF09 |
| Mapa de compras | RF10, RN05 |
| Preço de referência | RF11, RN03 |
| Alerta de sobrepreço | RF12, RN03, RN04, RN05 |
| Mercado | RF13, RN05 |

Os mapas usam as malhas da API do IBGE, então o navegador precisa de internet para exibi-los.

## Estrutura

```
src/
  auth/        sessão, login e proteção de rotas
  components/  layout, filtros, gráficos, estados e componentes shadcn/ui
  features/    uma pasta por tela
  hooks/       debounce e filtros na URL
  lib/         cliente da API, formatação e dados geográficos
  types/       contratos da API
```
