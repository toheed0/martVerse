import ProductArt from "./ProductArt";
import HeroActions from "./HeroActions";
import { StarIcon } from "@/components/ui/icons";

const stats = [
  { value: "2,400+", label: "Verified vendors" },
  { value: "48k", label: "Happy buyers" },
  { value: "4.9", label: "Average rating" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      {/* Soft radial wash behind the headline */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-sand blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 py-20 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:py-28">
        <div className="lg:col-span-6">
          <p className="eyebrow flex items-center gap-3 text-brass">
            {/* <span className="h-px w-8 bg-brass" /> */}
            Curated marketplace
          </p>

          <h1 className="mt-6 font-display text-5xl leading-[1.05] font-semibold tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Objects worth
            <span className="block italic text-pine">keeping.</span>
          </h1>

          <p className="mt-7 max-w-md text-lg leading-relaxed text-muted">
            MartVerse brings together independent makers and vetted vendors in
            one place — so every piece you buy has a maker behind it, not a
            warehouse.
          </p>

          <HeroActions />

          <dl className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="font-display text-3xl font-semibold text-ink">
                  {stat.value}
                </dt>
                <dd className="mt-1 text-xs leading-snug text-muted">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Product composition */}
        <div className="relative lg:col-span-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex h-72 items-center justify-center rounded-2xl bg-tint-1 pb-16 text-pine sm:h-80">
              <ProductArt name="vase" className="h-44 w-44" />
            </div>
            <div className="mt-10 flex h-72 items-center justify-center rounded-2xl bg-tint-2 text-pine sm:h-80">
              <ProductArt name="lamp" className="h-44 w-44" />
            </div>
          </div>

          {/* Floating review card */}
          <div className="absolute -bottom-8 left-0 w-60 rounded-2xl border border-line bg-surface p-5 shadow-[0_18px_40px_-24px_rgba(26,23,20,0.4)]">
            <div className="flex gap-0.5 text-brass">
              {[0, 1, 2, 3, 4].map((i) => (
                <StarIcon key={i} />
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              &ldquo;Arrived beautifully packed. You can tell someone made
              it.&rdquo;
            </p>
            <p className="mt-3 text-xs text-muted">Ayesha K. — verified buyer</p>
          </div>
        </div>
      </div>
    </section>
  );
}
