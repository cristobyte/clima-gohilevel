import { getSessionContext } from "@/lib/tenant";

// Coarse auth guard for the whole authenticated area.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getSessionContext(); // redirects to /login if not authenticated
  return <>{children}</>;
}
