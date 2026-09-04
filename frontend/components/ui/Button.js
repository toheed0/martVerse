import Link from "next/link";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary: "bg-pine text-canvas hover:bg-pine-soft",
  outline: "border border-ink/20 text-ink hover:border-ink hover:bg-ink/5",
  light: "bg-canvas text-pine hover:bg-white",
  brass: "bg-brass text-white hover:bg-brass/90",
};

const sizes = {
  sm: "h-10 px-5 text-sm",
  md: "h-12 px-7 text-sm",
  lg: "h-14 px-9 text-base",
};

export default function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
