import type { NextConfig } from 'next'
import path from "node:path";

const isMobileBuild = process.env.MOBILE_BUILD === 'true'

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  ...(isMobileBuild ? {
    output: 'export',
    trailingSlash: true,
    images: { unoptimized: true },
  } : {}),
}

export default nextConfig
