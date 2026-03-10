import { useToast } from '../contexts/ToastContext';

/**
 * Comportamento:
 * - Ao exibir uma notificação, inicia um timer de duração (ex: 3–5s).
 * - Se o usuário permanecer na página → some após o tempo definido.
 * - Se o usuário navegar para outra rota antes → some imediatamente (React Router).
 * - Timers são limpos corretamente (clearTimeout/clearInterval) para evitar memory leaks.
 *
 * @returns {{ show: (message, type?, durationMs?) => void, hide: () => void }}
 */
export function useNotification() {
  const { showToast, hideToast } = useToast();

  return {
    show: showToast,
    hide: hideToast,
  };
}