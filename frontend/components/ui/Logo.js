import Link from "next/link";

export default function Logo({ tone = "dark" }) {
  const color = tone === "light" ? "text-canvas" : "text-ink";
  const dot = tone === "light" ? "bg-brass" : "bg-pine";

  return (
    <Link href="/" className={`flex items-center gap-2.5 ${color}`}>
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${dot}`}
      >
        <span className="font-display text-base font-semibold text-canvas">
          M
        </span>
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">
        MartVerse
      </span>
    </Link>
  );
}
