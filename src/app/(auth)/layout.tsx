import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-zinc-950 p-12 text-white lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-500">
            <Zap className="size-5" />
          </span>
          Clima
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold leading-tight">
            One platform to run your whole agency.
          </h1>
          <p className="text-zinc-400">
            CRM, conversations, calendars and automation across every client
            sub-account — all in one place.
          </p>
        </div>
        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} Clima. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
