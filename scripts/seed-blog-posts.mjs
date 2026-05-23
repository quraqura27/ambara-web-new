import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: ".env.local", quiet: true });

const root = process.cwd();
const blogSourcePath = path.join(root, "content", "blog-posts.json");
const databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or NETLIFY_DATABASE_URL is required to seed blog posts.");
}

const data = JSON.parse(await fs.readFile(blogSourcePath, "utf8"));
const posts = (data.posts || []).filter((post) => post.status === "published");
const sql = neon(databaseUrl);
const dryRun = process.env.BLOG_SEED_DRY_RUN === "1";

let upserted = 0;

for (const post of posts) {
  if (dryRun) {
    upserted += 1;
    continue;
  }

  await sql`
    INSERT INTO blog_posts (
      slug, title_en, title_id, excerpt_en, excerpt_id, content_en, content_id,
      category, tags, cover_image_url, author, status, meta_title_en, meta_title_id,
      meta_description_en, meta_description_id, published_at, created_at, updated_at,
      scheduled_at, language
    ) VALUES (
      ${post.slug}, ${post.title_en}, ${post.title_id || ""}, ${post.excerpt_en || ""},
      ${post.excerpt_id || ""}, ${post.content_en || ""}, ${post.content_id || ""},
      ${post.category || "general"}, ${post.tags || []}, ${post.cover_image_url || null},
      ${post.author || "Ambara Artha Team"}, ${post.status || "published"},
      ${post.meta_title_en || ""}, ${post.meta_title_id || ""},
      ${post.meta_description_en || ""}, ${post.meta_description_id || ""},
      ${post.published_at || null}, ${post.created_at || null}, NOW(),
      ${post.scheduled_at || null}, ${post.language || (post.content_id ? "both" : "en")}
    )
    ON CONFLICT (slug) DO UPDATE SET
      title_en = EXCLUDED.title_en,
      title_id = EXCLUDED.title_id,
      excerpt_en = EXCLUDED.excerpt_en,
      excerpt_id = EXCLUDED.excerpt_id,
      content_en = EXCLUDED.content_en,
      content_id = EXCLUDED.content_id,
      category = EXCLUDED.category,
      tags = EXCLUDED.tags,
      cover_image_url = EXCLUDED.cover_image_url,
      author = EXCLUDED.author,
      status = EXCLUDED.status,
      meta_title_en = EXCLUDED.meta_title_en,
      meta_title_id = EXCLUDED.meta_title_id,
      meta_description_en = EXCLUDED.meta_description_en,
      meta_description_id = EXCLUDED.meta_description_id,
      published_at = COALESCE(blog_posts.published_at, EXCLUDED.published_at),
      scheduled_at = EXCLUDED.scheduled_at,
      language = EXCLUDED.language,
      updated_at = NOW()
  `;
  upserted += 1;
}

console.log(JSON.stringify({
  source: path.relative(root, blogSourcePath),
  dryRun,
  upserted,
  englishPosts: posts.length,
  indonesianPosts: posts.filter((post) => post.content_id).length,
}, null, 2));
