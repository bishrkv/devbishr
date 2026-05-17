const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const SITE_DATA_FILE = path.join(DATA_DIR, 'site-data.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const PORT = Number(process.env.PORT || 3000);

const DEFAULT_SITE_DATA = {
  about: "I'm Bishr KV, a passionate full stack web developer from India. I build modern, responsive web applications.\n\nWith expertise in frontend and backend technologies, I bring ideas to life from concept to deployment.",
  skills: [
    { name: 'HTML5', level: 95, category: 'Frontend' },
    { name: 'CSS3', level: 90, category: 'Frontend' },
    { name: 'JavaScript', level: 92, category: 'Frontend' },
    { name: 'React', level: 85, category: 'Frontend' },
    { name: 'Tailwind CSS', level: 90, category: 'Frontend' },
    { name: 'Node.js', level: 80, category: 'Backend' },
    { name: 'Express.js', level: 78, category: 'Backend' },
    { name: 'MongoDB', level: 75, category: 'Backend' },
    { name: 'Firebase', level: 82, category: 'Backend' },
    { name: 'Git & GitHub', level: 88, category: 'Tools' },
    { name: 'VS Code', level: 95, category: 'Tools' },
    { name: 'Figma', level: 75, category: 'Tools' }
  ],
  services: [
    { title: 'Web Development', description: 'Fast, responsive websites.', icon: 'code-2' },
    { title: 'UI/UX Design', description: 'Intuitive interfaces.', icon: 'palette' },
    { title: 'Backend', description: 'APIs and databases.', icon: 'server' },
    { title: 'Responsive', description: 'Pixel-perfect everywhere.', icon: 'smartphone' },
    { title: 'Performance', description: 'Speed and SEO.', icon: 'zap' },
    { title: 'Maintenance', description: 'Ongoing support.', icon: 'shield-check' }
  ],
  timeline: [
    { title: 'Freelance Developer', company: 'Self Employed', period: '2024 - Present', type: 'work', description: 'Building websites for clients worldwide.' },
    { title: 'Web Dev Intern', company: 'Tech Startup', period: '2023 - 2024', type: 'work', description: 'Web apps and REST APIs.' },
    { title: 'Higher Secondary', company: 'Govt College', period: '2021 - 2023', type: 'education', description: 'Computer Science.' }
  ],
  projects: [
    { id: 'p1', title: 'Wami Clubwears', description: 'Awonderful website for a clothing brand.', tech: 'React, Tailwind, Node.js', image: 'https://i.postimg.cc/tTh517F9/3.png', url: 'https://wamiclubwears.vercel.app/', featured: true, date: '2025-01-15' },
    { id: 'p4', title: 'Watchlab', description: 'Dark portfolio with animations and admin panel.', tech: 'HTML, CSS, JS', image: 'https://i.postimg.cc/52Y8Y6V8/3.png', url: 'https://watchlabstore.vercel.app/', featured: false, date: '2025-04-05' },
    { id: 'p5', title: 'Zochafoodie', description: 'Kanban task manager with drag-and-drop.', tech: 'React, MongoDB', image: 'https://i.postimg.cc/tTh517Fq/2.png', url: 'https://zochafoodie.vercel.app/', featured: true, date: '2025-05-12' },
    { id: 'p6', title: 'Juiceio', description: 'Real-time weather with 7-day forecast.', tech: 'JavaScript, API', image: 'https://i.postimg.cc/02ZVd6Ft/1.png', url: 'https://juiceio.vercel.app/', featured: true, date: '2025-06-01' }
  ],
  testimonials: [
    { name: 'MR Shamal', role: 'Startup Founder', text: 'Outstanding work!', rating: 5 },
    { name: 'Dr Raif Tp', role: 'AI Specialist', text: 'Beyond expectations!', rating: 5 },
    { name: 'Yaseen B', role: 'Designer', text: 'Great attention to detail.', rating: 4 }
  ],
  messages: []
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

async function ensureStorageFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(SITE_DATA_FILE);
  } catch {
    await fs.writeFile(SITE_DATA_FILE, JSON.stringify(DEFAULT_SITE_DATA, null, 2), 'utf8');
  }

  try {
    await fs.access(MESSAGES_FILE);
  } catch {
    await fs.writeFile(MESSAGES_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

async function readJsonFile(filePath, fallback) {
  try {
    const text = await fs.readFile(filePath, 'utf8');
    return safeJsonParse(text, fallback);
  } catch {
    return clone(fallback);
  }
}

async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  return data;
}

function collectBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', chunk => {
      chunks.push(chunk);
      if (Buffer.concat(chunks).length > 2 * 1024 * 1024) {
        reject(new Error('Request body too large'));
        request.destroy();
      }
    });
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, content, contentType) {
  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store'
  });
  response.end(content);
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.ico') return 'image/x-icon';
  return 'application/octet-stream';
}

