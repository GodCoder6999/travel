/** @type {import('next').NextConfig} */
function normalizeApi(raw) {
  let v = (raw || "").trim();
  if (!v) return "http://127.0.0.1:8000";
  v = v.replace(/\/+$/, ""); // strip trailing slashes
  if (!/^https?:\/\//i.test(v)) v = "https://" + v;
  return v;
}

const API = normalizeApi(process.env.NEXT_PUBLIC_API_URL);

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API}/api/:path*` },
    ];
  },
};
export default nextConfig;
