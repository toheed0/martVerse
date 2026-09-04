import Button from "@/components/ui/Button";
import { ArrowIcon } from "@/components/ui/icons";

const steps = [
  {
    step: "01",
    title: "Create your account",
    text: "Register as a vendor in under two minutes.",
  },
  {
    step: "02",
    title: "Get approved",
    text: "Our team reviews every application before you go live.",
  },
  {
    step: "03",
    title: "Start selling",
    text: "List your work and reach buyers across the country.",
  },
];

export default function VendorCta() {
  return (
    <section className="bg-pine text-canvas">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
        <div>
          <p className="eyebrow text-brass">Sell on MartVerse</p>
          <h2 className="mt-4 max-w-md font-display text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            Your craft deserves a better shelf.
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-canvas/70">
            Join a marketplace that reviews every vendor, so buyers arrive
            already trusting what they find. No listing fees for your first
            three months.
          </p>
          <div className="mt-9">
            <Button href="/register" variant="light" size="lg">
              Apply as a vendor
              <ArrowIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ol className="space-y-8">
          {steps.map((item) => (
            <li
              key={item.step}
              className="flex gap-6 border-b border-canvas/15 pb-8 last:border-0 last:pb-0"
            >
              <span className="font-display text-sm text-brass">
                {item.step}
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-canvas/70">
                  {item.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
