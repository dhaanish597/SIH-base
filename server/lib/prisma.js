// Prisma client singleton for the Express backend.
// Importing this from any service avoids creating multiple connection pools.

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__sihPrisma__ ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__sihPrisma__ = prisma;
}

module.exports = prisma;
module.exports.prisma = prisma;
