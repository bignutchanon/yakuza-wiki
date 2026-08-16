/** @type {import('next').NextConfig} */
// output: 'export' — build เป็น static HTML ล้วนสำหรับ GitHub Pages (custom domain, ไม่มี basePath)
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
}

export default nextConfig
