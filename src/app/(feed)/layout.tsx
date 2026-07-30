import { FeedLayout } from "@/components/layout";

export default function FeedGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FeedLayout>{children}</FeedLayout>;
}
