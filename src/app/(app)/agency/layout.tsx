import Link from "next/link";
import { Zap } from "lucide-react";
import { getSessionContext } from "@/lib/tenant";
import { UserMenu } from "@/components/layout/user-menu";

export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionContext();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-zinc-950 px-6 text-white">
        <Link href="/agency" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500">
            <Zap className="size-4" />
          </span>
          Clima <span className="text-zinc-400 font-normal">Agency</span>
        </Link>
        <UserMenu name={session.name} email={session.email} />
      </header>
      <main className="bg-muted/30 flex-1">{children}</main>
    </div>
  );
}
