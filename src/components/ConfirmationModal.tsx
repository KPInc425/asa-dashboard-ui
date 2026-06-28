/**
 * ConfirmationModal Component
 *
 * A reusable daisyUI modal for confirming risky actions. Adapts its
 * styling and behaviour based on the command's risk level:
 *
 * - `medium` — standard warning variant
 * - `high` — stronger warning (warning/destructive variant)
 * - `critical` — destructive variant with an optional reason textarea
 *
 * Usage:
 * ```tsx
 * <ConfirmationModal
 *   isOpen={isOpen}
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 *   title="Restart Service"
 *   message="Are you sure?"
 *   riskLevel="high"
 * />
 * ```
 *
 * @see /home/steam/automation/docs/plans/phase7-auth-commands-design.md
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CommandRiskLevel } from '../types/commands';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ConfirmationModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when the user confirms the action */
  onConfirm: () => void;
  /** Called when the user cancels or closes the modal */
  onCancel: () => void;
  /** Modal title (typically the command label) */
  title: string;
  /** Descriptive message explaining what will happen */
  message: string;
  /** Risk level that drives visual styling and required reason */
  riskLevel: CommandRiskLevel;
  /** For `critical` risk levels, whether a reason is required */
  requireReason?: boolean;
  /** Callback with the current reason text value */
  onReasonChange?: (reason: string) => void;
  /** Whether an async operation is in progress */
  isLoading?: boolean;
  /** Confirm button text (defaults to "Confirm") */
  confirmText?: string;
  /** Cancel button text (defaults to "Cancel") */
  cancelText?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine the daisyUI button class based on risk level.
 */
function getConfirmButtonClass(riskLevel: CommandRiskLevel): string {
  switch (riskLevel) {
    case 'critical':
      return 'btn-error';
    case 'high':
      return 'btn-warning';
    case 'medium':
      return 'btn-warning';
    case 'low':
    default:
      return 'btn-primary';
  }
}

/**
 * Determine the modal variant icon based on risk level.
 */
function getRiskIcon(riskLevel: CommandRiskLevel): string {
  switch (riskLevel) {
    case 'critical':
      return '🔴';
    case 'high':
      return '⚠️';
    case 'medium':
      return '⚡';
    case 'low':
      return 'ℹ️';
  }
}

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type=hidden])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  riskLevel,
  requireReason = false,
  onReasonChange,
  isLoading = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [reason, setReason] = useState('');

  const generatedTitleId = useMemo(
    () => `confirm-modal-title-${Math.random().toString(36).slice(2, 9)}`,
    [],
  );
  const generatedDescId = useMemo(
    () => `confirm-modal-desc-${Math.random().toString(36).slice(2, 9)}`,
    [],
  );

  const isConfirmDisabled = useMemo(
    () => isLoading || (requireReason && reason.trim().length === 0),
    [isLoading, requireReason, reason],
  );

  // Reset reason when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setReason('');
    }
  }, [isOpen]);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const focusable =
      dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS) ?? [];
    if (focusable.length) {
      focusable[0].focus();
    } else {
      dialogRef.current?.focus();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (!isLoading) {
          onCancel();
        }
        return;
      }

      if (e.key === 'Tab') {
        const nodes = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS) ?? [],
        );
        if (nodes.length === 0) {
          e.preventDefault();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown, { capture: true });

    return () => {
      document.removeEventListener('keydown', onKeyDown, { capture: true });
      if (previouslyFocused.current) {
        previouslyFocused.current.focus();
      }
    };
  }, [isOpen, onCancel, isLoading]);

  // Handle overlay click to dismiss
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current && !isLoading) {
        onCancel();
      }
    },
    [onCancel, isLoading],
  );

  // Handle reason change
  const handleReasonChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setReason(value);
      onReasonChange?.(value);
    },
    [onReasonChange],
  );

  if (!isOpen) return null;

  const confirmButtonClass = getConfirmButtonClass(riskLevel);
  const riskIcon = getRiskIcon(riskLevel);

  const modalContent = (
    <div
      ref={overlayRef}
      onMouseDown={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={generatedTitleId}
        aria-describedby={generatedDescId}
        tabIndex={-1}
        className="bg-base-100 rounded-box shadow-xl w-full max-w-md flex flex-col max-h-[90vh] border border-base-300 animate-in zoom-in-95 duration-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-base-300">
          <h3
            id={generatedTitleId}
            className="font-bold text-lg text-base-content flex items-center gap-2"
          >
            <span>{riskIcon}</span>
            {title}
          </h3>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p id={generatedDescId} className="text-base-content/80">
            {message}
          </p>

          {/* Reason input for critical actions */}
          {requireReason && (
            <div className="form-control">
              <label className="label" htmlFor="confirmation-reason">
                <span className="label-text font-medium">
                  Reason for this action
                </span>
                <span className="label-text-alt text-error">Required</span>
              </label>
              <textarea
                id="confirmation-reason"
                className="textarea textarea-bordered w-full min-h-[80px]"
                placeholder="Explain why this action is necessary..."
                value={reason}
                onChange={handleReasonChange}
                disabled={isLoading}
                aria-required="true"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-end gap-2 p-4 border-t border-base-300">
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={`btn ${confirmButtonClass}`}
            onClick={onConfirm}
            disabled={isConfirmDisabled}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ConfirmationModal;
