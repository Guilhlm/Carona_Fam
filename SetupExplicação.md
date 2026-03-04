## Documentação de Arquitetura - Carona FAM

Este arquivo descreve a arquitetura da aplicação Carona FAM, baseada no plano técnico utilizado para implementação. As seções abaixo detalham:

- Visão geral da arquitetura
- Estrutura de pastas do frontend e backend
- Modelagem de banco de dados com Prisma
- Rotas e serviços principais da API
- Camada de frontend (rotas, layouts, componentes)
- Infraestrutura com Docker e variáveis de ambiente

---

## Visão geral da arquitetura

- **Monorepo**: um único repositório com `frontend` (React) e `backend` (Node/Express) mais arquivos de infra na raiz.
- **Frontend**: React (Vite + JSX, sem TypeScript), React Router, TailwindCSS, organização por `pages`, `components`, `layouts`, `routes`, `services`, `hooks`, `contexts`.
- **Backend**: Node.js + Express, Prisma ORM com PostgreSQL, camadas bem separadas em `controllers`, `services`, `routes`, `middlewares`, `prisma`, `utils`, `config`.
- **Autenticação**: JWT com roles (ex: `USER`, `DRIVER`, `ADMIN`), hash de senha com bcrypt, middleware de autenticação e autorização.
- **Infra**: Docker + Docker Compose com serviços `frontend`, `backend` e `postgres`, variáveis via `.env`, rede entre containers configurada.

```mermaid
flowchart LR
  user[UserBrowser] --> frontend[FrontendReact]
  frontend --> backend[BackendExpress]
  backend --> db[PostgresPrisma]
  adminUser[AdminBrowser] --> frontend
```



## Estrutura de pastas proposta

- **Raiz do projeto**
  - `README.md`
  - `.env.example`
  - `docker-compose.yml`
  - `[frontend/](frontend/)` (app React)
  - `[backend/](backend/)` (API Node/Express)
- **Frontend (`frontend/`)**
  - `index.html`
  - `package.json`
  - `vite.config.js`
  - `postcss.config.cjs`
  - `tailwind.config.cjs`
  - `src/`
    - `[src/main.jsx](frontend/src/main.jsx)` (entry React + BrowserRouter + providers de contexto)
    - `[src/App.jsx](frontend/src/App.jsx)` (shell principal + `RouterProvider`)
    - `[src/routes/index.jsx](frontend/src/routes/index.jsx)` (definição central das rotas)
    - `pages/`
      - `HomePage.jsx`
      - `ProfilePage.jsx` (perfil com seções Sobre, Avaliações, Mensagens, Configurações Gerais)
      - `AuthLoginPage.jsx` / `AuthRegisterPage.jsx`
      - `Admin/`
        - `AdminDashboardPage.jsx`
        - `AdminUsersPage.jsx`
        - `AdminDriversPage.jsx`
        - `AdminRidesPage.jsx`
    - `components/`
      - `ui/` (botões, inputs, modais, tabelas reutilizáveis)
      - `navigation/` (navbar, sidebars para admin)
      - `ride/` (cards de corridas, status, etc.)
      - `admin/` (tabelas de usuários, filtros, botões de bloqueio)
    - `layouts/`
      - `MainLayout.jsx` (layout padrão autenticado/não autenticado)
      - `AdminLayout.jsx` (layout com sidebar, header admin)
    - `services/`
      - `api.js` (instância base axios/fetch configurada com baseURL e JWT)
      - módulos específicos: `authService.js`, `userService.js`, `driverService.js`, `rideService.js`, `adminService.js`
    - `hooks/`
      - `useAuth.js` (controle de sessão, login, logout, usuário atual)
      - `useFetch.js` (hook genérico para chamadas à API com loading/erro)
      - `usePagination.js`, etc. se necessário
    - `contexts/`
      - `AuthContext.jsx` (provider global com estado do usuário e token)
      - opcional: `ThemeContext.jsx` ou `RideContext.jsx`
    - `styles/`
      - `index.css` (import Tailwind + estilos globais)
