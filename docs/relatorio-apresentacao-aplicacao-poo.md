# Relatório técnico — Carona_Fam: visão da aplicação e foco em POO

**Objetivo:** documentar, para apresentação acadêmica, o funcionamento das principais áreas do sistema **Carona_Fam** (frontend e backend), usando **terminologia de engenharia de software** e **referências explícitas a arquivos e linhas de código**. O eixo conceitual é a **Programação Orientada a Objetos (POO)** e como ela aparece (ou não) em cada camada.

---

## 1. Contexto da aplicação

Trata-se de um sistema web típico **cliente–servidor**:

- **Cliente (frontend):** SPA em **React** (JavaScript), consumindo API HTTP.
- **Servidor (backend):** API **REST** em **Node.js** com **Express**, persistência via **Prisma** (ORM) sobre banco relacional.

A separação física cliente/servidor já materializa o princípio de **baixo acoplamento** entre interface e regras de negócio persistidas no servidor.

---

## 2. Backend: arquitetura em camadas e POO

### 2.1 Ponto de entrada e bootstrap (não orientado a objetos por classes)

O arquivo `backend/src/server.js` realiza o **bootstrap** do processo: carrega configuração, aguarda conexão com o banco e sobe o listener HTTP (linhas 1–47). O trecho é predominantemente **procedural** (sequência de chamadas e funções assíncronas), sem definição de classes.

O `backend/src/app.js` configura middlewares globais do Express e monta as rotas sob o prefixo `/api` (linhas 1–23). Também é **configuração imperativa**, não uma classe de aplicação.

**Relevância para POO:** em projetos reais, nem todo arquivo precisa ser uma classe; o padrão **“composition root”** costuma misturar scripts de inicialização com o núcleo orientado a objetos.

### 2.2 Camada de roteamento (configuração declarativa / procedural)

Exemplo: `backend/src/routes/index.js` agrega sub-rotas (`auth`, `users`, `rides`, etc.) no `Router` do Express (linhas 1–20). Cada arquivo em `backend/src/routes/*.routes.js` associa **verbos HTTP + path** a **manipuladores** (handlers).

**Relevância para POO:** as rotas funcionam como **mapeamento** entre URLs e comportamento; o objeto central é o `Router` do framework, não uma hierarquia de classes definida pelo domínio.

### 2.3 Padrão Controller (POO — classe + injeção de dependência)

Os **controllers** encapsulam a **adaptação** entre o modelo de dados HTTP (`req`, `res`, `next`) e a camada de serviço. Ilustração com autenticação:

- Arquivo: `backend/src/controllers/AuthController.js`
- **Classe** `AuthController` (linhas 4–51) com **construtor** que recebe o serviço (`constructor(service)`, linhas 5–7) — isso é **injeção de dependência (DI)** via construtor, um recurso clássico de POO para **inversão de controle (IoC)**.
- Métodos de instância como `register`, `login`, etc. (linhas 9–50) delegam a `this.service` e formatam resposta com helpers (`created`, `success`).
- **Instância singleton exportada:** `module.exports = new AuthController(authService);` (linha 53) — o módulo atua como **fábrica** que fixa as dependências na carga do processo.

O **AdminController** segue o mesmo padrão: classe com `constructor(service)` (`backend/src/controllers/AdminController.js`, linhas 4–7) e export `new AdminController(adminApplicationService)` (linha 187).

**Conceitos POO evidenciados:** **classe**, **objeto**, **encapsulamento** (detalhes HTTP ficam no controller), **delegação** para o serviço, **composição** (controller “tem um” serviço, não herda dele).

### 2.4 Padrão Service (POO — regras de negócio)

O **serviço** concentra **casos de uso** e invariantes de negócio, sem conhecer detalhes de Express.

Exemplo: `backend/src/services/AuthService.js`

- Declaração `class AuthService` com **construtor** recebendo um **objeto de dependências** (`authRepository`, `hashPassword`, `comparePassword`, `signToken`) — linhas 1–7. Isso é **DI por objeto de opções**, variante flexível do padrão construtor.
- Método `register(data)` (a partir da linha 9): validações de unicidade (email/RA), hash de senha, criação via repositório, emissão de token — **coesão** em torno do caso de uso “registrar usuário”.

**Conceitos POO:** responsabilidade única por classe de serviço (no sentido **SRP** do SOLID, aplicado ao nível do módulo/classe), **abstração** sobre persistência.

