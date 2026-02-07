/**
 * Converts a string to kebab-case for safe filesystem usage.
 *
 * This function transforms any string into a lowercase, hyphen-separated format
 * suitable for use as a filename. It handles:
 * - Converting spaces and underscores to hyphens
 * - Removing or replacing special characters
 * - Normalizing multiple consecutive hyphens
 * - Trimming leading/trailing hyphens
 *
 * @param title - The input string to convert
 * @returns A lowercase, hyphen-separated string safe for filenames
 *
 * @example
 * ```typescript
 * toKebabCase('User Authentication')      // 'user-authentication'
 * toKebabCase('API v2.0 Setup')           // 'api-v2-0-setup'
 * toKebabCase('  Spaced  Out  ')          // 'spaced-out'
 * toKebabCase('Hello_World-2024')         // 'hello-world-2024'
 * toKebabCase('Special!@#$Chars')         // 'special-chars'
 * toKebabCase('Café & Restaurant')        // 'cafe-restaurant'
 * ```
 */
export function toKebabCase(title: string): string {
  return (
    title
      // Normalize unicode (handles accents like é -> e)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Convert to lowercase
      .toLowerCase()
      // Replace spaces and underscores with hyphens
      .replace(/[\s_]+/g, "-")
      // Replace special characters with hyphens (keep alphanumeric and hyphens)
      .replace(/[^a-z0-9-]/g, "-")
      // Collapse multiple consecutive hyphens
      .replace(/-+/g, "-")
      // Remove leading and trailing hyphens
      .replace(/^-+|-+$/g, "")
  );
}
