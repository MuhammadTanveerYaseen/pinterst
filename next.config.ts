import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["selenium-webdriver", "chromedriver", "playwright"],
};

export default nextConfig;
