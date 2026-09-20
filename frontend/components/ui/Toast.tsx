'use client';

import type { ToastItem, ToastType } from '@/lib/hooks/useToast';

interface ToastProps {
  toasts: ToastItem[];
  onRemove?: (id: string) => void;
  onClose?: (id: string) => void;
}

const toastStyles: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: {
    bg: '#F0FDF4',
    border: '#BBF7D0',
    text: '#15803D',
    icon: '✓',
  },
  error: {
    bg: '#FFF1F2',
    border: '#FECDD3',
    text: '#B91C1C',
    icon: '✕',
  },
  info: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    text: '#1D4ED8',
    icon: 'i',
  },
};

function SingleToast({
  toast,
  onRemove,
}: {
  toast: ToastItem;
  onRemove: (id: string) => void;
}) {
  const style = toastStyles[toast.type];

  return (
    <div
      className="toast-enter flex items-start gap-2.5 px-3.5 py-3 rounded-lg shadow-sm max-w-xs w-full"
      style={{
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
      }}
      role="alert"
    >
      <span
        className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold mt-0.5"
        style={{ backgroundColor: style.text }}
      >
        {style.icon}
      </span>
      <p className="text-sm flex-1" style={{ color: style.text }}>
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-sm opacity-50 hover:opacity-100 transition-opacity leading-none mt-0.5"
        style={{ color: style.text }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, onRemove, onClose }: ToastProps) {
  const handleRemove = onRemove ?? onClose ?? (() => {});
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <SingleToast key={toast.id} toast={toast} onRemove={handleRemove} />
      ))}
    </div>
  );
}
