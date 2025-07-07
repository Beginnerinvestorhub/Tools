// apps/web/src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * A utility function to conditionally join Tailwind CSS classes.
 * It uses `clsx` to join classes and `tailwind-merge` to intelligently merge conflicting Tailwind classes.
 *
 * @param inputs - An array of class values (strings, objects, arrays, etc.)
 * @returns A single string of merged Tailwind CSS classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

