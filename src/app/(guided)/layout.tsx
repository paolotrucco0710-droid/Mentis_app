export default function GuidedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full items-center justify-center bg-background px-4 py-10">
      {children}
    </div>
  );
}
