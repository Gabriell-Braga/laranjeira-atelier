import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // CSS dentro do HTML: tira dois arquivos que bloqueavam a primeira pintura no celular
  experimental: { inlineCss: true },
};

export default nextConfig;
