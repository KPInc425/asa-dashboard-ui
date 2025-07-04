// Utility functions for ASA Dashboard
// Provides mapping and string helpers for container/server names

/**
 * Maps a Docker container name to an ASA server name.
 * - Strips the 'asa-server-' prefix if present.
 * - Converts the first character to uppercase (proper case).
 * - Returns the original name if it does not match the expected pattern.
 *
 * @param containerName The Docker container name (e.g., 'asa-server-theisland')
 * @returns The server name (e.g., 'TheIsland')
 */
export function containerNameToServerName(containerName: string): string {
  if (typeof containerName !== 'string' || !containerName) {
    throw new Error('Invalid container name');
  }
  let name = containerName;
  const prefix = 'asa-server-';
  if (name.startsWith(prefix)) {
    name = name.slice(prefix.length);
  }
  // Convert to proper case: first letter uppercase, rest as-is
  if (name.length > 0) {
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }
  return name;
} 