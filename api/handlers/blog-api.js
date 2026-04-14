const { getDB, response, errorResponse, optionsResponse, verifyToken, getAuthToken } = require('../lib/db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  const sql = getDB();
  const action = event.queryStringParameters?.action || 'list';
  const slug = event.queryStringParameters?.slug;
  const category = event.queryStringParameters?.category;
  const lang = event.queryStringParameters?.lang || 'en';
  const limit = parseInt(event.queryStringParameters?.limit || '20');
  const offset = parseInt(event.queryStringParameters?.offset || '0');

  try {
    // PUBLIC: list published posts
    if (action === 'list' || !action) {
      let posts;
      if (category) {
        posts = await sql`SELECT id, slug, title_en, title_id, excerpt_en, excerpt_id, category, tags, author, published_at, cover_image_url FROM blog_posts WHERE status = 'published' AND (scheduled_at IS NULL OR scheduled_at <= NOW()) AND category = ${category} ORDER BY published_at DESC LIMIT ${limit} OFFSET ${offset}`;
      } else {
        posts = await sql`SELECT id, slug, title_en, title_id, excerpt_en, excerpt_id, category, tags, author, published_at, cover_image_url FROM blog_posts WHERE status = 'published' AND (scheduled_at IS NULL OR scheduled_at <= NOW()) ORDER BY published_at DESC LIMIT ${limit} OFFSET ${offset}`;
      }
      const total = await sql`SELECT COUNT(*) as count FROM blog_posts WHERE status = 'published' AND (scheduled_at IS NULL OR scheduled_at <= NOW())`;
      return response({ posts, total: total[0].count });
    }

    // PUBLIC: get single post by slug
    if (action === 'post' && slug) {
      const post = await sql`SELECT * FROM blog_posts WHERE slug = ${slug} AND status = 'published' AND (scheduled_at IS NULL OR scheduled_at <= NOW()) LIMIT 1`;
      if (!post.length) return errorResponse('Post not found', 404);

      // Related posts
      const related = await sql`SELECT id, slug, title_en, title_id, excerpt_en, excerpt_id, category, published_at FROM blog_posts WHERE slug != ${slug} AND status = 'published' AND category = ${post[0].category} ORDER BY published_at DESC LIMIT 3`;

      return response({ ...post[0], related });
    }

    // ADMIN: list all posts including drafts
    if (action === 'admin-list') {
      const token = getAuthToken(event);
      const decoded = verifyToken(token);
      if (!decoded) return errorResponse('Unauthorized', 401);

      const posts = await sql`SELECT id, slug, title_en, title_id, category, status, scheduled_at, published_at, created_at, author FROM blog_posts ORDER BY created_at DESC`;
      return response(posts);
    }

    // ADMIN: get single post for editing
    if (action === 'admin-get') {
      const token = getAuthToken(event);
      const decoded = verifyToken(token);
      if (!decoded) return errorResponse('Unauthorized', 401);
      const post = await sql`SELECT * FROM blog_posts WHERE id = ${event.queryStringParameters?.id} LIMIT 1`;
      if (!post.length) return errorResponse('Post not found', 404);
      return response(post[0]);
    }

    // ADMIN: create post
    if (action === 'create' && event.httpMethod === 'POST') {
      const token = getAuthToken(event);
      const decoded = verifyToken(token);
      if (!decoded) return errorResponse('Unauthorized', 401);

      const body = JSON.parse(event.body || '{}');
      const { slug, title_en, title_id, excerpt_en, excerpt_id, content_en, content_id, category, tags, author, status, meta_title_en, meta_title_id, meta_description_en, meta_description_id, cover_image_url, scheduled_at } = body;

      const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || '');
      const pub = status === 'published' ? new Date().toISOString() : null;

      await sql`INSERT INTO blog_posts (slug, title_en, title_id, excerpt_en, excerpt_id, content_en, content_id, category, tags, author, status, meta_title_en, meta_title_id, meta_description_en, meta_description_id, cover_image_url, published_at, scheduled_at) VALUES (${slug}, ${title_en}, ${title_id}, ${excerpt_en||''}, ${excerpt_id||''}, ${content_en||''}, ${content_id||''}, ${category||'general'}, ${tagsStr}, ${author||'Ambara Artha Team'}, ${status||'draft'}, ${meta_title_en||''}, ${meta_title_id||''}, ${meta_description_en||''}, ${meta_description_id||''}, ${cover_image_url||null}, ${pub}, ${scheduled_at||null})`;

      await sql`INSERT INTO activity_log (staff_id, staff_name, action, entity_type, entity_id) VALUES (${decoded.id}, ${decoded.name}, ${`Created blog post: ${slug}`}, ${'blog_post'}, ${slug})`;
      return response({ success: true });
    }

    // ADMIN: update post
    if (action === 'update' && event.httpMethod === 'POST') {
      const token = getAuthToken(event);
      const decoded = verifyToken(token);
      if (!decoded) return errorResponse('Unauthorized', 401);

      const body = JSON.parse(event.body || '{}');
      const { id, slug, title_en, title_id, excerpt_en, excerpt_id, content_en, content_id, category, tags, author, status, meta_title_en, meta_title_id, meta_description_en, meta_description_id, cover_image_url, scheduled_at } = body;

      const existing = await sql`SELECT published_at FROM blog_posts WHERE id = ${id}`;
      const pub = status === 'published' ? (existing[0]?.published_at || new Date().toISOString()) : null;
      const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || '');

      await sql`UPDATE blog_posts SET slug=${slug}, title_en=${title_en}, title_id=${title_id}, excerpt_en=${excerpt_en||''}, excerpt_id=${excerpt_id||''}, content_en=${content_en||''}, content_id=${content_id||''}, category=${category||'general'}, tags=${tagsStr}, author=${author||'Ambara Artha Team'}, status=${status||'draft'}, meta_title_en=${meta_title_en||''}, meta_title_id=${meta_title_id||''}, meta_description_en=${meta_description_en||''}, meta_description_id=${meta_description_id||''}, cover_image_url=${cover_image_url||null}, published_at=${pub}, scheduled_at=${scheduled_at||null}, updated_at=NOW() WHERE id=${id}`;

      await sql`INSERT INTO activity_log (staff_id, staff_name, action, entity_type, entity_id) VALUES (${decoded.id}, ${decoded.name}, ${`Updated blog post: ${slug}`}, ${'blog_post'}, ${slug})`;
      return response({ success: true });
    }

    // ADMIN: delete post
    if (action === 'delete' && event.httpMethod === 'POST') {
      const token = getAuthToken(event);
      const decoded = verifyToken(token);
      if (!decoded) return errorResponse('Unauthorized', 401);
      const body = JSON.parse(event.body || '{}');
      await sql`DELETE FROM blog_posts WHERE id = ${body.id}`;
      return response({ success: true });
    }

    // AUTO-PUBLISH: publish scheduled posts (called by cron)
    if (action === 'auto-publish') {
      const secret = event.queryStringParameters?.secret;
      if (secret !== process.env.CRON_SECRET) return errorResponse('Unauthorized', 401);

      const toPublish = await sql`UPDATE blog_posts SET status = 'published', published_at = NOW() WHERE status = 'draft' AND scheduled_at IS NOT NULL AND scheduled_at <= NOW() RETURNING id, title_en, slug`;
      return response({ published: toPublish.length, posts: toPublish });
    }

    return errorResponse('Not found', 404);
  } catch (err) { return errorResponse(err.message, 500); }
};


