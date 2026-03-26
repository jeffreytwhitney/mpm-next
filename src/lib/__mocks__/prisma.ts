/**
 * AUTO-GENERATED MODULE DOC
 * Shared utility module used across server and client code.
 */
const handler: ProxyHandler<object> = {
  get(_target, prop) {
    if (prop === 'then') return undefined // prevent Promise-like behavior
    return new Proxy(jest.fn(), handler)
  },
  apply(_target, _thisArg, args) {
    return new Proxy(jest.fn(), handler)
  },
}

export const prisma = new Proxy({} as never, handler)

