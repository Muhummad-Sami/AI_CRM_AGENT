'use client';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg border border-[#E4E7EC] shadow-lg max-w-sm w-full p-5">
        <h3 className="text-sm font-semibold text-[#111827] mb-1.5">{title}</h3>
        <p className="text-sm text-[#667085] mb-5">{description}</p>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-[#374151] border border-[#E4E7EC] rounded-md hover:bg-[#F9FAFB] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-sm text-white rounded-md font-medium transition-colors"
            style={{
              backgroundColor: variant === 'danger' ? '#DC2626' : '#2563EB',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
