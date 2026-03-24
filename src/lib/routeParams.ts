import { notFound } from 'next/navigation'

type AwaitableRouteParams = Promise<{
  [key: string]: string | string[] | undefined
}>

/**
 * Parse a positive integer route param and throw Next.js notFound() on invalid input.
 */
export async function parsePositiveIntParamOrNotFound(
  params: AwaitableRouteParams,
  paramKey = 'id'
): Promise<number> {
  const rawParam = (await params)[paramKey]
  const paramValue = Array.isArray(rawParam) ? rawParam[0] : rawParam
  const parsed = Number(paramValue)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    notFound()
  }

  return parsed
}