- **Backend (`backend/`)**
  - `package.json`
  - `[backend/src/server.js](backend/src/server.js)` (bootstrap do servidor, listen e espera pelo DB)
  - `[backend/src/app.js](backend/src/app.js)` (instancia Express, middlewares e rotas)
  - `src/config/`
    - `env.js` (carrega `.env`, validação básica, exporta config)
    - `database.js` (instancia PrismaClient, helpers de conexão)
  - `src/prisma/`
    - `[backend/prisma/schema.prisma](backend/prisma/schema.prisma)` (modelagem do banco baseada nas tabelas fornecidas + ajustes Uber-like)
    - `migrations/` (geradas pelo Prisma)
    - `seed.js` (semente inicial de usuários/admin/drivers de exemplo)
  - `src/routes/`
    - `index.js` (registra sub-rotas)
    - `auth.routes.js`
    - `users.routes.js`
    - `drivers.routes.js`
    - `rides.routes.js`
    - `admin.routes.js` (listagens e bloqueio de usuário)
  - `src/controllers/`
    - `AuthController.js`
    - `UserController.js`
    - `DriverController.js`
    - `RideController.js`
    - `AdminController.js`
  - `src/services/`
    - `AuthService.js`
    - `UserService.js`
    - `DriverService.js`
    - `RideService.js`
    - `AdminService.js`
  - `src/middlewares/`
    - `authMiddleware.js` (valida JWT, injeta `req.user`)
    - `adminMiddleware.js` (garante role admin para rotas sensíveis)
    - `errorHandler.js` (tratamento centralizado de erros)
    - `validateRequest.js` (validação simples de payload, p.ex. usando Joi/Yup futuramente)
  - `src/utils/`
    - `jwt.js` (geração/validação de tokens)
    - `password.js` (hash e compare usando bcrypt)
    - `logger.js` (logger simples com níveis e correlação de requests)
    - `response.js` (helpers para respostas padronizadas)

## Modelagem de banco com Prisma (baseada em Uber + tabelas fornecidas)

- **Objetivo**: traduzir as tabelas `alunos`, `veiculos`, `corridas`, `corrida_passageiros`, `avaliacoes` para modelos Prisma, ajustando tipos para PostgreSQL e adicionando campos para autenticação/segurança.
- **Modelos principais em `[backend/prisma/schema.prisma](backend/prisma/schema.prisma)`** (em alto nível):
  - `User` (equivalente a `alunos`)
    - Campos: `id`, `name`, `email`, `ra`, `course`, `gender`, `age`, `phone`, `cep`, `photoUrl`, `passwordHash`, `isAdmin`, `isBlocked`, `createdAt`, `updatedAt`.
    - Relacionamentos: um-para-muitos com `Vehicle`, um-para-muitos com `Ride` como `driver`, muitos-para-muitos com `Ride` através de `RidePassenger`, relacionamentos para `Review` como avaliador/avaliado.
  - `Vehicle` (equivalente a `veiculos`)
    - Campos: `id`, `driverId`, `brand`, `model`, `plate`, `year`, `capacityTotal`, `photoUrl`.
  - `Ride` (equivalente a `corridas` com semântica Uber-like)
    - Campos: `id`, `driverId`, `vehicleId`, `origin`, `destination`, `distanceKm`, `suggestedValue`, `departureAt`, `arrivalAt`, `availableSeats`, `status` (enum `ACTIVE`, `FINISHED`, `CANCELLED`), `createdAt`.
  - `RidePassenger` (equivalente a `corrida_passageiros`)
    - Campos: `id`, `rideId`, `passengerId`, `status` (enum `PENDING`, `CONFIRMED`, `CANCELLED`), `requestedAt`.
  - `Review` (equivalente a `avaliacoes`)
    - Campos: `id`, `rideId`, `reviewerId`, `reviewedId`, `rating`, `comment`, `createdAt`.
- **Autenticação**:
  - Armazenar apenas `passwordHash` (bcrypt) no modelo `User`.
  - Inclui campo `role` como enum (`USER`, `DRIVER`, `ADMIN`) ou derivado de flags; para simplificar o plano, usaremos um enum `UserRole`.

## Backend: rotas, controllers e services

- **Rotas de autenticação (`[backend/src/routes/auth.routes.js](backend/src/routes/auth.routes.js)`)**
  - `POST /api/auth/register` (registro de usuários padrão, possivelmente drivers com flag específica).
  - `POST /api/auth/login` (retorna JWT com payload mínimo: `sub`, `role`).
- **Rotas de usuários (`[backend/src/routes/users.routes.js](backend/src/routes/users.routes.js)`)**
  - `GET /api/users/me` (dados do usuário autenticado).
  - `GET /api/users` (lista paginada, protegida por admin).
  - `PATCH /api/users/:id/block` (bloquear/desbloquear, em `admin.routes.js`).
- **Rotas de motoristas (`[backend/src/routes/drivers.routes.js](backend/src/routes/drivers.routes.js)`)**
  - `GET /api/drivers` (lista de motoristas, filtros básicos).
  - `GET /api/drivers/:id` (detalhes + veículos + avaliações).
