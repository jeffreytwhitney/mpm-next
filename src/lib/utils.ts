/**
 * Utility functions for the application
 */

/**
 * Get Tailwind CSS alignment class based on alignment value
 * @param align - The alignment direction ('left', 'center', or 'right')
 * @returns The corresponding Tailwind CSS class name
 */
export function getAlignmentClass(align?: 'left' | 'center' | 'right'): string {
  switch (align) {
    case 'center':
      return 'text-center'
    case 'right':
      return 'text-right'
    case 'left':
    default:
      return 'text-left'
  }
}

