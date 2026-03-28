const fs = require('fs');
const path = require('path');

const files = [
  'public/en/blog-post.html',
  'public/id/blog-post.html'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  const target = `const slug = new URLSearchParams(window.location.search).get('slug');\nif (!slug) window.location.href = '/en/blog';`;
  const targetCRLF = `const slug = new URLSearchParams(window.location.search).get('slug');\r\nif (!slug) window.location.href = '/en/blog';`;
  const targetID = `const slug = new URLSearchParams(window.location.search).get('slug');\nif (!slug) window.location.href = '/id/blog';`;
  const targetIDCRLF = `const slug = new URLSearchParams(window.location.search).get('slug');\r\nif (!slug) window.location.href = '/id/blog';`;

  const replacement = (lang) => `let slug = new URLSearchParams(window.location.search).get('slug');
if (!slug) {
  const parts = window.location.pathname.replace(/\\/$/, '').split('/');
  slug = parts[parts.length - 1];
}
if (!slug || slug === 'blog' || slug === 'blog-post.html') window.location.href = '/${lang}/blog';`;

  if (content.includes(target)) {
    content = content.replace(target, replacement('en'));
  } else if (content.includes(targetCRLF)) {
    content = content.replace(targetCRLF, replacement('en'));
  } else if (content.includes(targetID)) {
    content = content.replace(targetID, replacement('id'));
  } else if (content.includes(targetIDCRLF)) {
    content = content.replace(targetIDCRLF, replacement('id'));
  } else {
    console.log(`Target not found in ${file}. Searching partial match...`);
    // Fallback: search for just the slug extraction line
    const partial = `const slug = new URLSearchParams(window.location.search).get('slug');`;
    if (content.includes(partial)) {
       const lang = file.includes('/id/') ? 'id' : 'en';
       // Find the next line (the if statement)
       const sub = content.substring(content.indexOf(partial));
       const nextLine = sub.split('\n')[1] || sub.split('\r\n')[1];
       if (nextLine && nextLine.includes('window.location.href')) {
          const fullMatch = partial + (content.includes('\r\n') ? '\r\n' : '\n') + nextLine;
          content = content.replace(fullMatch, replacement(lang));
       }
    }
  }

  fs.writeFileSync(fullPath, content);
  console.log(`Processed ${file}`);
});
