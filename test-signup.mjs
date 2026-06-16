import { chromium } from 'playwright';

const email = `teste_bolao_${Date.now()}@gmail.com`;
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const erros = [];
page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });

await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
await page.click('text=Cadastrar');
await page.fill('input[placeholder="Seu nome"]', 'Teste');
await page.fill('input[type="email"]', email);
await page.fill('input[type="password"]', 'senha123');
await page.click('text=Criar conta e entrar');

await page.waitForURL('**/palpites', { timeout: 10000 });
await page.screenshot({ path: '/tmp/bolao-palpites.png', fullPage: true });
console.log('✓ Cadastro + redirect para /palpites OK');
console.log('Erros:', erros.length ? erros : 'nenhum');

await browser.close();
