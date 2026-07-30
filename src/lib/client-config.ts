export const clientConfig = {
  devSubjectId:
    process.env.NEXT_PUBLIC_DEV_SUBJECT_ID ??
    "00000000-0000-4000-8000-000000000002",
} as const;
