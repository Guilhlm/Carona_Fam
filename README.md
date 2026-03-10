# Carona FAM

Aplicação fullstack inspirada na Uber para compartilhamento de caronas. Permite que usuários encontrem ou ofereçam corridas, com painel administrativo para gerenciamento.

## Stack

- **Frontend**: React (JSX), Vite, TailwindCSS, React Router, Nominatim, Leaflet
- **Backend**: Node.js, Express, Prisma ORM, Axios, OpenRouteService
- **Banco de dados**: PostgreSQL
- **Infraestrutura**: Docker, Docker Compose

## Estrutura do Projeto

```
Carona_Fam/
├── frontend/          # Aplicação React
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   └── styles/
│   └── ...
├── backend/           # API Node/Express
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── routes/
│       ├── services/
│       └── utils/
├── docker-compose.yml
└── .env.example
```

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+ (ou Docker)
- npm ou yarn

## Configuração

### 1. Guia rápido (para quem não conhece Node/Docker)

Você tem **dois jeitos** de rodar o projeto:

- **Opção A – COM Docker (mais simples, recomendada)**  
- **Opção B – SEM Docker (modo desenvolvimento)**  

Escolha **somente uma** das opções abaixo.

---

### Opção A – Rodar tudo com Docker (recomendado)

1. **Instalar o Docker Desktop**
   - Baixe e instale o Docker Desktop (Windows, macOS ou Linux).
2. **Configurar variáveis de ambiente para Docker**
   - Na **raiz** do projeto (`Carona_Fam/`) copie o exemplo:

   ```bash
   cp .env.example .env
   ```

   - Para uso com Docker você **não precisa alterar nada** do `.env` se for usar os valores padrão (`postgres/postgres`).

3. **Subir os containers**

   Na raiz do projeto:

   ```bash
   docker-compose up --build
   ```

4. **Acessar a aplicação**
   - Frontend (site): `http://localhost:5173`
   - API (backend): `http://localhost:4000`
   - Banco PostgreSQL: porta `5432` (dentro do Docker)

   O backend aguarda o banco ficar saudável (healthcheck) e roda as migrações automaticamente.

5. **Parar os containers**

   No terminal onde o Docker está rodando, pressione `Ctrl+C`.  
   Ou use:

   ```bash
   docker-compose down
   ```

---

### Opção B – Desenvolvimento local (sem Docker)

#### 1. Pré-requisitos locais

- PostgreSQL instalado na máquina (pode ser via Docker separado ou instalação normal)
- Node.js 18+ instalado

#### 2. Criar o banco de dados

No PostgreSQL, crie o banco:

```sql
CREATE DATABASE carona_fam;
```

#### 3. Configurar variáveis de ambiente do backend

Crie um arquivo `.env` **dentro da pasta `backend/`**:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/carona_fam?schema=public
PORT=4000
NODE_ENV=development
JWT_SECRET=changeme-super-secret-use-strong-key-in-production
BCRYPT_SALT_ROUNDS=10
ORS_API_KEY=
```

> Ajuste `postgres:postgres` se o seu usuário/senha do PostgreSQL forem diferentes.

#### 4. Instalar e preparar o backend

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

O backend ficará disponível em `http://localhost:4000`.

#### 5. Instalar e rodar o frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O Vite exibirá no terminal qual porta está usando (ex.: `http://localhost:5173` ou `http://localhost:5174`).  
Abra o link mostrado no terminal do Vite no navegador.

O frontend está configurado para enviar todas as requisições `/api/...` para `http://localhost:4000` (via proxy do Vite em `vite.config.js`), então é importante que o **backend esteja rodando primeiro**.

## Scripts

### Backend

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia com nodemon (hot reload) |
| `npm start` | Inicia em produção |
| `npm run prisma:migrate` | Cria/aplica migrações |
| `npm run prisma:deploy` | Aplica migrações em produção |
| `npm run prisma:generate` | Gera Prisma Client |
| `npm run prisma:studio` | Abre Prisma Studio |
| `npm run seed` | Executa seed do banco |

### Frontend

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build para produção |
| `npm run preview` | Preview do build |

## API - Principais rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Cadastro |
| POST | `/api/auth/login` | Login |
| GET | `/api/users/me` | Dados do usuário (auth) |
| GET | `/api/drivers` | Lista motoristas |
| GET | `/api/rides` | Lista corridas ativas |
| GET | `/api/rides/history` | Histórico (auth) |
| POST | `/api/rides` | Criar corrida (auth, driver) |
| GET | `/api/admin/users` | Lista usuários (admin) |
| GET | `/api/admin/drivers` | Lista motoristas (admin) |
| GET | `/api/admin/rides` | Lista corridas (admin) |
| PATCH | `/api/admin/users/:id/block` | Bloquear/desbloquear (admin) |
| POST | `/api/coordinate/route` | Calcula distância, tempo e gera rota (OpenRouteService) |

## Segurança

- Senhas com hash bcrypt
- Autenticação JWT
- Middleware de autenticação e autorização (admin)
- Bloqueio de usuários impede login

## Próximos passos

- Rate limiting
- Logs estruturados
- Testes automatizados
- CI/CD
