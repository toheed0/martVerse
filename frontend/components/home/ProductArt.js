// Hand-drawn style line art keeps the catalogue looking designed without
// pulling in real product photography.
const shapes = {
  vase: (
    <>
      <path d="M80 48h40v12c0 16 16 28 16 50 0 24-16 42-36 42s-36-18-36-42c0-22 16-34 16-50V48Z" />
      <path d="M76 116h48" />
    </>
  ),
  lamp: (
    <>
      <path d="M56 158h40" />
      <path d="M76 158V98" />
      <path d="M76 98c0-32 26-50 54-50" />
      <path d="M112 48h36l-9 28h-18l-9-28Z" />
    </>
  ),
  chair: (
    <>
      <path d="M64 106c0-30 9-46 36-46s36 16 36 46" />
      <path d="M58 106h84l-7 26H65l-7-26Z" />
      <path d="m70 132-8 30" />
      <path d="m130 132 8 30" />
    </>
  ),
  bag: (
    <>
      <path d="M62 74h76l9 88H53l9-88Z" />
      <path d="M84 74V60a16 16 0 0 1 32 0v14" />
      <path d="M62 100h76" />
    </>
  ),
  watch: (
    <>
      <circle cx="100" cy="100" r="32" />
      <path d="M100 84v17l12 8" />
      <path d="m84 70 3-22h26l3 22" />
      <path d="m84 130 3 22h26l3-22" />
    </>
  ),
  candle: (
    <>
      <path d="M82 86h36v70H82z" />
      <path d="M100 86c-7-15 4-19 4-32 0 13 11 17 4 32" />
      <path d="M82 108h36" />
    </>
  ),
};

export default function ProductArt({ name, className = "h-40 w-40" }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {shapes[name]}
      </g>
    </svg>
  );
}