function sanitizeSiteData(input) {
  const data = input && typeof input === 'object' ? input : {};
  return {
    about: typeof data.about === 'string' ? data.about : DEFAULT_SITE_DATA.about,
    skills: Array.isArray(data.skills) ? data.skills : clone(DEFAULT_SITE_DATA.skills),
    services: Array.isArray(data.services) ? data.services : clone(DEFAULT_SITE_DATA.services),
    timeline: Array.isArray(data.timeline) ? data.timeline : clone(DEFAULT_SITE_DATA.timeline),
    projects: Array.isArray(data.projects) ? data.projects : clone(DEFAULT_SITE_DATA.projects),
    testimonials: Array.isArray(data.testimonials) ? data.testimonials : clone(DEFAULT_SITE_DATA.testimonials),
    messages: Array.isArray(data.messages) ? data.messages : []
  };
}

async function handleApi(request, response, pathname) {
  if (pathname === '/api/site-data') {
    if (request.method === 'GET') {
      const siteData = await readJsonFile(SITE_DATA_FILE, DEFAULT_SITE_DATA);
      sendJson(response, 200, sanitizeSiteData(siteData));
      return true;
    }

    if (request.method === 'PUT' || request.method === 'POST') {
      const body = await collectBody(request);
      const parsed = body ? safeJsonParse(body, null) : null;
      const nextData = sanitizeSiteData(parsed);
      const saved = await writeJsonFile(SITE_DATA_FILE, nextData);
      sendJson(response, 200, saved);
      return true;
    }

    sendJson(response, 405, { error: 'Method not allowed' });
    return true;
  }

  if (pathname === '/api/messages') {
    if (request.method === 'GET') {
      const messages = await readJsonFile(MESSAGES_FILE, []);
      sendJson(response, 200, Array.isArray(messages) ? messages : []);
      return true;
    }

    if (request.method === 'POST') {
      const body = await collectBody(request);
      const parsed = body ? safeJsonParse(body, {}) : {};
      const message = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
        name: typeof parsed.name === 'string' ? parsed.name : '',
        email: typeof parsed.email === 'string' ? parsed.email : '',
        subject: typeof parsed.subject === 'string' ? parsed.subject : '',
        message: typeof parsed.message === 'string' ? parsed.message : '',
        date: new Date().toISOString().slice(0, 10),
        emailSent: false,
        emailError: 'Email delivery is not configured on this JSON server.'
      };
      const messages = await readJsonFile(MESSAGES_FILE, []);
      const nextMessages = [message].concat(Array.isArray(messages) ? messages.filter(item => item && item.id !== message.id) : []);
      await writeJsonFile(MESSAGES_FILE, nextMessages);
      sendJson(response, 200, message);
      return true;
    }

    if (request.method === 'DELETE') {
      await writeJsonFile(MESSAGES_FILE, []);
      sendJson(response, 200, { ok: true });
      return true;
    }

    sendJson(response, 405, { error: 'Method not allowed' });
    return true;
  }

  if (pathname.startsWith('/api/messages/')) {
    if (request.method !== 'DELETE') {
      sendJson(response, 405, { error: 'Method not allowed' });
      return true;
    }

    const id = decodeURIComponent(pathname.slice('/api/messages/'.length));
    const messages = await readJsonFile(MESSAGES_FILE, []);
    const nextMessages = Array.isArray(messages) ? messages.filter(item => item && item.id !== id) : [];
    await writeJsonFile(MESSAGES_FILE, nextMessages);
    sendJson(response, 200, { ok: true });
    return true;
  }

  return false;
}

async function serveStatic(request, response, pathname) {
  let filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname.replace(/^\//, ''));
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(ROOT)) {
    sendText(response, 403, 'Forbidden', 'text/plain; charset=utf-8');
    return;
  }

  try {
    const stat = await fs.stat(normalized);
    if (stat.isDirectory()) {
      filePath = path.join(normalized, 'index.html');
    } else {
      filePath = normalized;
    }
    const content = await fs.readFile(filePath);
    sendText(response, 200, content, getContentType(filePath));
  } catch {
    sendText(response, 404, 'Not found', 'text/plain; charset=utf-8');
  }
}

async function main() {
  await ensureStorageFiles();

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      const pathname = url.pathname;

      if (pathname.startsWith('/api/')) {
        const handled = await handleApi(request, response, pathname);
        if (handled) return;
      }

      await serveStatic(request, response, pathname);
    } catch (error) {
      sendJson(response, 500, { error: error.message || 'Server error' });
    }
  });

  server.listen(PORT, () => {
    console.log(`Portfolio server running at http://localhost:${PORT}`);
  });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
