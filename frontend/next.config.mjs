/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  images: {
    // Category art is uploaded to Cloudinary, so next/image has to be told
    // that host is allowed before it will optimise anything from it.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
