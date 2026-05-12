# Fase 2 - Frontend Admin 100% POO (sem hooks)

Este guia define como migrar a área de admin do frontend para um padrão orientado a objetos,
evitando hooks customizados e concentrando estado e regras em classes.

## Objetivos

- Remover dependência dos hooks `useAdmin*` para CRUD admin.
- Centralizar regras em classes de caso de uso e store.
- Manter os mesmos endpoints e payloads já existentes em `/api/admin`.
- Reduzir lógica de regra de negócio dentro de componentes de UI.

## Arquitetura alvo

```mermaid
flowchart LR
  adminPage[AdminPageClassComponent] --> adminPresenter[AdminPresenter]
  adminPresenter --> adminStore[AdminStore]
  adminPresenter --> adminUseCases[AdminUseCases]
  adminUseCases --> adminApiClient[AdminApiClientClass]
  adminApiClient --> backendApi[/api/admin]
```

## Camadas propostas

1. `AdminApiClient` (classe)
   - Encapsula chamadas HTTP (`listUsers`, `updateUser`, `deleteUser`, `listRides`, etc.).
   - Fica em `frontend/src/services/admin/AdminApiClient.js`.

2. `AdminUseCases` (classe)
   - Encapsula regras de aplicação do frontend (normalização, filtros, paginação).
   - Exemplo: `loadUsers(params)`, `toggleUserBlock(input)`, `cancelRide(id)`.
   - Fica em `frontend/src/domain/admin/AdminUseCases.js`.

3. `AdminStore` (classe observável simples)
   - Mantém estado mutável da tela (loading, error, data, pagination, filtros).
   - Exposição mínima: `getState()`, `setState()`, `subscribe(listener)`.
   - Fica em `frontend/src/stores/admin/AdminStore.js`.

4. `AdminPresenter` (classe)
   - Conecta `AdminUseCases` + `AdminStore` + ciclo de vida dos componentes.
   - Métodos de UI: `onInit()`, `onFilterChange()`, `onPageChange()`, `onAction()`.
   - Fica em `frontend/src/presenters/admin/AdminPresenter.js`.

5. Componentes de classe React
   - `AdminLayout` e páginas `AdminUsersPage`, `AdminDriversPage`, `AdminVehiclesPage`,
     `AdminReviewsPage`, `AdminRidesPage` migradas para `class extends React.Component`.
   - UI continua com `AdminCard`, `AdminFilters`, `AdminPagination` no início.

## Sequência recomendada de migração

1. Criar `AdminApiClient` com os mesmos métodos atuais de `adminService.js`.
2. Criar `AdminStore` + `AdminPresenter` para módulo de usuários.
3. Migrar `AdminUsersPage` para classe React consumindo o presenter.
4. Repetir padrão para motoristas, veículos, reviews e corridas.
5. Remover hooks `useAdminFetch`, `useAdminFilters`, `useAdminUsers`, etc., após migração completa.

## Critérios de aceite da fase 2

- Nenhuma tela admin depende de hooks customizados para CRUD.
- Estado e ações passam por classes (`Store`, `Presenter`, `UseCases`).
- Requisições continuam compatíveis com backend atual.
- Fluxos essenciais preservados: busca, filtros, paginação, bloqueio, desativação, cancelamento.

## Riscos e mitigação

- Re-render excessivo em componentes de classe:
  - Mitigar com `shouldComponentUpdate` e granularidade no estado.
- Complexidade de estado em listas expansíveis:
  - Isolar estratégia de expansão em classe utilitária (`ExpandableListManager`).
- Regressão de UX:
  - Validar manualmente os cinco módulos admin antes de remover hooks antigos.
