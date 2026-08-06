export function FeedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-20 flex flex-col overflow-hidden bg-background">
      {children}
    </div>
  );
}
