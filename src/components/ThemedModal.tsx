/**
 * ThemedModal Component
 * 
 * A theme-aware modal component that uses DaisyUI semantic colors.
 * Properly respects dark/light theme and provides consistent styling
 * across all modal dialogs in the application.
 * 
 * Features:
 * - Theme-aware backgrounds and colors (no hardcoded white)
 * - Multiple variants for different use cases
 * - Proper focus management and keyboard accessibility
 * - Loading state support
 * - Responsive sizing
 * 
 * Usage:
 * ```tsx
 * import ThemedModal from '../components/ThemedModal';
 * 
 * function MyComponent() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   
 *   return (
 *     <ThemedModal
 *       isOpen={isOpen}
 *       onClose={() => setIsOpen(false)}
 *       onConfirm={() => handleConfirm()}
 *       title="Confirm Action"
 *       variant="destructive"
 *       confirmText="Delete"
 *     >
 *       Are you sure you want to delete this item?
 *     </ThemedModal>
 *   );
 * }
 * ```
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface ThemedModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Callback when confirm button is clicked */
  onConfirm?: () => void;
  /** Modal title */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Modal variant affecting button styling */
  variant?: 'default' | 'confirm' | 'warning' | 'destructive' | 'info';
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Whether an async action is in progress */
  isLoading?: boolean;
  /** Size of the modal */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether to show the footer with buttons */
  showFooter?: boolean;
  /** ID for aria-labelledby */
  titleId?: string;
  /** ID for aria-describedby */
  descId?: string;
  /** Additional CSS classes for the modal box */
  className?: string;
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

/**
 * Get the button class based on variant
 */
function getConfirmButtonClass(variant: ThemedModalProps['variant']): string {
  switch (variant) {
    case 'destructive':
      return 'btn-error';
    case 'warning':
      return 'btn-warning';
    case 'info':
      return 'btn-info';
    case 'confirm':
      return 'btn-success';
    case 'default':
    default:
      return 'btn-primary';
  }
}

/**
 * Get the modal header icon based on variant
 */
function getVariantIcon(variant: ThemedModalProps['variant']): string | null {
  switch (variant) {
    case 'destructive':
      return '⚠️';
    case 'warning':
      return '⚡';
    case 'info':
      return 'ℹ️';
    case 'confirm':
      return '✓';
    default:
      return null;
  }
}

/**
 * Get the modal size class
 */
function getSizeClass(size: ThemedModalProps['size']): string {
  switch (size) {
    case 'sm':
      return 'max-w-sm';
    case 'md':
      return 'max-w-md';
    case 'lg':
      return 'max-w-2xl';
    case 'xl':
      return 'max-w-4xl';
    case 'full':
      return 'max-w-full mx-4';
    default:
      return 'max-w-lg';
  }
}

const ThemedModal: React.FC<ThemedModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  variant = 'default',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  size = 'md',
  showFooter = true,
  titleId,
  descId,
  className = '',
}) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const generatedTitleId = titleId || `modal-title-${Math.random().toString(36).slice(2, 9)}`;
  const generatedDescId = descId || `modal-desc-${Math.random().toString(36).slice(2, 9)}`;

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    // Focus first focusable element or dialog itself
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS) ?? [];
    if (focusable.length) {
      focusable[0].focus();
    } else {
      dialogRef.current?.focus();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (!isLoading) {
          onClose();
        }
        return;
      }

      if (e.key === 'Tab') {
        const nodes = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS) ?? []
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
      // Restore focus
      if (previouslyFocused.current) {
        previouslyFocused.current.focus();
      }
    };
  }, [isOpen, onClose, isLoading]);

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current && !isLoading) {
        onClose();
      }
    },
    [onClose, isLoading]
  );

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (!isLoading && onConfirm) {
      onConfirm();
    }
  }, [isLoading, onConfirm]);

  if (!isOpen) return null;

  const variantIcon = getVariantIcon(variant);
  const confirmButtonClass = getConfirmButtonClass(variant);
  const sizeClass = getSizeClass(size);

  const modalContent = (
    <div
      ref={overlayRef}
      onMouseDown={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={generatedTitleId}
        aria-describedby={generatedDescId}
        tabIndex={-1}
        className={`
          bg-base-100 rounded-lg shadow-xl w-full ${sizeClass}
          flex flex-col max-h-[90vh]
          border border-base-300
          animate-in zoom-in-95 duration-200
          ${className}
        `}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-base-300">
          <h3
            id={generatedTitleId}
            className="font-bold text-lg text-base-content flex items-center gap-2"
          >
            {variantIcon && <span>{variantIcon}</span>}
            {title}
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          id={generatedDescId}
          className="flex-1 overflow-y-auto p-4 text-base-content"
        >
          {children}
        </div>

        {/* Footer */}
        {showFooter && (
          <div className="flex-shrink-0 flex justify-end gap-2 p-4 border-t border-base-300">
            <button
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </button>
            {onConfirm && (
              <button
                className={`btn ${confirmButtonClass}`}
                onClick={handleConfirm}
                disabled={isLoading}
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
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Use portal to render at the document body level
  return createPortal(modalContent, document.body);
};

export default ThemedModal;
