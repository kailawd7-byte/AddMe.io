import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://addme-steel.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/register", "/login", "/shop", "/legal/terms", "/legal/privacy", "/legal/disclaimer"],
        disallow: ["/admin", "/dashboard", "/tasks", "/campaigns", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
