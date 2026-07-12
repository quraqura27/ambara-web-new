const { getDB, response, errorResponse, optionsResponse } = require('../lib/db');
const { isCronRequestAuthorized } = require('../lib/cron-auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  const action = String(event.queryStringParameters?.action || 'list').trim().toLowerCase();
  const slug = String(event.queryStringParameters?.slug || '').trim();
  const category = String(event.queryStringParameters?.category || '').trim();
  const lang = event.queryStringParameters?.lang === 'id' ? 'id' : 'en';
  const limit = Math.min(50, Math.max(1, Number.parseInt(event.queryStringParameters?.limit || '20', 10) || 20));
  const offset = Math.max(0, Number.parseInt(event.queryStringParameters?.offset || '0', 10) || 0);

  if (action === 'auto-publish') {
    if (event.httpMethod !== 'POST' || !isCronRequestAuthorized(event)) {
      return errorResponse('Unauthorized', 401);
    }
  } else if (event.httpMethod !== 'GET' || !['list', 'post'].includes(action)) {
    return errorResponse('Legacy blog management is retired.', 410);
  }

  const sql = getDB();
  try {
    if (action === 'list') {
      const languageCondition = lang === 'id' ? sql`AND COALESCE(content_id, '') <> ''` : sql``;
      const categoryCondition = category ? sql`AND category = ${category}` : sql``;
      const posts = await sql`
        SELECT id, slug, title_en, title_id, excerpt_en, excerpt_id, category, tags,
               author, published_at, cover_image_url
        FROM blog_posts
        WHERE status = 'published'
          AND (scheduled_at IS NULL OR scheduled_at <= NOW())
          ${languageCondition}
          ${categoryCondition}
        ORDER BY published_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      const totals = await sql`
        SELECT COUNT(*)::int as count
        FROM blog_posts
        WHERE status = 'published'
          AND (scheduled_at IS NULL OR scheduled_at <= NOW())
          ${languageCondition}
          ${categoryCondition}
      `;
      return response({ posts, total: totals[0]?.count || 0 });
    }
    if (action === 'post' && slug) {
      const posts = await sql`SELECT id, slug, title_en, title_id, excerpt_en, excerpt_id, content_en, content_id, category, tags, author, published_at, cover_image_url, meta_title_en, meta_title_id, meta_description_en, meta_description_id FROM blog_posts WHERE slug = ${slug} AND status = 'published' AND (scheduled_at IS NULL OR scheduled_at <= NOW()) LIMIT 1`;
      if (!posts.length) return errorResponse('Post not found', 404);
      const related = await sql`SELECT id, slug, title_en, title_id, excerpt_en, excerpt_id, category, published_at FROM blog_posts WHERE slug <> ${slug} AND status = 'published' AND category = ${posts[0].category} ORDER BY published_at DESC LIMIT 3`;
      return response({ ...posts[0], related });
    }
    if (action === 'auto-publish') {
      const published = await sql`UPDATE blog_posts SET status = 'published', published_at = NOW() WHERE status = 'draft' AND scheduled_at IS NOT NULL AND scheduled_at <= NOW() RETURNING id, title_en, slug`;
      return response({ posts: published, published: published.length });
    }
    return errorResponse('Not found', 404);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Blog request failed', 500);
  }
};
