import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  // Authentication reads cookies and the database on every request, so the
  // cache-components prerender model would fight the auth boundary. Keep the
  // app on the standard (dynamic) rendering model instead.
  cacheComponents: false,
  partialPrefetching: false,
};

export default nextConfig;
