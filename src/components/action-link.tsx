import Link from "next/link";

type ActionLinkProps = {
  children: React.ReactNode;
  href: string;
};

export function ActionLink({ children, href }: ActionLinkProps) {
  return (
    <Link
      className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--accent-strong)]"
      href={href}
    >
      {children}
    </Link>
  );
}
