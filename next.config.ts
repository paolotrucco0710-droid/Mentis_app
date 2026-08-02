import type { NextConfig } from "next";
import os from "node:os";

const LAN_DEV_ORIGIN_PATTERNS = [
  "10.*.*.*",
  "192.168.*.*",
  "172.*.*.*",
];

function getLanHosts(): string[] {
  if (process.env.NODE_ENV === "production") {
    return [];
  }

  const hosts = new Set<string>();

  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const iface of interfaces ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        hosts.add(iface.address);
      }
    }
  }

  for (const entry of process.env.ALLOWED_DEV_ORIGINS?.split(",") ?? []) {
    const trimmed = entry.trim();
    if (trimmed && !trimmed.includes("*")) {
      hosts.add(trimmed);
    }
  }

  return [...hosts];
}

function resolveAllowedDevOrigins(): string[] {
  const custom =
    process.env.ALLOWED_DEV_ORIGINS?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];

  if (process.env.NODE_ENV === "production") {
    return custom;
  }

  return [...new Set([...getLanHosts(), ...LAN_DEV_ORIGIN_PATTERNS, ...custom])];
}

const lanHosts = getLanHosts();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  serverExternalPackages: ["sharp"],
  allowedDevOrigins: resolveAllowedDevOrigins(),
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      ...lanHosts.map((hostname) => ({
        protocol: "http" as const,
        hostname,
      })),
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    proxyClientMaxBodySize: "50mb",
  },
};

export default nextConfig;
