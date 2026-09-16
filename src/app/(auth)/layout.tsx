import Link from "next/link";
import { FlagMark } from "@/components/marketing/flag";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site flex min-h-screen flex-col bg-[var(--field)]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <FlagMark className="h-6 w-9" />
          <span className="display text-[22px] text-white">TENDERIZA</span>
        </Link>
        <div className="bg-white p-8 shadow-2xl">{children}</div>
      </div>
    </div>
  );
}
