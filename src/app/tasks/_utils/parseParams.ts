import { notFound } from 'next/navigation'

/**
 * Parse a task ID from Next.js route params and validate it.
 * Throws notFound() if the ID is invalid or non-positive.
 */
export async function parseTaskIdOrNotFound(
  params: Promise<{ id: string }>
): Promise<number> {
  const { id } = await params
  const taskId = Number(id)

  if (!Number.isInteger(taskId) || taskId <= 0) {
    notFound()
  }

  return taskId
}

