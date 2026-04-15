/**
 * Simple class-name join utility.
 * Filters out falsy values and joins with space.
 */
export function cn(...inputs: (string | false | null | undefined)[]): string {
  return inputs.filter(Boolean).join(' ')
}
