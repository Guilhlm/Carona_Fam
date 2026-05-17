import React from 'react';
import Badge from '../../../components/ui/Badge';
import { formatDate } from '../../../utils/formatDate';

const rideStatusLabels = {
  WAITING_DRIVER: 'Aguardando motorista',
  DRIVER_ACCEPTED: 'Motorista aceito',
  DRIVER_ARRIVING: 'Motorista a caminho',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
};
const rideStatusVariant = {
  WAITING_DRIVER: 'warning',
  DRIVER_ACCEPTED: 'info',
  DRIVER_ARRIVING: 'info',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};
const cancellationActorLabels = {
  PASSENGER: 'Passageiro',
  DRIVER: 'Motorista',
  ADMIN: 'Administração',
  SYSTEM: 'Sistema',
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
            {item.reviewerName || 'Passageiro'} avaliou {item.reviewedName || 'motorista'}
          </p>
          <span className="text-[10px] md:text-xs text-text-main/70">
            {item.reviewerEmail}
            {item.reviewerRa ? ` · RA ${item.reviewerRa}` : ''}
          </span>
        </>
      ),
      getSubtitle: (item) => {
        const ride = item.ride;
        const comment = item.comment?.trim() || '';
        const commentPreview =
          comment.length > 72 ? `${comment.slice(0, 72)}…` : comment;

        return (
          <div className="mt-1.5 space-y-1 min-w-0">
            {ride ? (
              <>
                <p
                  className="text-xs text-text-main/85 truncate"
                  title={`${ride.origin} → ${ride.destination}`}
                >
                  <span className="text-text-main/55">Corrida · </span>
                  {ride.origin} → {ride.destination}
                </p>
                <p className="text-[11px] text-text-main/65 truncate">
                  {ride.departureAt ? (
                    <span>Saída {formatDate(ride.departureAt)}</span>
                  ) : null}
                </p>
              </>
            ) : (
              <p className="text-[11px] text-text-main/55">Corrida não vinculada</p>
            )}
            {commentPreview ? (
              <p className="text-[11px] text-text-main/60 line-clamp-2" title={comment}>
                <span className="text-text-main/50 not-italic">Comentário: </span>
                {commentPreview}
              </p>
            ) : (
              <p className="text-[11px] text-text-main/50">Sem comentário</p>
            )}
            {item.createdAt ? (
              <p className="text-[10px] text-text-main/45">
                Avaliado em {formatDate(item.createdAt)}
              </p>
            ) : null}
          </div>
        );
      },
      getExpandContent: (item) => {
        const ride = item.ride;
        return (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-3 text-xs md:text-sm text-text-main/85 shrink-0">
            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-text-main/55 mb-1">Comentário da avaliação</p>
              <p className="text-text-main whitespace-pre-wrap break-words">
                {item.comment?.trim() ? item.comment : '—'}
              </p>
            </div>
            {ride ? (
              <>
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
              </>
            ) : null}
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
        if (item.distanceKm != null) {
          return {
            label: `${Number(item.distanceKm).toFixed(1)} km`,
            variant: 'info',
          };
        }
        const value = item.actualValue ?? item.estimatedValue;
        if (value != null) {
          return {
            label: `R$ ${Number(value).toFixed(2)}`,
            variant: 'warning',
          };
        }
        return { label: 'Corrida', variant: 'default' };
      },
      getTitle: (item) => (
        <>
          <p
            className="font-medium text-sm md:text-base text-text-main truncate"
            title={`${item.origin} → ${item.destination}`}
          >
            {item.origin} → {item.destination}
          </p>
          <span className="text-[10px] md:text-xs text-text-main/70 truncate block">
            Passageiro: {item.requester?.name ?? '—'}
            {item.requester?.email ? ` · ${item.requester.email}` : ''}
          </span>
        </>
      ),
      getSubtitle: (item) => {
        const passengers = Array.isArray(item.passengers) ? item.passengers : [];
        const extraNames = passengers
          .map((rp) => rp.passenger?.name ?? rp.passengerId ?? '—')
          .filter(Boolean)
          .join(', ');
        const dateValue = item.departureAt ?? item.requestedAt;

        return (
          <div className="mt-1.5 space-y-1 min-w-0">
            <p className="text-xs text-text-main/85 truncate">
              <span className="text-text-main/55">Motorista: </span>
              {item.driver?.name ?? 'Aguardando motorista'}
            </p>
            {dateValue ? (
              <p className="text-[11px] text-text-main/65 truncate">
                Saída {formatDate(dateValue)}
              </p>
            ) : null}
            {(item.estimatedTimeMin != null ||
              (item.actualValue ?? item.estimatedValue) != null) && (
              <p className="text-[11px] text-text-main/65 truncate">
                {item.estimatedTimeMin != null ? (
                  <span>{item.estimatedTimeMin} min</span>
                ) : null}
                {(item.actualValue ?? item.estimatedValue) != null ? (
                  <span>
                    {item.estimatedTimeMin != null ? ' · ' : ''}
                    R$ {Number(item.actualValue ?? item.estimatedValue).toFixed(2)}
                  </span>
                ) : null}
              </p>
            )}
            {extraNames ? (
              <p className="text-[11px] text-text-main/60 line-clamp-2" title={extraNames}>
                <span className="text-text-main/50">Caronas: </span>
                {extraNames}
              </p>
            ) : null}
            {item.requestedAt ? (
              <p className="text-[10px] text-text-main/45">
                Solicitada em {formatDate(item.requestedAt)}
              </p>
            ) : null}
          </div>
        );
      },
      getStatusFooter: (item) => {
        const status = item.status ?? 'WAITING_DRIVER';
        return {
          label: rideStatusLabels[status] ?? status,
          variant: rideStatusVariant[status] ?? 'default',
        };
      },
      getExpandContent: (item) => {
        const passengers = Array.isArray(item.passengers) ? item.passengers : [];
        const stops = Array.isArray(item.stops) ? item.stops : [];
        return (
          <div className="border-t border-white/10 pt-4 pb-1 flex-1 min-h-0 flex flex-col overflow-hidden">
            {stops.length > 0 && (
              <div className="mb-3 flex-shrink-0">
                <p className="text-xs font-medium text-text-main/85 mb-1">Paradas</p>
                <ul className="space-y-1">
                  {stops.map((stop) => (
                    <li key={stop.id} className="text-xs text-text-main/85 truncate">
                      {stop.ordering + 1}. {stop.address}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {item.status === 'CANCELLED' && item.cancellationReason && (
              <div className="mb-3 flex-shrink-0 rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2 text-xs">
                <p>
                  <span className="text-text-main/85">Cancelado por: </span>
                  {cancellationActorLabels[item.cancelledBy] ?? item.cancelledBy ?? '—'}
                </p>
                <p className="mt-1">
                  <span className="text-text-main/85">Motivo: </span>
                  {item.cancellationReason}
                </p>
              </div>
            )}

            <p className="text-xs font-medium text-text-main/85 mb-3 flex-shrink-0">Confirmações dos passageiros</p>
            {passengers.length === 0 ? (
              <p className="text-xs text-text-main/85 flex-shrink-0">Nenhum passageiro adicional nesta corrida.</p>
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
      actionType: 'status-footer',
      showCancelWhen: (item) => {
        const status = item.status ?? 'WAITING_DRIVER';
        return ['WAITING_DRIVER', 'DRIVER_ACCEPTED', 'DRIVER_ARRIVING', 'IN_PROGRESS'].includes(status);
      },
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
        <>
          <p className="text-xs md:text-sm text-text-main/85 truncate">
            {item.email}
            {item.ra && ` · RA ${item.ra}`}
          </p>
          {item.isBlocked && item.blockReason ? (
            <p className="text-[11px] text-text-main/65 truncate mt-1">
              Motivo: {item.blockReason}
            </p>
          ) : null}
        </>
      ),
      getExpandContent: () => null,
      actionType: 'block-with-reason',
      getIsDisabled: (item) => !!item.isBlocked,
      getReasonFromItem: (item) => item.blockReason ?? '',
      reasonPlaceholder: 'Motivo do bloqueio do motorista',
      reasonAriaLabel: 'Motivo do bloqueio do motorista',
      getActionLabel: (isBlocked) =>
        isBlocked ? 'Ativar Motorista' : 'Bloquear Motorista',
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