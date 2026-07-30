import type { SubjectId } from "../ids";

export interface Subject {
  id: SubjectId;
  userId: import("../ids").UserId;
  name: string;
  color: string;
  icon: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
