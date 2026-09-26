import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/location`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/premium`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/premium/forfaits`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/premium/conseil`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/proprietaires`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];
}
