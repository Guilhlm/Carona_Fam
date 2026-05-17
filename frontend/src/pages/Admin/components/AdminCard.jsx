import { memo, useEffect, useState } from 'react';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { getCardConfig } from './adminCardConfig';
import {
  ADMIN_CARD_MIN_HEIGHT,
  ADMIN_CARD_MIN_HEIGHT_EXPANDED,
} from './adminConstants';

const INPUT_CLASS =
  'w-full h-9 min-h-0 rounded-[10px] border border-border-muted bg-surface-input/20 px-3 py-2 text-xs md:text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/50 box-border';
const REASON_READONLY_CLASS =
  'w-full h-9 min-h-0 rounded-[10px] border border-border-muted bg-surface-input/10 px-3 py-2 flex items-center text-xs md:text-sm text-text-muted';

const FOOTER_ACTION_BUTTON_CLASS =
  'w-full text-xs md:text-sm px-3 py-2 rounded-[10px] font-medium box-border';

const STATUS_FOOTER_VARIANT_CLASS = {
  default: 'bg-surface-input/40 text-text-main border border-border-muted',
  success: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40',
  warning: 'bg-amber-500/20 text-amber-200 border border-amber-500/40',
  danger: 'bg-red-500/20 text-red-200 border border-red-500/40',
  info: 'bg-brand/20 text-brand border border-brand/50',
};

