// Minimal line icons so the project stays free of an icon dependency.
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const Svg = ({ children, className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <g {...stroke}>{children}</g>
  </svg>
);

export const SearchIcon = (props) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);

export const BagIcon = (props) => (
  <Svg {...props}>
    <path d="M4 8h16l-1.2 12H5.2L4 8Z" />
    <path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2" />
  </Svg>
);

export const UserIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c1.2-3.6 3.7-5.5 7-5.5s5.8 1.9 7 5.5" />
  </Svg>
);

export const ArrowIcon = (props) => (
  <Svg {...props}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Svg>
);

export const TruckIcon = (props) => (
  <Svg {...props}>
    <path d="M3 7h11v9H3z" />
    <path d="M14 10h4l3 3v3h-7z" />
    <circle cx="7" cy="18" r="1.6" />
    <circle cx="17.5" cy="18" r="1.6" />
  </Svg>
);

export const ShieldIcon = (props) => (
  <Svg {...props}>
    <path d="M12 3.5 19 6v5.5c0 4.2-2.8 7.6-7 9-4.2-1.4-7-4.8-7-9V6l7-2.5Z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

export const ReturnIcon = (props) => (
  <Svg {...props}>
    <path d="M4 12a8 8 0 1 1 2.6 5.9" />
    <path d="M4 5v5h5" />
  </Svg>
);

export const SparkIcon = (props) => (
  <Svg {...props}>
    <path d="M12 3.5 13.9 9 19.5 11l-5.6 2L12 18.5 10.1 13 4.5 11 10.1 9 12 3.5Z" />
  </Svg>
);

export const StarIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="m12 3.6 2.5 5.4 5.6.7-4.2 3.9 1.1 5.8L12 16.6l-5 2.8 1.1-5.8L4 9.7l5.6-.7L12 3.6Z"
    />
  </svg>
);

export const EyeIcon = (props) => (
  <Svg {...props}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const EyeOffIcon = (props) => (
  <Svg {...props}>
    <path d="M10.2 5.7A9.9 9.9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.6 17.6 0 0 1-3.4 4.3" />
    <path d="M6.4 7.5A17.4 17.4 0 0 0 2.5 12S6 18.5 12 18.5a9.7 9.7 0 0 0 3.9-.8" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <path d="m4 4 16 16" />
  </Svg>
);

export const MenuIcon = (props) => (
  <Svg {...props}>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </Svg>
);

export const CloseIcon = (props) => (
  <Svg {...props}>
    <path d="m6 6 12 12" />
    <path d="m18 6-12 12" />
  </Svg>
);
