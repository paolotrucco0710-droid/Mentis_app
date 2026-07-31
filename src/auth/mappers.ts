import type { User } from "@/domain/entities";
import type { PublicUser } from "./types";

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    language: user.language,
    timezone: user.timezone,
    registeredAt: user.registeredAt,
    lastAccessAt: user.lastAccessAt,
  };
}
