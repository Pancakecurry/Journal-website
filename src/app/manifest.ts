import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Campus Atelier Journal",
    short_name: "Atelier Journal",
    description: "A private, Day-centered journaling environment.",
    start_url: "/today",
    display: "standalone",
    background_color: "#fbf7eb",
    theme_color: "#fbf7eb",
  };
}