function AdminCard({
  variant,
  item,
  expanded = false,
  onToggleExpand,
  onToggleDisable,
  onToggleBlock,
  onCancelRide,
  onToggleAdmin,
  isCurrentUser = false,
}) {
  const config = getCardConfig(variant);
  const [reason, setReason] = useState(
    config?.getReasonFromItem ? config.getReasonFromItem(item) : ''
  );

  useEffect(() => {
    if (config?.getReasonFromItem) {
      setReason(config.getReasonFromItem(item));
    }
  }, [item?.id, item?.disabledReason, item?.blockReason, variant]);

  if (!config) return null;

  const {
    expandable,
    getItemId,
    getBadge,
    getTitle,
    getSubtitle,
    getExpandContent,
    actionType,
    hideActionsWhen,
  } = config;

  const itemId = getItemId(item);
  const badge = getBadge(item);
  const hideActions = hideActionsWhen?.(item, { isCurrentUser });

  const hasReasonActions =
    !hideActions &&
    (actionType === 'disable-with-reason' || actionType === 'block-with-reason');
  const hasUserActions = !hideActions && actionType === 'user-actions';
  const hasStatusFooter =
    !hideActions && actionType === 'status-footer' && config.getStatusFooter;
  const hasCancelAction =
    !hideActions &&
    actionType === 'cancel' &&
    !expanded &&
    config.showCancelWhen?.(item) &&
    onCancelRide;
  const hasCancelInExpand =
    !hideActions &&
    actionType === 'status-footer' &&
    expanded &&
    config.showCancelWhen?.(item) &&
    onCancelRide;
  const hasFooterActions =
    hasReasonActions || hasUserActions || hasCancelAction || hasStatusFooter;
  const reasonReadonlyLabel =
    actionType === 'block-with-reason' ? 'bloqueio' : 'desativação';

  const handleCardClick = (e) => {
    if (!expandable) return;
    if (e.target.closest('button') || e.target.closest('input')) return;
    onToggleExpand?.(itemId);
  };

  const heightClass =
    expandable && expanded ? ADMIN_CARD_MIN_HEIGHT_EXPANDED : ADMIN_CARD_MIN_HEIGHT;

  const containerClass =
    'h-full rounded-[10px] border border-white/10 bg-surface-input/30 backdrop-blur-2xl px-4 py-3 md:px-5 md:py-4 flex flex-col gap-2 ' +
    heightClass +
    ' ' +
    (expandable ? 'cursor-pointer transition-all hover:border-[1px] hover:border-brand ' : '');

  return (
    <div
      role={expandable ? 'button' : undefined}
      tabIndex={expandable ? 0 : undefined}
      onClick={expandable ? handleCardClick : undefined}
      onKeyDown={
        expandable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(e);
              }
            }
          : undefined
      }
      className={containerClass}
      aria-expanded={expandable ? expanded : undefined}
    >
      <div className="min-w-0 shrink-0">
        <div className="flex items-center justify-between gap-2 pb-[5px]">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              {getTitle(item)}
            </div>
            <div className="shrink-0">
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
          </div>
        {getSubtitle(item)}
      </div>

      {expandable && expanded && (
        <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
          {getExpandContent(item)}
        </div>
      )}

      {hasCancelInExpand && (
        <div
          className="shrink-0 w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="softDanger"
            onClick={() => onCancelRide(item.id)}
            className={FOOTER_ACTION_BUTTON_CLASS}
          >
            Cancelar corrida
          </Button>
        </div>
      )}

      {hasStatusFooter && (
        <div
          className="mt-auto w-full shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const statusFooter = config.getStatusFooter(item);
            const variantClass =
              STATUS_FOOTER_VARIANT_CLASS[statusFooter.variant] ??
              STATUS_FOOTER_VARIANT_CLASS.default;
            return (
              <div
                className={`${FOOTER_ACTION_BUTTON_CLASS} flex items-center justify-center min-h-[36px] ${variantClass}`}
                role="status"
                aria-label={`Status: ${statusFooter.label}`}
              >
                {statusFooter.label}
              </div>
            );
          })()}
        </div>
      )}

      {hasReasonActions && (
        <div
          className="flex flex-col gap-2 mt-auto w-full shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {config.getIsDisabled(item) ? (
            <div className={REASON_READONLY_CLASS}>
              Motivo do {reasonReadonlyLabel}: {reason ? `'${reason}'` : '—'}
            </div>
          ) : (
            <input
              type="text"
              placeholder={config.reasonPlaceholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={INPUT_CLASS}
              aria-label={config.reasonAriaLabel}
            />
          )}
          <Button
            variant={config.getIsDisabled(item) ? 'softUnblock' : 'softDanger'}
            onClick={() => {
              const isDisabled = config.getIsDisabled(item);
              if (actionType === 'disable-with-reason' && onToggleDisable) {
                onToggleDisable(item.id, !isDisabled, reason);
              }
              if (actionType === 'block-with-reason' && onToggleBlock) {
                onToggleBlock(item.id, !isDisabled, reason);
              }
            }}
            className={FOOTER_ACTION_BUTTON_CLASS}
          >
            {config.getActionLabel(config.getIsDisabled(item))}
          </Button>
        </div>
      )}

      {!hideActions && actionType === 'cancel' && !expanded && config.showCancelWhen?.(item) && onCancelRide && (
        <div
          className="flex flex-col gap-2 mt-auto w-full shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="softDanger"
            onClick={() => onCancelRide(item.id)}
            className="w-full text-xs md:text-sm px-3 py-2 rounded-[10px]"
          >
            Cancelar corrida
          </Button>
        </div>
      )}

      {hasUserActions && (
        <div
          className="flex flex-col gap-2 mt-auto w-full shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant={config.getIsAdmin(item) ? 'softDanger' : 'softUnblock'}
            onClick={() => onToggleAdmin(item, !config.getIsAdmin(item))}
            disabled={!config.getIsAdmin(item) && config.getIsBlocked(item)}
            title={
              !config.getIsAdmin(item) && config.getIsBlocked(item)
                ? 'Desbloqueie o usuário antes de torná-lo admin'
                : undefined
            }
            className="w-full text-xs md:text-sm px-3 py-2"
          >
            {config.getIsAdmin(item) ? 'Remover admin' : 'Tornar admin'}
          </Button>
          <Button
            variant={config.getIsBlocked(item) ? 'softUnblock' : 'softDanger'}
            onClick={() =>
              onToggleBlock(item.id, !config.getIsBlocked(item))
            }
            className="w-full text-xs md:text-sm px-3 py-2"
          >
            {config.getIsBlocked(item) ? 'Ativar Usuário' : 'Bloquear Usuário'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default memo(AdminCard);