import { getYear } from "date-fns";
import Link from "next/link";

export function Footer() {
  return (
    <div className="fixed bottom-0 z-10 w-full bg-background/95 border-t backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-4 md:mx-8 flex h-14 items-center">
        <p className="text-xs md:text-sm leading-loose text-muted-foreground text-left">
          © Copyright {getYear(Date.now())}. Tout droit reservé  {" "}
          <Link
            href="http://www.touba-oil.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4"
          >
            Touba Oil SAU
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
