"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

/**
 * Delete confirmation dialog (AGENTS.md section 23: konfirmasi sebelum hapus).
 *
 * `onDelete` must call the server action and return an error string, or
 * undefined on success. While the request is in flight the button shows a
 * loading state (section 31).
 */
export function ConfirmDeleteDialog({
  open,
  title,
  description,
  confirmLabel = "Hapus",
  loadingLabel = "Menghapus...",
  onDelete,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loadingLabel?: string;
  onDelete: () => Promise<string | undefined>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const message = await onDelete();
    setLoading(false);
    if (message) {
      setError(message);
      return;
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={() => (loading ? undefined : onClose())} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-xl bg-surface p-6 shadow-xl">
        <h2
          id="confirm-delete-title"
          className="text-lg font-semibold tracking-tight"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted">{description}</p>
        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? loadingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
