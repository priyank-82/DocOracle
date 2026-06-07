/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/documents",
        destination: "http://13.223.146.103/api/documents",
      },
      {
        source: "/api/documents/:path*",
        destination: "http://13.223.146.103/api/documents/:path*",
      },
      {
        source: "/api/chat",
        destination: "http://13.223.146.103/api/chat",
      },
      {
        source: "/api/chat/:path*",
        destination: "http://13.223.146.103/api/chat/:path*",
      },
    ]
  },
}

module.exports = nextConfig
