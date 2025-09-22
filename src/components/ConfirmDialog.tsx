"use client";

import Modal from "@/components/Modal";

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  open,
  title = "Excluir livro",
  description = "Essa ação não pode ser desfeita.",
  confirmText = "Excluir",
  cancelText = "Cancelar",
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="max-w-sm space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-slate-700">{description}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-[var(--teal-200)]"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-lg bg-red-600 text-white px-3 py-1.5 text-sm hover:opacity-90"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
