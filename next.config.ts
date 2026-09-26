import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/driver packages stay on the server side and out of the bundle.
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql", "pg"],
  experimental: {
    serverActions: {
      // Profile photos and unit wall photos are capped at 5 MB in app code.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
