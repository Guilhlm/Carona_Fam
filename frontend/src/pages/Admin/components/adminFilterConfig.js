/**
 * Configuração estática dos selects de filtro por seção.
 * Cada página monta selects={ buildSelects(REVIEWS_SELECTS, filters, setFilter) }.
 */
export const REVIEWS_SELECTS = [
  {
    key: 'filterOrder',
    options: [
      { value: '', label: 'Ordenar por' },
      { value: 'recent', label: 'Mais recentes' },
      { value: 'rating_desc', label: 'Maior nota' },
      { value: 'driver_asc', label: 'Por motorista' },
    ],
    placeholder: 'Ordenar por',
    ariaLabel: 'Ordenar avaliações',
  },
  {
    key: 'filterStatus',
    options: [
      { value: '', label: 'Todos' },
      { value: 'false', label: 'Ativos' },
      { value: 'true', label: 'Desativados' },
    ],
    placeholder: 'Status',
    ariaLabel: 'Filtrar por status',
  },
];

export const RIDES_SELECTS = [
  {
    key: 'filterStatus',
    options: [
      { value: '', label: 'Todos os status' },
      { value: 'ACTIVE', label: 'Ativas' },
      { value: 'FINISHED', label: 'Finalizadas' },
      { value: 'CANCELLED', label: 'Canceladas' },
    ],
    placeholder: 'Status',
    ariaLabel: 'Filtrar por status',
  },
  {
    key: 'filterOrder',
    options: [
      { value: 'date_desc', label: 'Data recente' },
      { value: 'date_asc', label: 'Data antiga' },
      { value: 'passengers_desc', label: 'Número de passageiros' },
      { value: 'driver_asc', label: 'Motorista' },
      { value: 'passenger_asc', label: 'Usuário' },
    ],
    placeholder: 'Ordenar por',
    ariaLabel: 'Ordenar corridas',
  },
];

export const DRIVERS_SELECTS = [
  {
    key: 'filterOrder',
    options: [
      { value: '', label: 'Ordenar por' },
      { value: 'name_asc', label: 'A-Z' },
      { value: 'name_desc', label: 'Z-A' },
    ],
    placeholder: 'Ordenar por',
    ariaLabel: 'Ordenar motoristas',
  },
  {
    key: 'filterStatus',
    options: [
      { value: '', label: 'Todos' },
      { value: 'false', label: 'Ativos' },
      { value: 'true', label: 'Bloqueados' },
    ],
    placeholder: 'Status',
    ariaLabel: 'Filtrar por status',
  },
];

export const VEHICLES_SELECTS = [
  {
    key: 'filterOrder',
    options: [
      { value: '', label: 'Ordenar por' },
      { value: 'brand_asc', label: 'A-Z' },
      { value: 'brand_desc', label: 'Z-A' },
    ],
    placeholder: 'Ordenar por',
    ariaLabel: 'Ordenar veículos',
  },
  {
    key: 'filterStatus',
    options: [
      { value: '', label: 'Todos' },
      { value: 'false', label: 'Ativos' },
      { value: 'true', label: 'Desativados' },
    ],
    placeholder: 'Status',
    ariaLabel: 'Filtrar por status',
  },
];

export const USERS_SELECTS = [
  {
    key: 'filterRole',
    options: [
      { value: '', label: 'Todas as funções' },
      { value: 'USER', label: 'Usuários' },
      { value: 'DRIVER', label: 'Motoristas' },
      { value: 'ADMIN', label: 'Admins' },
    ],
    placeholder: 'Todas as funções',
    ariaLabel: 'Filtrar por função',
  },
  {
    key: 'filterBlocked',
    options: [
      { value: '', label: 'Todos' },
      { value: 'false', label: 'Ativos' },
      { value: 'true', label: 'Bloqueados' },
    ],
    placeholder: 'Todos',
    ariaLabel: 'Filtrar por status',
  },
];

export function buildSelects(selectConfigs, filters, setFilter, loading) {
  return selectConfigs.map((sel) => ({
    key: sel.key,
    value: filters[sel.key] ?? '',
    onChange: (v) => setFilter(sel.key, v),
    options: sel.options,
    placeholder: sel.placeholder,
    ariaLabel: sel.ariaLabel,
  }));
}