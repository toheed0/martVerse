import Link from "next/link";
import Image from "next/image";
import { ArrowIcon } from "@/components/ui/icons";

const tints = ["bg-tint-1", "bg-tint-2", "bg-tint-3", "bg-tint-4"];

// Categories without an uploaded image get no colour of their own, so the tint
// cycles by position — the same category always lands on the same shade in a
// given list.
export const tintFor = (index) => tints[index % tints.length];

export default function CategoryCard({ category, index }) {
  const image = category.image?.url;

  return (
    <Link
      href={`/categories/${category._id}`}
      className={`group relative flex h-44 flex-col justify-end overflow-hidden rounded-2xl border border-line/60 p-6 transition-transform duration-300 hover:-translate-y-1 ${
        image ? "bg-ink" : tintFor(index)
      }`}
    >
      {image ? (
        <>
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Keeps the name readable no matter how bright the photo is. */}
          <div className="absolute inset-0 bg-linear-to-t from-ink/85 via-ink/40 to-ink/5" />
        </>
      ) : null}

      <div className="relative">
        <h3
          className={`font-display text-2xl font-semibold ${
            image ? "text-canvas" : "text-ink"
          }`}
        >
          {category.name}
        </h3>
        <p
          className={`mt-1 flex items-center gap-2 text-sm ${
            image ? "text-canvas/75" : "text-muted"
          }`}
        >
          <span className="line-clamp-1">
            {category.description || category.slug}
          </span>
          <ArrowIcon className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
        </p>
      </div>
    </Link>
  );
}
