import { useEffect, useState } from 'react';
import { FiStar, FiUser } from 'react-icons/fi';
import * as reviewService from '../../services/reviewService';
import { useToast } from '../../contexts/ToastContext';

function StarPicker({ value, onChange, readonly = false }) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const displayedRating = hoveredRating || value;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const isActive = displayedRating >= starIndex;
        return (
          <button
            key={starIndex}
            type="button"
            disabled={readonly}
            onMouseEnter={() => !readonly && setHoveredRating(starIndex)}
            onMouseLeave={() => !readonly && setHoveredRating(0)}
            onClick={() => !readonly && onChange?.(starIndex)}
            className={`p-1 transition-transform ${readonly ? '' : 'hover:scale-110 cursor-pointer'}`}
            aria-label={`${starIndex} estrela${starIndex > 1 ? 's' : ''}`}
          >
            <FiStar
              className={`h-7 w-7 ${isActive ? 'fill-yellow-400 text-yellow-400' : 'text-text-main/30'}`}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function RideReviewSection({ rideId }) {
  const { showToast } = useToast();
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    try {
      const reviewContext = await reviewService.getRideReviewContext(rideId);
      setContext(reviewContext);
    } catch (fetchError) {
      setContext(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    refresh();
     
  }, [rideId]);

  const handleSubmit = async () => {
    if (rating < 1) {
      showToast('Selecione uma nota de 1 a 5 estrelas.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await reviewService.submitRideReview(rideId, { rating, comment: comment.trim() });
      showToast('Avaliação enviada. Obrigado!', 'success');
      setRating(0);
      setComment('');
      await refresh();
    } catch (submitError) {
      const errorMessage = submitError?.response?.data?.error || 'Erro ao enviar avaliação.';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border-muted bg-surface-input/20 p-4 text-sm text-text-main/70">
        Carregando avaliação...
      </div>
    );
  }

  if (!context) return null;

  return (
    <div className="space-y-4">
      {context.target && context.canReview && (
        <div className="rounded-2xl border border-border-muted bg-surface-input/30 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-11 w-11 rounded-full bg-brand/20 border border-brand flex items-center justify-center">
              <FiUser className="h-5 w-5 text-brand" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-text-main/55">
                Avaliar {context.target.role === 'DRIVER' ? 'motorista' : 'passageiro'}
              </p>
              <p className="text-sm font-semibold truncate">{context.target.name}</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 mb-3">
            <p className="text-xs text-text-main/70">Como foi a experiência?</p>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <textarea
            rows={3}
            value={comment}
            onChange={(textareaEvent) => setComment(textareaEvent.target.value)}
            placeholder="Comentário (opcional)"
            maxLength={500}
            className="w-full rounded-xl border border-border-muted bg-black/30 px-3 py-2 text-sm text-text-main outline-none focus:border-brand resize-none mb-3"
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || rating < 1}
            className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand/85 disabled:opacity-50"
          >
            {submitting ? 'Enviando...' : 'Enviar avaliação'}
          </button>
        </div>
      )}

      {context.mine && (
        <div className="rounded-2xl border border-border-muted bg-surface-input/20 p-4">
          <p className="text-[10px] uppercase tracking-wide text-text-main/55 mb-2">
            Sua avaliação
          </p>
          <StarPicker value={context.mine.rating} readonly />
          {context.mine.comment && (
            <p className="text-xs text-text-main/85 mt-2">"{context.mine.comment}"</p>
          )}
        </div>
      )}

      {context.other && (
        <div className="rounded-2xl border border-border-muted bg-surface-input/20 p-4">
          <p className="text-[10px] uppercase tracking-wide text-text-main/55 mb-2">
            Avaliação recebida
          </p>
          <StarPicker value={context.other.rating} readonly />
          {context.other.comment && (
            <p className="text-xs text-text-main/85 mt-2">"{context.other.comment}"</p>
          )}
        </div>
      )}

      {!context.canReview && !context.mine && context.reason && (
        <div className="rounded-2xl border border-border-muted bg-surface-input/20 p-4 text-xs text-text-main/70">
          {context.reason}
        </div>
      )}
    </div>
  );
}
