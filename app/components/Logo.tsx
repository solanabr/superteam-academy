import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center no-underline hover:opacity-90"
      aria-label="Superteam Brasil — Início"
    >
      <Image
        src="/HORIZONTAL-LOGO/ST-DARK-GREEN-HORIZONTAL.png"
        alt="Superteam Brasil"
        width={180}
        height={40}
        className="h-8 w-auto dark:hidden"
        priority
      />
      <Image
        src="/HORIZONTAL-LOGO/ST-OFF-WHITE-HORIZONTAL.png"
        alt="Superteam Brasil"
        width={180}
        height={40}
        className="h-8 w-auto hidden dark:block"
        priority
      />
    </Link>
  );
}