- **Rotas de corridas (`[backend/src/routes/rides.routes.js](backend/src/routes/rides.routes.js)`)**
  - `GET /api/rides` (corridas ativas, com filtros por origem/destino, horário, vagas).
  - `POST /api/rides` (criação de corrida por motorista autenticado).
  - `POST /api/rides/:id/request` (passageiro solicita vaga).
  - `PATCH /api/rides/:id/status` (motorista atualiza status: ativa/finalizada/cancelada).
  - `GET /api/rides/history` (histórico de corridas do usuário ou motorista autenticado).
- **Rotas admin (`[backend/src/routes/admin.routes.js](backend/src/routes/admin.routes.js)`)**
  - `GET /api/admin/users` (listagem com filtros: bloqueado, admin, etc.).
  - `GET /api/admin/drivers` (lista motoristas, veículos e estatísticas básicas).
  - `GET /api/admin/rides` (lista corridas com paginação, status, motoristas, passageiros).
  - `PATCH /api/admin/users/:id/block` (bloqueia/desbloqueia usuário com auditoria simples).
- **Controllers**
  - Cada controller apenas:
    - Recebe `req`, `res`.
    - Valida/parsa dados básicos.
    - Chama o service correspondente.
    - Usa helpers de resposta e deixa a lógica de negócio para os services.
- **Services**
  - `AuthService`: registro (com hash de senha), login (compare bcrypt, gera JWT), refresh token opcional futuro.
  - `UserService`: CRUD de usuários, lógica de bloqueio (ex: impedir login se `isBlocked`), filtros admin.
  - `DriverService`: gerenciamento de veículos, perfil de motorista.
  - `RideService`: criação, consulta, histórico, regras como checar vagas disponíveis antes de aceitar passageiros.
  - `AdminService`: agregações para listagens, contadores, auditoria simples de bloqueios.

## Backend: middlewares e utilitários

- `**[backend/src/middlewares/authMiddleware.js](backend/src/middlewares/authMiddleware.js)`**
  - Extrai token do header `Authorization: Bearer <token>`.
  - Valida JWT usando `utils/jwt.js`.
  - Carrega usuário básico do banco (id, role, isBlocked) e anexa em `req.user`.
  - Se bloqueado, retorna 403 em qualquer rota protegida.
- `**[backend/src/middlewares/adminMiddleware.js](backend/src/middlewares/adminMiddleware.js)`**
  - Verifica `req.user.role === 'ADMIN'`.
- `**[backend/src/middlewares/errorHandler.js](backend/src/middlewares/errorHandler.js)`**
  - Captura erros lançados pelos services/controllers.
  - Mapeia para HTTP codes adequados (400, 401, 403, 404, 500) e mensagens padronizadas.
- `**[backend/src/utils/jwt.js](backend/src/utils/jwt.js)`**
  - `signToken(payload, options)` e `verifyToken(token)` usando `jsonwebtoken`.
- `**[backend/src/utils/password.js](backend/src/utils/password.js)**`
  - `hashPassword(plain)` usando `bcrypt` com salt rounds do `.env`.
  - `comparePassword(plain, hash)`.

## Frontend: rotas, páginas e layout

- **Definição de rotas (`[frontend/src/routes/index.jsx](frontend/src/routes/index.jsx)`)**
  - Rotas públicas: `/`, `/login`, `/register`.
  - Rotas autenticadas: `/ride/in-progress`, `/rides/history`, `/profile/`*.
  - Rotas admin: `/admin`, `/admin/users`, `/admin/drivers`, `/admin/rides` protegidas por `RequireAdmin` (HOC/componente wrapper que consulta `AuthContext`).
- **Layouts**
  - `MainLayout`: cabeçalho, conteúdo, rodapé, lida com estado de autenticação global.
  - `AdminLayout`: sidebar com navegação entre Usuários, Motoristas, Corridas, header com info de admin.
- **Páginas admin**
  - `AdminUsersPage`: tabela paginada de usuários com ação de bloqueio/desbloqueio.
  - `AdminDriversPage`: listagem com informações de veículos, rating médio, número de corridas.
  - `AdminRidesPage`: listagem com filtros por status, motorista, período.
- **Hooks & contextos**
  - `AuthContext`/`useAuth`: guarda token JWT, dados do usuário e funções `login`, `logout`, `refreshUser`, lê/escreve em `localStorage`.
  - `useFetch`: abstrai chamadas à API com loading/erro e inclui automaticamente o header `Authorization` se houver token.

