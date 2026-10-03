/* Research tooling only. No project or account data is sent to these public sites. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || process.argv[2] || 'playwright');

const sources = [
  ['apple', 'https://www.apple.com/'],
  ['stripe', 'https://stripe.com/'],
  ['linear', 'https://linear.app/'],
  ['framer', 'https://www.framer.com/'],
  ['vercel', 'https://vercel.com/'],
  ['raycast', 'https://www.raycast.com/'],
  ['awwwards', 'https://www.awwwards.com/websites/animation/'],
  ['godly', 'https://godly.website/'],
  ['lapa', 'https://www.lapa.ninja/'],
  ['minimal', 'https://minimal.gallery/'],
  ['siteinspire', 'https://www.siteinspire.com/'],
];
const output = path.join(__dirname, 'references');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (let offset = 0; offset < sources.length; offset += 3) {
    await Promise.all(sources.slice(offset, offset + 3).map(async ([name, url]) => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(1800);
        await page.screenshot({ path: path.join(output, `${name}-hero.png`) });
        const observation = await page.evaluate(() => ({
          title: document.title,
          headings: [...document.querySelectorAll('h1,h2')].slice(0, 12).map(el => el.textContent.trim()),
          displayFont: document.querySelector('h1') ? getComputedStyle(document.querySelector('h1')).fontFamily : null,
          canvas: getComputedStyle(document.body).backgroundColor,
        }));
        await page.evaluate(() => window.scrollTo(0, 900));
        await page.waitForTimeout(900);
        await page.screenshot({ path: path.join(output, `${name}-story.png`) });
        results.push({ name, url, status: 'captured', ...observation });
        console.log(`${name}: captured two rendered views`);
      } catch (error) {
        results.push({ name, url, status: 'unavailable', error: error.message });
        console.log(`${name}: ${error.message.split('\n')[0]}`);
      } finally {
        await page.close();
      }
    }));
  }
  fs.writeFileSync(path.join(output, 'observations.json'), JSON.stringify({ capturedAt: new Date().toISOString(), sources: results }, null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
