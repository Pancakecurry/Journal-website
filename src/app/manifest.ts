import type { MetadataRoute } from "next";
import { PRODUCT_BRAND } from "@/config/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/today",
    name: PRODUCT_BRAND.name,
    short_name: PRODUCT_BRAND.shortName,
    description: PRODUCT_BRAND.description,
    start_url: "/today",
    scope: "/",
    display: "standalone",
    background_color: PRODUCT_BRAND.backgroundColor,
    theme_color: PRODUCT_BRAND.themeColor,
    orientation: "any",
    categories: ["lifestyle"],
    icons: [
      { src: "/icons/atelier-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/atelier-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/atelier-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/icons/atelier.svg", sizes: "any", type: "image/svg+xml" },
    ],
    shortcuts: [
      { name: "Today", short_name: "Today", url: "/today" },
      { name: "Add to Today", short_name: "Add", url: "/today#quick-capture" },
      { name: "Journal", short_name: "Journal", url: "/journal" },
    ],
  };
}
