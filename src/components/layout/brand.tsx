import Image from "next/image";
import Link from "next/link";

export function Brand() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5"
      aria-label="ATTOS HQ, ir al inicio"
    >
      <Image
        src="/attos-mark.png"
        alt=""
        width={36}
        height={36}
        priority
        className="size-9"
      />
      <span className="font-display text-xl font-bold tracking-[0.18em] text-bordo">
        ATTOS
      </span>
      <span className="rounded-md bg-bordo px-1.5 py-0.5 text-[0.65rem] font-bold tracking-widest text-beige">
        HQ
      </span>
    </Link>
  );
}
