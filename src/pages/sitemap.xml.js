import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export async function GET({ site }) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: posts } = await supabase
        .from("blog_posts")
        .select("id, updated_at")
        .order("updated_at", { ascending: false });

    const pages = [
        { url: "", lastmod: new Date().toISOString() },
        { url: "blog", lastmod: new Date().toISOString() },
        { url: "galeria", lastmod: new Date().toISOString() },
        { url: "contacto", lastmod: new Date().toISOString() },
    ];

    const siteUrl = site.href.replace(/\/$/, "");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages
            .map(
                (page) => `
    <url>
      <loc>${siteUrl}/${page.url}</loc>
      <lastmod>${page.lastmod}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>${page.url === "" ? "1.0" : "0.8"}</priority>
    </url>`
            )
            .join("")}
  ${posts
            ? posts
                .map(
                    (post) => `
    <url>
      <loc>${siteUrl}/blog/${post.id}</loc>
      <lastmod>${post.updated_at || new Date().toISOString()}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.7</priority>
    </url>`
                )
                .join("")
            : ""
        }
</urlset>`;

    return new Response(sitemap, {
        headers: {
            "Content-Type": "application/xml",
        },
    });
}
