import type { NextConfig } from "next";
import path from "path"; // Add this line to import the path module

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/api/(.*)", // Applies to all API routes
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*", // Allow all origins; change to specific domain if needed (e.g., "http://localhost:3001")
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
  // Serve static files from the public/uploads directory
  async rewrites() {
    return [
      {
        source: "/uploads/:path*", // When a request comes to /uploads
        destination: "/public/uploads/:path*", // Serve the actual file from the public/uploads directory
      },
    ];
  },
  // Set up additional configuration if needed for static files
  webpack(config) {
    config.resolve.alias["public"] = path.resolve(__dirname, "./public");
    return config;
  },
};

export default nextConfig;
