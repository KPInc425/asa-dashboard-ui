/**
 * ActionButton Component
 *
 * A risk-aware action execution button that:
 * - Renders differently based on the command's riskLevel:
 *   - `low`: Simple button, no confirmation
 *   - `medium`: Button + confirmation dialog (warning variant)
 *   - `high`: Button + confirmation dialog (stronger warning)
 *   - `critical`: Button + confirmation dialog + reason input required
 * - Shows loading state during execution via the adapter
 * - Displays error/success feedback after execution
 * - Optionally renders input fields for commands that need parameters
 *
 * Usage:
 * ```tsx
 * <ActionButton
 *   serviceId="ark-asa-main"
 *   command={typedCommands['restart-service']}
 *   adapter={adapter}
 *   size="sm"
 *   variant="danger"
 * />
 * ```
 *
 * @see /home/steam/automation/docs/plans/phase7-auth-commands-design.md
 */

import React, { useCallback, useState } from "react";
import type {
    BackendAdapter,
    TypedAction,
    ActionResult,
} from "../adapters/types";
import type { TypedCommand } from "../types/commands";
import ConfirmationModal from "./ConfirmationModal";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ActionButtonProps {
    /** The service to execute the command against */
    serviceId: string;
    /** The typed command descriptor */
    command: TypedCommand;
    /** The backend adapter that will execute the action */
    adapter: BackendAdapter;
    /** Button size (daisyUI btn-* sizes) */
    size?: "sm" | "md" | "lg";
    /** Button variant override (defaults to risk-level-appropriate variant) */
    variant?: "primary" | "secondary" | "danger";
    /** Additional CSS classes */
    className?: string;
    /** Whether the button is disabled */
    disabled?: boolean;
    /** Callback on successful execution */
    onSuccess?: (result: ActionResult) => void;
    /** Callback on execution error */
    onError?: (error: unknown) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a command's risk level to a daisyUI button variant.
 */
function getDefaultVariant(riskLevel: TypedCommand["riskLevel"]): string {
    switch (riskLevel) {
        case "critical":
            return "btn-error";
        case "high":
            return "btn-warning";
        case "medium":
            return "btn-warning";
        case "low":
        default:
            return "btn-primary";
    }
}

/**
 * Convert the ActionButton variant prop to a daisyUI class.
 */
function variantToClass(variant: ActionButtonProps["variant"]): string {
    switch (variant) {
        case "danger":
            return "btn-error";
        case "secondary":
            return "btn-secondary";
        case "primary":
        default:
            return "btn-primary";
    }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ActionButton: React.FC<ActionButtonProps> = ({
    serviceId,
    command,
    adapter,
    size = "md",
    variant,
    className = "",
    disabled = false,
    onSuccess,
    onError,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [result, setResult] = useState<ActionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [inputValues, setInputValues] = useState<Record<string, unknown>>({});

    // Determine if confirmation is needed
    const needsConfirmation = command.riskLevel !== "low";

    // Determine button variant class
    const buttonVariantClass = variant
        ? variantToClass(variant)
        : getDefaultVariant(command.riskLevel);

    // Reset state when modal opens/closes
    const openModal = useCallback(() => {
        setIsModalOpen(true);
        setResult(null);
        setError(null);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setResult(null);
        setError(null);
    }, []);

    // Clear feedback state after a timeout
    const clearFeedback = useCallback(() => {
        setTimeout(() => {
            setResult(null);
            setError(null);
        }, 5000);
    }, []);

    /**
     * Execute the command against the adapter.
     */
    const execute = useCallback(async () => {
        setIsExecuting(true);
        setResult(null);
        setError(null);

        try {
            // Build the TypedAction from the command descriptor
            const action: TypedAction = {
                actionId: command.commandId,
                label: command.label,
                riskLevel: command.riskLevel,
                confirmMessage: command.confirmMessage,
                estimatedDuration: command.estimatedDuration,
                supportsProgress: command.supportsProgress,
            };

            // Gather input values for commands that have input fields
            if (command.inputFields && command.inputFields.length > 0) {
                action.inputSchema = Object.fromEntries(
                    command.inputFields.map((field) => [
                        field.name,
                        inputValues[field.name] ?? field.defaultValue,
                    ]),
                ) as Record<string, unknown>;
            }

            const actionResult = await adapter.executeAction(serviceId, action);
            setResult(actionResult);

            if (actionResult.success) {
                onSuccess?.(actionResult);
            } else {
                setError(
                    actionResult.error ?? "Action returned an unknown error",
                );
                onError?.(new Error(actionResult.error ?? "Unknown error"));
            }

            // Close modal on success for non-critical actions
            if (actionResult.success && command.riskLevel !== "critical") {
                setIsModalOpen(false);
            }

            clearFeedback();
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "An unexpected error occurred";
            setError(message);
            onError?.(err);
            clearFeedback();
        } finally {
            setIsExecuting(false);
        }
    }, [
        serviceId,
        command,
        adapter,
        inputValues,
        onSuccess,
        onError,
        clearFeedback,
    ]);

    /**
     * Handle confirmation from the modal.
     */
    const handleConfirm = useCallback(() => {
        execute();
    }, [execute]);

    /**
     * Handle input field changes for commands with inputFields.
     */
    const handleInputChange = useCallback(
        (fieldName: string, value: unknown) => {
            setInputValues((prev) => ({ ...prev, [fieldName]: value }));
        },
        [],
    );

    // --- Render ---

    const sizeClass = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";

    return (
        <>
            {/* Action button */}
            <button
                className={`btn ${buttonVariantClass} ${sizeClass} ${className}`}
                onClick={needsConfirmation ? openModal : execute}
                disabled={disabled || isExecuting}
                aria-label={command.label}
            >
                {isExecuting ? (
                    <>
                        <span className="loading loading-spinner loading-xs"></span>
                        <span>Executing...</span>
                    </>
                ) : (
                    command.label
                )}
            </button>

            {/* Confirmation modal for medium+ risk levels */}
            {needsConfirmation && (
                <ConfirmationModal
                    isOpen={isModalOpen}
                    onConfirm={handleConfirm}
                    onCancel={closeModal}
                    title={command.label}
                    message={
                        command.confirmMessage ?? `Execute "${command.label}"?`
                    }
                    riskLevel={command.riskLevel}
                    requireReason={command.requiresReason}
                    isLoading={isExecuting}
                    confirmText={
                        command.riskLevel === "critical"
                            ? "I Understand, Proceed"
                            : "Confirm"
                    }
                />
            )}

            {/* Input fields for commands that require parameters */}
            {command.inputFields && command.inputFields.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                    {command.inputFields.map((field) => (
                        <div key={field.name} className="form-control">
                            <label
                                className="label"
                                htmlFor={`action-input-${field.name}`}
                            >
                                <span className="label-text">
                                    {field.label}
                                    {field.required && (
                                        <span className="text-error ml-1">
                                            *
                                        </span>
                                    )}
                                </span>
                            </label>
                            {field.type === "textarea" ? (
                                <textarea
                                    id={`action-input-${field.name}`}
                                    className="textarea textarea-bordered"
                                    placeholder={field.label}
                                    value={
                                        (inputValues[field.name] as string) ??
                                        ""
                                    }
                                    onChange={(e) =>
                                        handleInputChange(
                                            field.name,
                                            e.target.value,
                                        )
                                    }
                                    disabled={isExecuting}
                                />
                            ) : field.type === "select" ? (
                                <select
                                    id={`action-input-${field.name}`}
                                    className="select select-bordered"
                                    value={
                                        (inputValues[field.name] as string) ??
                                        ""
                                    }
                                    onChange={(e) =>
                                        handleInputChange(
                                            field.name,
                                            e.target.value,
                                        )
                                    }
                                    disabled={isExecuting}
                                >
                                    <option value="">
                                        Select {field.label}...
                                    </option>
                                    {field.options?.map((opt) => (
                                        <option
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            ) : field.type === "boolean" ? (
                                <input
                                    id={`action-input-${field.name}`}
                                    type="checkbox"
                                    className="toggle toggle-primary"
                                    checked={
                                        (inputValues[field.name] as boolean) ??
                                        false
                                    }
                                    onChange={(e) =>
                                        handleInputChange(
                                            field.name,
                                            e.target.checked,
                                        )
                                    }
                                    disabled={isExecuting}
                                />
                            ) : (
                                <input
                                    id={`action-input-${field.name}`}
                                    type={
                                        field.type === "number"
                                            ? "number"
                                            : "text"
                                    }
                                    className="input input-bordered"
                                    placeholder={field.label}
                                    value={
                                        (inputValues[field.name] as string) ??
                                        ""
                                    }
                                    onChange={(e) =>
                                        handleInputChange(
                                            field.name,
                                            field.type === "number"
                                                ? Number(e.target.value)
                                                : e.target.value,
                                        )
                                    }
                                    disabled={isExecuting}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Success feedback */}
            {result?.success && (
                <div
                    className="alert alert-success mt-2 shadow-sm"
                    role="status"
                >
                    <span>✓ {result.message}</span>
                </div>
            )}

            {/* Error feedback */}
            {error && (
                <div className="alert alert-error mt-2 shadow-sm" role="alert">
                    <span>✗ {error}</span>
                </div>
            )}
        </>
    );
};

export default ActionButton;
