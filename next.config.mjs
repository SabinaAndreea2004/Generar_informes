/** @type {import('next').NextConfig} */
const nextConfig = {
  // react-pdf needs to be handled on the client side
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
