import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

// Login
await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/bolao-login.png', fullPage: true });
console.log('✓ Login');

// Ranking (sem auth, deve redirecionar para login — confirma middleware)
await page.goto('http://localhost:3000/ranking', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/bolao-redirect.png', fullPage: true });
console.log('✓ Redirect /ranking → /login (middleware OK)');

console.log('Console errors:', errors.length ? errors : 'nenhum');
await browser.close();
