/**
 * Typed Command Registry
 *
 * Canonical set of known typed commands that the dashboard can execute
 * against backend services. Each entry maps a command ID to its full
 * TypedCommand descriptor, including risk level, UI behaviour, input
 * schema, and post-action cache invalidation rules.
 *
 * Usage:
 * ```typescript
 * import { typedCommands } from '../config/commands';
 *
 * const restartCmd = typedCommands['restart-service'];
 * ```
 *
 * @see /home/steam/automation/docs/plans/phase7-auth-commands-design.md
 */

import type { TypedCommand } from '../types/commands';

/**
 * Typed command registry keyed by command ID.
 *
 * Every command the dashboard can execute must have an entry here.
 * Pages look up commands by ID and render ActionButton or equivalent
 * components using the command's metadata.
 */
export const typedCommands: Record<string, TypedCommand> = {
  // -----------------------------------------------------------------------
  // Lifecycle commands
  // -----------------------------------------------------------------------

  'restart-service': {
    commandId: 'restart-service',
    label: 'Restart Service',
    description: 'Restart the service gracefully',
    riskLevel: 'medium',
    category: 'lifecycle',
    confirmMessage:
      'Are you sure you want to restart this service? Players may experience disruption.',
    estimatedDuration: 30,
    supportsProgress: false,
    invalidatesQueries: ['serviceStatus'],
  },

  'stop-service': {
    commandId: 'stop-service',
    label: 'Stop Service',
    description: 'Stop the service immediately',
    riskLevel: 'high',
    category: 'lifecycle',
    confirmMessage:
      'This will stop the service. All players will be disconnected. Continue?',
    estimatedDuration: 15,
    supportsProgress: false,
    invalidatesQueries: ['serviceStatus'],
  },

  'start-service': {
    commandId: 'start-service',
    label: 'Start Service',
    description: 'Start the service',
    riskLevel: 'low',
    category: 'lifecycle',
    supportsProgress: true,
    estimatedDuration: 120,
    invalidatesQueries: ['serviceStatus'],
  },

  // -----------------------------------------------------------------------
  // Backup commands
  // -----------------------------------------------------------------------

  'backup-data': {
    commandId: 'backup-data',
    label: 'Backup Data',
    description: 'Create a backup of the service data',
    riskLevel: 'low',
    category: 'backup',
    supportsProgress: true,
    estimatedDuration: 300,
    invalidatesQueries: ['backups'],
  },

  'restore-backup': {
    commandId: 'restore-backup',
    label: 'Restore Backup',
    description: 'Restore service from a backup',
    riskLevel: 'critical',
    category: 'backup',
    confirmMessage:
      'This will overwrite current data with the selected backup. This CANNOT be undone. Continue?',
    requiresReason: true,
    supportsProgress: true,
    estimatedDuration: 600,
    invalidatesQueries: ['serviceStatus', 'serviceData'],
  },

  // -----------------------------------------------------------------------
  // Mods commands
  // -----------------------------------------------------------------------

  'update-mods': {
    commandId: 'update-mods',
    label: 'Update Mods',
    description: 'Update installed mods from Steam Workshop',
    riskLevel: 'medium',
    category: 'mods',
    supportsProgress: true,
    estimatedDuration: 180,
    invalidatesQueries: ['mods'],
  },

  // -----------------------------------------------------------------------
  // Config commands
  // -----------------------------------------------------------------------

  'edit-config': {
    commandId: 'edit-config',
    label: 'Edit Config',
    description: 'Edit the service configuration file',
    riskLevel: 'high',
    category: 'config',
    confirmMessage:
      'Incorrect configuration changes may break the service. Proceed carefully.',
    supportsProgress: false,
    invalidatesQueries: ['serviceConfig'],
  },

  // -----------------------------------------------------------------------
  // Provisioning commands
  // -----------------------------------------------------------------------

  'provision-server': {
    commandId: 'provision-server',
    label: 'Provision Server',
    description: 'Create a new server instance',
    riskLevel: 'high',
    category: 'provisioning',
    inputFields: [
      {
        name: 'name',
        label: 'Server Name',
        type: 'text',
        required: true,
      },
      {
        name: 'map',
        label: 'Map',
        type: 'select',
        required: true,
        options: [
          { value: 'the-island', label: 'The Island' },
          { value: 'scorched-earth', label: 'Scorched Earth' },
          { value: 'aberration', label: 'Aberration' },
        ],
      },
      {
        name: 'slots',
        label: 'Player Slots',
        type: 'number',
        required: true,
        defaultValue: 70,
      },
    ],
    supportsProgress: true,
    estimatedDuration: 600,
    redirectAfter: '/servers/{name}',
    invalidatesQueries: ['services'],
  },
};
