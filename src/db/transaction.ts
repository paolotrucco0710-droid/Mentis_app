import type { Prisma } from "@prisma/client";
import { prisma } from "./client";

export type DbTx = Prisma.TransactionClient;

export function getDb(tx?: DbTx) {
  return tx ?? prisma;
}
