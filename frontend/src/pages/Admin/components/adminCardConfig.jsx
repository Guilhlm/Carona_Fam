import React from 'react';
import Badge from '../../../components/ui/Badge';
import { formatDate } from '../../../utils/formatDate';

const rideStatusLabels = {
  ACTIVE: 'Ativa',
  FINISHED: 'Finalizada',
  CANCELLED: 'Cancelada',
};
const rideStatusVariant = {
  ACTIVE: 'info',
  FINISHED: 'success',
  CANCELLED: 'danger',
};
const passengerStatusLabels = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
};
const passengerStatusVariant = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'danger',
};

function getItemId(item, variant) {
  return item?.id ?? null;
}

export const CARD_VARIANTS = ['review', 'ride', 'driver', 'vehicle', 'user'];

export function getCardConfig(variant) {
  const configs = {
    review: {
      expandable: true,
      getItemId: (item) => getItemId(item, 'review'),
      getBadge: (item) => {
        const isDisabled = !!item.isDisabled;
        const label = isDisabled ? 'Desativado' : `${item.rating ?? 0} ★`;
        return { label, variant: isDisabled ? 'danger' : 'warning' };
      },
      getTitle: (item) => (
        <>
          <p className="font-medium text-sm md:text-base text-text-main truncate">
            Review · {item.reviewerName}
          </p>
          <span className="text-[10px] md:text-xs text-text-main/85">
            → {item.reviewedName}
          </span>
        </>
      ),
      getSubtitle: (item) => (
        <p className="text-xs md:text-sm text-text-main/85 truncate">
          {item.reviewerEmail}
          {item.reviewerRa && ` · RA ${item.reviewerRa}`}
        </p>
      ),
      getExpandContent: (item) => {
        const ride = item.ride;
        if (!ride) return null;
        return (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-xs md:text-sm text-text-main/85 shrink-0">
            <p><span className="text-text-main/85">Origem:</span> {ride.origin}</p>
            <p><span className="text-text-main/85">Destino:</span> {ride.destination}</p>
            <p><span className="text-text-main/85">Saída:</span> {formatDate(ride.departureAt)}</p>
            <p><span className="text-text-main/85">Chegada:</span> {formatDate(ride.arrivalAt)}</p>
            {ride.vehicle && (
              <p><span className="text-text-main/85">Veículo:</span> {ride.vehicle}</p>
            )}
            {ride.passengers?.length > 0 && (
              <p>
                <span className="text-text-main/85">Passageiros:</span>{' '}
                {ride.passengers.map((p) => p.name).join(', ')}
              </p>
            )}
          </div>
        );
      },
      actionType: 'disable-with-reason',
      getIsDisabled: (item) => !!item.isDisabled,
      getReasonFromItem: (item) => item.disabledReason ?? '',
      reasonPlaceholder: 'Motivo da desativação',
      reasonAriaLabel: 'Motivo da desativação',
      getActionLabel: (isDisabled) => isDisabled ? 'Ativar Review' : 'Desativar Review',
    },

    ride: {
      expandable: true,
      getItemId: (item) => getItemId(item, 'ride'),
      getBadge: (item) => {
        const status = item.status ?? 'ACTIVE';
        return {
          label: rideStatusLabels[status] ?? status,
          variant: rideStatusVariant[status] ?? 'default',
        };
      },
      getTitle: (item) => (
        <p className="font-medium text-sm md:text-base text-text-main truncate">
          {item.origin} → {item.destination}
        </p>
      ),
      getSubtitle: (item) => {
        const passengers = Array.isArray(item.passengers) ? item.passengers : [];
        const count = passengers.length;
        const names = passengers
          .map((rp) => rp.passenger?.name ?? rp.passengerId ?? '—')
          .join(' / ');
        return (
          <>
            <p className="text-xs md:text-sm text-text-main/85 truncate">
              Motorista: {item.driver?.name ?? '—'}
            </p>
            <p className="text-xs text-text-main/85 mt-1 truncate">
              {item.departureAt
                ? new Date(item.departureAt).toLocaleString('pt-BR')
                : '—'}
            </p>
            <div className="pt-2">
              {count > 0 && (
                <p className="text-xs text-text-main/85 truncate mt-0.5">
                  {names}
                </p>
              )}
            </div>
          </>
        );
      },
      getExpandContent: (item) => {
        const passengers = Array.isArray(item.passengers) ? item.passengers : [];
        return (
          <div className="border-t border-white/10 pt-4 pb-1 flex-1 min-h-0 flex flex-col overflow-hidden">
            <p className="text-xs font-medium text-text-main/85 mb-3 flex-shrink-0">Confirmações dos passageiros</p>
            {passengers.length === 0 ? (
              <p className="text-xs text-text-main/85 flex-shrink-0">Nenhum passageiro nesta corrida.</p>
            ) : (
              <ul className="space-y-2 min-h-0 overflow-y-auto flex-1 pr-1">
                {passengers.map((rp) => {
                  const pStatus = rp.status ?? 'PENDING';
                  const pLabel = passengerStatusLabels[pStatus] ?? pStatus;
                  const pVariant = passengerStatusVariant[pStatus] ?? 'default';
                  return (
                    <li
                      key={rp.id}
                      className="flex items-start justify-between gap-3 text-xs rounded-lg bg-white/5 px-4 py-3 flex-shrink-0 min-w-0"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                        <span className="font-medium text-text-main truncate block min-w-0">
                          {rp.passenger?.name ?? rp.passengerId ?? '—'}
                        </span>
                        <span className="text-text-main/85 shrink-0">–</span>
                        <Badge variant={pVariant} className="shrink-0">{pLabel}</Badge>
                      </div>
                      <div className="flex flex-col items-end text-right shrink-0 text-text-main/85">
                        <span>Solicitado: {rp.requestedAt ? formatDate(rp.requestedAt) : '—'}</span>
                        <span>Finalizado: {rp.finishedAt ? formatDate(rp.finishedAt) : '—'}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      },
      actionType: 'cancel',
      showCancelWhen: (item) => (item.status ?? 'ACTIVE') === 'ACTIVE',
    },

    driver: {
      expandable: false,
      getItemId: (item) => getItemId(item, 'driver'),
      getBadge: (item) => {
        const isBlocked = !!item.isBlocked;
        return { label: isBlocked ? 'Bloqueado' : 'Ativo', variant: isBlocked ? 'danger' : 'success' };
      },
      getTitle: (item) => {
        const vehicleCount = Array.isArray(item.vehicles) ? item.vehicles.length : 0;
        return (
          <>
            <p className="font-medium text-sm md:text-base text-text-main truncate">{item.name}</p>
            <span className="text-[10px] md:text-xs text-text-main/85">
              · {vehicleCount} {vehicleCount === 1 ? 'veículo' : 'veículos'}
            </span>
            {(item.role === 'ADMIN' || item.isAdmin) && (
              <span className="text-[10px] md:text-xs text-brand uppercase tracking-wide">
                {item.role}
                {item.isAdmin ? ' · ADMIN' : ''}
              </span>
            )}
          </>
        );
      },
      getSubtitle: (item) => (
        <p className="text-xs md:text-sm text-text-main/85 truncate">
          {item.email}
          {item.ra && ` · RA ${item.ra}`}
        </p>
      ),
      getExpandContent: () => null,
      actionType: 'block-with-reason',
      getIsDisabled: (item) => !!item.isBlocked,
      getReasonFromItem: (item) => item.blockReason ?? '',
      reasonPlaceholder: 'Motivo do bloqueio',
      reasonAriaLabel: 'Motivo do bloqueio',
      getActionLabel: (isBlocked) => isBlocked ? 'Ativar Usuário' : 'Bloquear Usuário',
      hideActionsWhen: (_item, props) => !!props.isCurrentUser,
    },

    vehicle: {
      expandable: false,
      getItemId: (item) => getItemId(item, 'vehicle'),
      getBadge: (item) => {
        const isDisabled = !!item.isDisabled;
        return { label: isDisabled ? 'Desativado' : 'Ativo', variant: isDisabled ? 'danger' : 'success' };
      },
      getTitle: (item) => (
        <>
          <p className="font-medium text-sm md:text-base text-text-main truncate">
            {item.brand} {item.model}
          </p>
          <span className="text-[10px] md:text-xs text-text-main/85">
            Placa: {item.plate ?? '—'}
          </span>
        </>
      ),
      getSubtitle: (item) => (
        <p className="text-xs md:text-sm text-text-main/85 truncate">
          {item.driverEmail}
          {item.driverRa && ` · RA ${item.driverRa}`}
        </p>
      ),
      getExpandContent: () => null,
      actionType: 'disable-with-reason',
      getIsDisabled: (item) => !!item.isDisabled,
      getReasonFromItem: (item) => item.disabledReason ?? '',
      reasonPlaceholder: 'Motivo da desativação',
      reasonAriaLabel: 'Motivo da desativação',
      getActionLabel: (isDisabled) => isDisabled ? 'Ativar Veículo' : 'Desativar Veículo',
    },

    user: {
      expandable: false,
      getItemId: (item) => getItemId(item, 'user'),
      getBadge: (item) => {
        const isBlocked = !!item.isBlocked;
        return { label: isBlocked ? 'Bloqueado' : 'Ativo', variant: isBlocked ? 'danger' : 'success' };
      },
      getTitle: (item) => (
        <>
          <p className="font-medium text-sm md:text-base text-text-main truncate">{item.name}</p>
          <span className="text-[10px] md:text-xs text-brand uppercase tracking-wide">
            {item.role}
            {item.isAdmin ? ' · ADMIN' : ''}
          </span>
        </>
      ),
      getSubtitle: (item) => (
        <p className="text-xs md:text-sm text-text-main/85 truncate">
          {item.email}
          {item.ra && ` · RA ${item.ra}`}
        </p>
      ),
      getExpandContent: () => null,
      actionType: 'user-actions',
      hideActionsWhen: (_item, props) => !!props.isCurrentUser,
      getIsAdmin: (item) => item.role === 'ADMIN' || !!item.isAdmin,
      getIsBlocked: (item) => !!item.isBlocked,
    },
  };
  return configs[variant] ?? null;
}