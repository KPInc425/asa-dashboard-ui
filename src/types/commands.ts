/**
 * Typed Command Model
 *
 * Defines the command risk level, input field schema, and the TypedCommand
 * interface used throughout the dashboard for safe, auditable control actions
 * against backend services.
 *
 * @see /home/steam/automation/docs/plans/phase7-auth-commands-design.md
 */

// ---------------------------------------------------------------------------
// Command Risk Level
// ---------------------------------------------------------------------------

/**
 * Risk classification for a typed command.
 *
 * - `low`: Safe, no confirmation required (e.g. start service, backup data)
 * - `medium`: Minor impact, confirmation recommended (e.g. restart service)
 * - `high`: Significant impact, confirmation required (e.g. stop service, edit config)
 * - `critical`: Severe impact, confirmation + reason required (e.g. restore backup)
 */
export type CommandRiskLevel = 'low' | 'medium' | 'high' | 'critical';

// ---------------------------------------------------------------------------
// Command Category
// ---------------------------------------------------------------------------

/**
 * Functional category that a typed command belongs to.
 */
export type CommandCategory =
  | 'lifecycle'
  | 'backup'
  | 'config'
  | 'mods'
  | 'provisioning'
  | 'diagnostic';

// ---------------------------------------------------------------------------
// Input Field
// ---------------------------------------------------------------------------

/**
 * Describes a single input field for a typed command that requires
 * additional parameters (e.g. provisioning or config commands).
 */
export interface InputField {
  /** Field identifier, used as the key in command params */
  name: string;
  /** Human-readable label for the field */
  label: string;
  /** The input control type to render */
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea';
  /** Whether this field must be filled before the command can execute */
  required?: boolean;
  /** Options for `select` type fields */
  options?: { value: string; label: string }[];
  /** Default value when none is provided */
  defaultValue?: unknown;
}

// ---------------------------------------------------------------------------
// Typed Command
// ---------------------------------------------------------------------------

/**
 * A fully typed command descriptor that drives the action execution pipeline.
 *
 * Each command carries metadata about its risk level, UI behaviour, input
 * schema, and post-action effects (cache invalidation, redirects). The
 * command registry in `src/config/commands.ts` provides the canonical set
 * of known commands.
 */
export interface TypedCommand {
  /** Machine-readable command identifier (e.g. "restart-service", "backup-data") */
  commandId: string;
  /** Human-readable display name for UI buttons and labels */
  label: string;
  /** Short description of what this command does */
  description: string;
  /** Risk classification — drives confirmation UI behaviour */
  riskLevel: CommandRiskLevel;
  /** Functional category grouping */
  category: CommandCategory;

  // -----------------------------------------------------------------------
  // UI behaviour
  // -----------------------------------------------------------------------

  /** Message shown in the confirmation dialog for risky actions */
  confirmMessage?: string;
  /** For `critical` actions, require the user to provide a reason note */
  requiresReason?: boolean;
  /** Estimated duration in seconds, used for progress indication */
  estimatedDuration?: number;
  /** Whether the backend reports progress for this command */
  supportsProgress: boolean;

  // -----------------------------------------------------------------------
  // Input schema
  // -----------------------------------------------------------------------

  /** Optional input fields for commands that require additional parameters */
  inputFields?: InputField[];

  // -----------------------------------------------------------------------
  // Post-action behaviour
  // -----------------------------------------------------------------------

  /** React Query keys to invalidate after a successful execution */
  invalidatesQueries?: string[];
  /** URL to redirect to after completion (e.g. provisioning wizard) */
  redirectAfter?: string;
}
