import { cn } from "@/lib/utils";

interface BrandAvatarProps {
  brand: string;
  brandLogo?: string | null;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}

const isImageLogo = (value?: string | null) =>
  Boolean(value && /^(https?:\/\/|data:image\/|blob:)/i.test(value));

const BrandAvatar = ({
  brand,
  brandLogo,
  className,
  imageClassName,
  fallbackClassName,
}: BrandAvatarProps) => {
  const fallback = (brand?.trim().charAt(0) || "B").toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 text-gray-900",
        className
      )}
      aria-hidden="true"
    >
      {isImageLogo(brandLogo) ? (
        <img
          src={brandLogo ?? undefined}
          alt={`${brand} avatar`}
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      ) : (
        <span className={cn("font-bold", fallbackClassName)}>{brandLogo || fallback}</span>
      )}
    </div>
  );
};

export default BrandAvatar;
