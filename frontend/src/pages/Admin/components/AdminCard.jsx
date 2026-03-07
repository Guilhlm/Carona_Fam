import { memo, useEffect, useState } from 'react';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { getCardConfig } from './adminCardConfig';

const INPUT_CLASS =
  'w-full h-9 min-h-0 rounded-[10px] border border-border-muted bg-surface-input/20 px-3 py-2 text-xs md:text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/50 box-border';
const REASON_READONLY_CLASS =
  'w-full h-9 min-h-0 rounded-[10px] border border-border-muted bg-surface-input/10 px-3 py-2 flex items-center text-xs md:text-sm text-text-muted';

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

  const handleCardClick = (e) => {
    if (!expandable) return;
    if (e.target.closest('button') || e.target.closest('input')) return;
    onToggleExpand?.(itemId);
  };

  const containerClass =
    'rounded-[10px] border border-white/10 bg-surface-input/30 backdrop-blur-2xl px-4 py-3 md:px-5 md:py-4 flex flex-col gap-2 flex-shrink-0 ' +
    (expandable ? 'cursor-pointer transition-all ' : 'h-[180px] md:h-[220px] ') +
    (expandable ? 'hover:border-[1px] hover:border-brand ' : '') +
    (expandable && expanded ? 'h-[372px] md:h-[420px] ' : expandable ? 'h-[180px] md:h-[220px] ' : '') +
    (expandable && expanded ? ' overflow-hidden' : '');

  const leftClass =
    `flex-1 min-w-0 flex flex-col gap-2 ${expandable && expanded ? 'min-h-0' : ''}`;

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
      <div className={leftClass}>
        <div className={`min-w-0 ${expandable ? 'shrink-0' : ''}`}>
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

        {expandable && expanded && getExpandContent(item)}
      </div>

      {!hideActions && (actionType === 'disable-with-reason' || actionType === 'block-with-reason') && (
        <div
          className="flex flex-col gap-2 mt-4 md:mt-0 w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {config.getIsDisabled(item) ? (
            <div className={REASON_READONLY_CLASS}>
              Motivo do block: {reason ? `'${reason}'` : '—'}
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
            className="w-full text-xs md:text-sm px-3 py-2 rounded-[10px]"
          >
            {config.getActionLabel(config.getIsDisabled(item))}
          </Button>
        </div>
      )}

      {!hideActions && actionType === 'cancel' && !expanded && config.showCancelWhen?.(item) && onCancelRide && (
        <div
          className="flex flex-col gap-2 mt-4 md:mt-0 w-full"
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

      {!hideActions && actionType === 'user-actions' && (
        <div
          className="flex flex-col gap-2 mt-4 md:mt-0 w-full"
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