### 2.5 Padrão Repository (POO — acesso a dados)

Exemplo: `backend/src/repositories/AuthRepository.js`

- `class AuthRepository` com `constructor(prismaClient)` (linhas 1–4) armazenando o cliente ORM em `this.prisma`.
- Métodos como `findByEmail`, `createUser`, `updatePasswordById` (linhas 6–41) isolam **consultas Prisma** — padrão **Repository**, que some uma **camada de persistência** entre domínio e banco.

**Conceitos POO:** **abstração de dados**, **encapsulamento** das queries; facilita testes substituindo o repositório por um **dublê** (mock/stub).

### 2.6 Composition root do domínio “Auth”

Arquivo: `backend/src/services/auth/index.js`

- Instancia `new AuthRepository(prisma)` (linha 7).
- Instancia `new AuthService({ authRepository, hashPassword, comparePassword, signToken })` (linhas 9–14).
- Exporta apenas o serviço (linha 16).

Esse arquivo é o **composition root** da feature: **compõe objetos** e define o **grafo de dependências**. É o lugar onde POO encontra **configuração explícita**.

### 2.7 Caso administrativo: serviço de aplicação com múltiplos repositórios

- `backend/src/services/admin/AdminApplicationService.js`: classe que no **construtor** (linhas 1–14) recebe **quatro repositórios** e `hashPassword` — padrão **Application Service** em DDD-lite: orquestra operações que atravessam agregados (usuários, veículos, avaliações, corridas).
- Exemplo de orquestração: `listRides` chama o repositório e aplica `serializeRide` (linhas 56–64) para normalizar tipos numéricos do banco — **responsabilidade de adaptação** no serviço.
- `backend/src/services/admin/index.js` (linhas 1–22): **composition root** que cria os quatro repositórios admin e injeta no `AdminApplicationService`.

### 2.8 Middleware orientado a objetos vs funções utilitárias

**Classe:** `backend/src/middlewares/authMiddleware.js`

- `class AuthMiddleware` com construtor injetando `authRepository`, `verifyTokenFn`, `errorResponse` (linhas 6–11).
- Método `handle` (linhas 13–43): pipeline de validação Bearer → decode JWT → carga do usuário → `req.user` → `next()`.
- Exportação: instância configurada (linhas 46–51) e `module.exports = authMiddleware.handle` (linha 53) — o Express recebe uma **função ligada** ao objeto middleware (**currying** semântico: o handler é o método da instância).

**Funções puras / HOF:** `backend/src/middlewares/validateRequest.js` exporta `validateBody` e `validateParams` (linhas 3–31) — **higher-order functions** que retornam middlewares; **não** são classes. O mesmo vale para `backend/src/middlewares/errorHandler.js` (função `errorHandler`).

**Conclusão para apresentação:** o backend **combina** POO (controllers, services, repositories, middleware como classe) com **estilo funcional/procedural** (rotas, validação genérica, utilitários como `backend/src/utils/response.js`, linhas 1–23).

---

## 3. Frontend: arquitetura React e relação com POO

### 3.1 Ausência de `class` em JavaScript

No diretório `frontend/src`, os componentes de interface são **funções** (React Hooks). Não há classes ES6 para UI — alinhado à recomendação atual do ecossistema React.

### 3.2 Montagem da árvore e provedores (composição)

Arquivo: `frontend/src/main.jsx` (linhas 9–18)

- `BrowserRouter` → `AuthProvider` → `ToastProvider` → `App`.
- Isso implementa **composição de componentes** e o padrão **Provider** do React Context API.

### 3.3 Context API como “fachada” de estado compartilhado

Arquivo: `frontend/src/contexts/AuthContext.jsx`

- `createContext` (linha 4) define um **contexto tipado logicamente** (autenticação).
- `AuthProvider` (linhas 6–64): mantém **estado** (`useState`) e expõe **operações** (`login`, `register`, `logout`, `refreshUser`) no objeto `value` — analogia acadêmica com **fachada** ou **API pública** de um subsistema, embora implementada sem classe.
- `useAuth` (linhas 67–73): hook que **encapsula** o acesso ao contexto e falha se usado fora do provider — **invariante de uso** explícita.

