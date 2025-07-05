export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
