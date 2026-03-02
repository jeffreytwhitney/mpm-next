import { PrismaClient } from '@/generated/prisma/client'
import { PrismaMssql } from '@prisma/adapter-mssql'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const adapter = new PrismaMssql(databaseUrl)

  return new PrismaClient({
    adapter,
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

