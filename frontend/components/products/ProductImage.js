import ProductArt from "@/components/home/ProductArt";

const arts = ["vase", "chair", "bag", "watch", "lamp", "candle"];

// Stable per product, so a listing without photos still looks deliberate and a
// product keeps the same drawing on every render.
export const artFor = (id = "") => {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return arts[sum % arts.length];
};

// Vendors supply their own image URLs, which can point at any host. next/image
// would need every one of those hosts allowlisted in next.config, so product
// photos use a plain lazy <img>. Category art, which we upload to Cloudinary
// ourselves, still goes through next/image.
export default function ProductImage({ product, artClassName = "h-28 w-28" }) {
  const src = product.images?.[0];

  if (!src) {
    return <ProductArt name={artFor(product._id)} className={artClassName} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={product.name}
      loading="lazy"
      decoding="async"
      className="h-full w-full object-cover"
    />
  );
}
