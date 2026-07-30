import type { CourseId, SubjectId, UserId } from "@/domain/ids";
import type { Course } from "@/domain/entities";
import { prisma } from "../client";
import { toCourse } from "../mappers";

export interface CreateCourseInput {
  userId: UserId;
  subjectId: SubjectId;
  title: string;
  description?: string | null;
}

export async function findCourseById(id: CourseId): Promise<Course | null> {
  const record = await prisma.course.findFirst({
    where: { id, deletedAt: null },
  });
  return record ? toCourse(record) : null;
}

export async function findCoursesByUserId(userId: UserId): Promise<Course[]> {
  const records = await prisma.course.findMany({
    where: { userId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });
  return records.map(toCourse);
}

export async function createCourse(input: CreateCourseInput): Promise<Course> {
  const record = await prisma.course.create({ data: input });
  return toCourse(record);
}
