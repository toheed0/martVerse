import {
  ReturnIcon,
  ShieldIcon,
  SparkIcon,
  TruckIcon,
} from "@/components/ui/icons";

const items = [
  {
    icon: TruckIcon,
    title: "Free delivery",
    text: "On every order above Rs 5,000, nationwide.",
  },
  {
    icon: ShieldIcon,
    title: "Vetted vendors",
    text: "Each seller is reviewed before they can list.",
  },
  {
    icon: ReturnIcon,
    title: "30-day returns",
    text: "Changed your mind? Send it back, no questions.",
  },
  {
    icon: SparkIcon,
    title: "Made to last",
    text: "Curated for materials and craft, not trends.",
  },
];

export default function ValueProps() {
  return (
    <section className="border-b border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {items.map((item) => (
          <div key={item.title} className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sand text-pine">
              <item.icon />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
