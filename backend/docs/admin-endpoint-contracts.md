# Contratos atuais da API Admin

Este documento registra o contrato HTTP atual dos endpoints da área administrativa.
O objetivo é preservar compatibilidade durante a refatoração para POO.

Base URL: `/api/admin`

Formato de resposta de sucesso:

```json
{
  "success": true,
  "data": {}
}
```

## Usuários

- `GET /users`
  - Query: `page`, `limit`, `isBlocked`, `role`, `search`
  - Resposta `data`: `{ data: UserSummary[], pagination }`
- `POST /users`
  - Body: `email`, `password?`, `name?`, `ra?`, `course?`, `gender?`, `age?`, `phone?`, `cep?`, `role?`, `isAdmin?`
  - Resposta `data`: `UserSummary`
- `GET /users/:id`
  - Resposta `data`: `UserDetails`
- `PATCH /users/:id`
  - Body parcial de atualização: `name`, `email`, `ra`, `course`, `gender`, `age`, `phone`, `cep`, `role`, `isAdmin`, `isBlocked`
  - Resposta `data`: `UserDetails`
- `DELETE /users/:id`
  - Resposta `data`: `{ success: true }`
- `PATCH /users/:id/block`
  - Body: `block?` (default `true`), `blockReason?`
  - Resposta `data`: `{ id, name, email, isBlocked, blockReason }`

## Corridas

- `GET /rides`
  - Query: `page`, `limit`, `status`, `origin`, `destination`, `search`, `order`
  - Resposta `data`: `{ data: RideAdminListItem[], pagination }`
- `PATCH /rides/:id/cancel`
  - Resposta `data`: `Ride`

## Motoristas

- `GET /drivers`
  - Query: `page`, `limit`, `isBlocked`, `search`
  - Resposta `data`: `{ data: DriverAdminItem[], pagination }`

## Veículos

- `GET /vehicles`
  - Query: `page`, `limit`, `isDisabled`, `search`, `order`
  - Resposta `data`: `{ data: VehicleAdminItem[], pagination }`
- `PATCH /vehicles/:id/disable`
  - Body: `disable?` (default `true`), `disabledReason?`
  - Resposta `data`: `Vehicle` (com `driver`)

## Avaliações

- `GET /reviews`
  - Query: `page`, `limit`, `isDisabled`, `search`, `order`
  - Resposta `data`: `{ data: ReviewAdminItem[], pagination }`
- `PATCH /reviews/:id/disable`
  - Body: `disable?` (default `true`), `disabledReason?`
  - Resposta `data`: `Review` (com `reviewer` e `reviewed`)

## Erros esperados

Erros retornam via middleware global, mantendo formato:

```json
{
  "success": false,
  "error": "Mensagem"
}
```

Status comuns:
- `400`: validação/regra de negócio
- `401`: token inválido/ausente
- `403`: sem permissão admin
- `404`: recurso não encontrado
- `409`: conflito (email/RA duplicado)
