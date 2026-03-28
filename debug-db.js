const { getDB } = require('./netlify/functions/_db');

async function checkSlugs() {
  const sql = getDB();
  try {
    const posts = await sql`SELECT id, slug, title_en, status FROM blog_posts`;
    console.log('--- DATABASE POSTS ---');
    posts.forEach(p => {
      console.log(`ID: ${p.id} | Slug: "${p.slug}" | Status: ${p.status} | Title: ${p.title_en}`);
    });
    console.log('-----------------------');
  } catch (err) {
    console.error('DB Error:', err.message);
  } finally {
    process.exit();
  }
}

checkSlugs();