**Ligação com POO (disciplina):** pode-se argumentar **encapsulamento** e **contrato** (o que o módulo exporta), mesmo sem classes; muitos cursos tratam React Context + hooks como **programação por composição**, complementar à POO.

### 3.4 Roteamento e controle de acesso declarativo

Arquivo: `frontend/src/routes/index.jsx`

- Componentes `RequireAuth` e `RequireAdmin` (linhas 17–29) encapsulam a **política de navegação** (autenticado? admin?).
- Array de rotas (a partir da linha 32): configuração **declarativa** das páginas.

### 3.5 Camada de integração HTTP (módulos funcionais)

- `frontend/src/services/api.js`: instância **Axios** com interceptors (linhas 4–36) — **objeto** com comportamento, criado por fábrica `axios.create`, não por classe própria do projeto.
- `frontend/src/services/authService.js`: funções `login`, `register`, etc. (linhas 3–27) — **camada de adaptação** cliente/servidor, análoga em papel a um **cliente de API** ou **Gateway** no sentido arquitetural.

### 3.6 Componente raiz da UI

Arquivo: `frontend/src/App.jsx` (linhas 5–21)

- `useRoutes(routes)` integra o roteador com a árvore de layout e fundo visual.

---

## 4. Tabela-resumo: onde a POO aparece

| Camada / artefato | POO explícita (classes) | Referência |
|-------------------|-------------------------|------------|
| Controller HTTP | Sim | `AuthController.js` L4–53; `AdminController.js` L4–7, L187 |
| Serviço de negócio | Sim | `AuthService.js` L1–7; `AdminApplicationService.js` L1–14 |
| Repositório (ORM) | Sim | `AuthRepository.js` L1–41 |
| Middleware JWT | Sim | `authMiddleware.js` L6–53 |
| Composition root | Instanciação | `services/auth/index.js` L7–16; `services/admin/index.js` L8–22 |
| Rotas Express | Não (config) | `routes/index.js` L1–20 |
| Validação genérica | Não (HOF) | `validateRequest.js` L3–31 |
| Respostas JSON | Não (funções) | `utils/response.js` L1–23 |
| Frontend React | Não (`class` JS) | `AuthContext.jsx` L6–73; `main.jsx` L9–18 |

---

## 5. Frases prontas para defesa oral (foco POO)

1. **“No backend aplicamos camadas inspiradas em arquitetura em N camadas com POO: Controller trata HTTP, Service concentra regras, Repository abstrai o Prisma, com injeção de dependência no construtor.”**  
   *Evidência:* `AuthController.js` L5–7 e L53; `AuthService.js` L1–7; `AuthRepository.js` L1–4.

2. **“O arquivo `services/auth/index.js` é o composition root: ele só instancia e liga objetos, sem regra de negócio.”**  
   *Evidência:* linhas 7–16.

3. **“No frontend não usamos classes ES6; usamos composição de funções e Context API, o que ainda respeita encapsulamento e separação de responsabilidades, paradigma típico do React moderno.”**  
   *Evidência:* `AuthContext.jsx` L53–64; `authService.js` L3–10.

4. **“O sistema não é ‘100% POO’: utilitários e rotas seguem estilo funcional/procedural, o que é comum em APIs Express.”**  
   *Evidência:* `validateRequest.js`, `response.js`, `server.js`.

---

## 6. Escopo funcional por área (visão para slide)

| Área | Função resumida | Onde ver no código |
|------|-----------------|-------------------|
| Autenticação | Registro, login, token JWT, senha | Backend: `AuthController`, `AuthService`, `AuthRepository`, `authMiddleware`; Frontend: `authService.js`, `AuthContext.jsx` |
| Perfil / usuário | Dados do usuário logado | Rotas em `routes/index.jsx` (`/home/profile`); páginas em `pages/ProfilePage.jsx` (integração) |
| Corridas | Solicitar, disponíveis, histórico, em andamento | Rotas `rides/*` em `frontend/src/routes/index.jsx`; controllers/serviços `Ride*` no backend |
| Admin | Listagens, bloqueios, cancelamentos | `AdminController.js`, `AdminApplicationService.js`, repositórios em `repositories/admin/` |
| Infra HTTP cliente | Base URL, headers, 401 | `frontend/src/services/api.js` L3–36 |

---

*Documento gerado para fins acadêmicos — descreve o estado do repositório na data de elaboração e deve ser atualizado se arquivos forem movidos ou renumerados.*
