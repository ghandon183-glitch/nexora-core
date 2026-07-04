export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto mt-24 max-w-7xl px-8">
      <div className="grid grid-cols-12 gap-6">
        {children}
      </div>
    </section>
  );
}