## Frontend: Tailwind e componentes

- **Configuração Tailwind**
  - `tailwind.config.cjs` com paths `./index.html`, `./src/**/*.{js,jsx}`.
  - `index.css` importando `@tailwind base; @tailwind components; @tailwind utilities;`.
- **Componentes reutilizáveis**
  - Botões (`Button`), inputs (`Input`, `Select`), `Table`, `Badge` de status de corridas, `Card` para corridas.
  - Componentes focados em acessibilidade e responsividade (mobile-first), adequados para padrão de mercado.

## Docker & DevOps

- **Dockerfile backend (`[backend/Dockerfile](backend/Dockerfile)`)**
  - Base: imagem oficial Node LTS (ex: `node:20-alpine`).
  - Copiar apenas `package*.json` + `prisma` para instalar dependências e gerar Prisma Client.
  - Rodar `npm ci`, `npx prisma generate`.
  - Copiar código `src/`.
  - CMD de produção: script Node que:
    - Aguarda o banco ficar disponível (tentando conexão via Prisma com retries).
    - Roda `npx prisma migrate deploy`.
    - Sobe o servidor (`node src/server.js`).
- **Dockerfile frontend (`[frontend/Dockerfile](frontend/Dockerfile)`)**
  - Fase 1: build com `node:20-alpine`, rodando `npm ci` + `npm run build`.
  - Fase 2: servir build estático com `nginx:alpine` (ou alternativamente `node` com `vite preview` para dev).
  - Configuração de `nginx.conf` simples para SPA (fallback `try_files $uri /index.html`).
- **docker-compose (`[docker-compose.yml](docker-compose.yml)`)**
  - Serviço `db` (PostgreSQL):
    - Imagem `postgres:16-alpine`.
    - Variáveis: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` vindas do `.env`.
    - Volume para persistência.
    - `healthcheck` com `pg_isready`.
  - Serviço `backend`:
    - `build: ./backend`.
    - `depends_on` `db` com `condition: service_healthy`.
    - Variáveis: `DATABASE_URL`, `PORT`, `JWT_SECRET`, `BCRYPT_SALT_ROUNDS`, `NODE_ENV`.
    - Porta mapeada: `4000:4000`.
  - Serviço `frontend`:
    - `build: ./frontend`.
    - Depende de `backend`.
    - Variável `VITE_API_BASE_URL` apontando para `http://backend:4000/api` dentro da rede docker.
    - Porta mapeada: `5173:80` (Vite build servido pelo nginx na porta 80).

## Variáveis de ambiente e .env.example

- **Arquivo `[.env.example](.env.example)` na raiz** contendo seções comentadas:
  - **Backend**:
    - `PORT=4000`
    - `NODE_ENV=development`
    - `JWT_SECRET=changeme-super-secret`
    - `BCRYPT_SALT_ROUNDS=10`
    - `DATABASE_URL=postgresql://postgres:postgres@db:5432/carona_fam?schema=public`
  - **Banco local fora do Docker (opcional)**:
    - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/carona_fam?schema=public`
  - **Frontend**:
    - `VITE_API_BASE_URL=http://localhost:4000/api`

## Scripts de inicialização

- **Backend (`backend/package.json`)**
  - `dev`: `nodemon src/server.js` com recarregamento.
  - `start`: `node src/server.js`.
  - `prisma:migrate`: `prisma migrate dev`.
  - `prisma:deploy`: `prisma migrate deploy`.
  - `prisma:generate`: `prisma generate`.
  - `seed`: `node prisma/seed.js`.
- **Frontend (`frontend/package.json`)**
  - `dev`: `vite`.
  - `build`: `vite build`.
  - `preview`: `vite preview`.
- **Fluxo Docker**
  - `docker-compose up --build` para subir todo o ambiente.

## README e documentação

- `**[README.md](README.md)`**
  - Descrição do projeto Carona FAM.
  - Stack utilizada e arquitetura geral.
  - Instruções de setup local (sem Docker) e com Docker.
  - Comandos principais (scripts npm, migrações Prisma, seed).
  - Visão geral das rotas principais da API (auth, users, drivers, rides, admin).
  - Visão geral das páginas principais do frontend (Home, Corrida em andamento, Histórico, Perfil, Área Admin).
  - Seção sobre segurança (hash de senha, JWT, bloqueio de usuários) e próximos passos (ex: rate limiting, logs estruturados, testes automatizados).

