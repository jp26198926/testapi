import Image from "next/image";
import Link from "next/link";

type BrandProps = {
  appName: string;
  logoUrl?: string | null;
  href?: string | null;
  textClassName?: string;
  logoSize?: number;
};

export default function Brand({
  appName,
  logoUrl,
  href = "/",
  textClassName = "text-lg font-bold",
  logoSize = 28,
}: BrandProps) {
  const inner = (
    <span className="flex items-center gap-2">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`${appName} logo`}
          width={logoSize}
          height={logoSize}
          className="rounded object-contain"
          priority
        />
      ) : null}
      <span className={textClassName}>{appName}</span>
    </span>
  );

  if (href === null) return inner;
  return <Link href={href}>{inner}</Link>;
}
