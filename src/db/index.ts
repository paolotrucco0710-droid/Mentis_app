/**
 * Database layer — schema, migrations, queries (Milestone 3).
 *
 * Domain types live in `@/domain`.
 */

export { prisma } from "./client";
export type { PrismaClient } from "./client";
export * from "./repositories";
export * from "./mappers";
