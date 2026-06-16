import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

// Login
await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/s1-login.png', fullPage: true });
console.log('✓ Login');

// Cadastra e entra
await page.click('text=Cadastrar');
await page.fill('input[placeholder="Seu nome"]', 'David');
await page.fill('input[type="email"]', `david_test_${Date.now()}@gmail.com`);
await page.fill('input[type="password"]', 'senha123');
await page.click('text=Criar conta e entrar');
await page.waitForURL('**/palpites', { timeout: 10000 });

// Palpites
await page.screenshot({ path: '/tmp/s2-palpites.png', fullPage: true });
console.log('✓ Palpites');

// Ranking
await page.goto('http://localhost:3000/ranking', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/s3-ranking.png', fullPage: true });
console.log('✓ Ranking');

// Resultados
await page.goto('http://localhost:3000/resultados', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/s4-resultados.png', fullPage: true });
console.log('✓ Resultados');

await browser.close();
