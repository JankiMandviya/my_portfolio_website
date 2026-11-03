import { readFile, stat } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = await readFile('dist/index.html', 'utf8');
const js = await readFile('dist/assets/app.js', 'utf8');
const css = await readFile('dist/assets/styles.css', 'utf8');
const { document, window } = parseHTML(html);
const report = [];
const check = (name, test) => { test(); report.push(name); };
check('Semantic structure and unique IDs', () => {
  assert.equal(document.querySelectorAll('h1').length, 1);
  assert.equal(document.documentElement.lang, 'en');
  const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(document.querySelector('main'));
  assert.ok(document.querySelector('nav[aria-label]'));
});
check('Every fragment link resolves', () => {
  document.querySelectorAll('a[href^="#"]').forEach(a => assert.ok(document.getElementById(a.getAttribute('href').slice(1)), a.outerHTML));
});
check('External links are HTTPS and isolated', () => {
  document.querySelectorAll('a[target="_blank"]').forEach(a => {
    assert.ok(a.href.startsWith('https://'));
    assert.ok(a.rel.includes('noopener'));
    assert.ok(a.rel.includes('noreferrer'));
  });
});
for (const element of document.querySelectorAll('[src],link[href^="./"]')) {
  const file = element.getAttribute('src') || element.getAttribute('href');
  if (file.startsWith('./')) assert.ok((await stat(`dist/${file.slice(2)}`)).size > 0, file);
}
report.push('All local production assets exist at relative paths');
check('SEO and preview privacy', () => {
  assert.ok(document.querySelector('meta[name="description"]').content.length > 80);
  assert.equal(document.querySelector('meta[name="robots"]').content, 'noindex,nofollow');
  const data = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
  assert.equal(data.name, 'Janki Mandviya');
});
check('Privacy and contextual outcome content', () => {
  assert.ok(!/8849003818|WhatsApp Image/.test(html));
  assert.ok(document.querySelector('#impact'));
  assert.ok(html.includes('SMOTE-resampled test set'));
  assert.ok(html.includes('one day</strong>') && !html.includes('3–4 days'));
  assert.ok(html.includes('janki-portrait.webp'));
  assert.ok(!/cdn.tailwindcss.com|react|next\/script/i.test(html));
  assert.equal(document.querySelectorAll('[data-category]').length, 4);
});
check('Mobile and reduced-motion rules are compiled', () => {
  assert.ok(css.includes('prefers-reduced-motion'));
  assert.ok(/max-width:600px/.test(css));
  assert.ok(css.includes('.sr-only'));
  assert.ok(css.includes(':focus-visible'));
});
let copied = '';
const env = { document, window, navigator: { clipboard: { writeText: async text => { copied = text; } } }, location: { hash: '' }, history: { replaceState() {} }, console, Date };
window.matchMedia = () => ({ matches: true });
window.setTimeout = () => 0;
window.HTMLElement.prototype.focus = function() {};
window.HTMLElement.prototype.scrollIntoView = function() {};
vm.runInNewContext(js, env, { filename: 'app.js' });
const click = selector => document.querySelector(selector).dispatchEvent(new window.Event('click', { bubbles: true }));
check('Mobile menu opens, closes and responds to Escape', () => {
  click('#menu-toggle');
  assert.equal(document.querySelector('#menu-toggle').getAttribute('aria-expanded'), 'true');
  const escape = new window.Event('keydown'); escape.key = 'Escape'; document.dispatchEvent(escape);
  assert.equal(document.querySelector('#menu-toggle').getAttribute('aria-expanded'), 'false');
  click('#menu-toggle'); click('#main-nav a');
  assert.equal(document.querySelector('#menu-toggle').getAttribute('aria-expanded'), 'false');
});
check('Hero controls update state and explanatory content', () => {
  click('[data-lens="sense"]');
  assert.equal(document.querySelector('#lens-title').textContent, 'Understand the scene.');
  assert.equal(document.querySelectorAll('[data-lens][aria-pressed="true"]').length, 1);
});
check('Architecture toggle and all evidence stages work', () => {
  click('[data-architecture="graph"]');
  assert.equal(document.querySelector('#diagram-agent').hidden, true);
  assert.equal(document.querySelector('#diagram-graph').hidden, false);
  click('[data-architecture="agent"]');
  assert.equal(document.querySelector('#diagram-agent').hidden, false);
  for (const key of ['act', 'evidence', 'report', 'plan']) click(`[data-node="${key}"]`);
  assert.equal(document.querySelectorAll('[data-node][aria-pressed="true"]').length, 1);
  assert.ok(document.querySelector('#node-description').textContent.startsWith('The planner'));
});
check('Vision controls update content', () => {
  click('[data-vision="stream"]');
  assert.ok(document.querySelector('#vision-description').textContent.includes('RTSP'));
  assert.equal(document.querySelectorAll('[data-vision][aria-pressed="true"]').length, 1);
});
check('Project filters return 2, 2 and 4 projects', () => {
  for (const [key, count] of [['rag',2],['ml',2],['all',4]]) {
    click(`[data-filter="${key}"]`);
    assert.equal([...document.querySelectorAll('[data-category]')].filter(el => !el.hidden).length, count);
  }
});
check('Case-study links open the correct detail panels', () => {
  for (const id of ['agent-details', 'edge-details']) {
    click(`[data-open-details="${id}"]`);
    assert.equal(document.getElementById(id).open, true);
  }
  assert.equal(document.querySelectorAll('details').length, 9);
});
click('#copy-email');
await new Promise(setImmediate);
check('Copy email success feedback', () => {
  assert.equal(copied, 'jankimandviya2003@gmail.com');
  assert.equal(document.querySelector('#copy-status').textContent, 'Email address copied.');
});
env.navigator.clipboard.writeText = async () => { throw new Error('Denied'); };
click('#copy-email');
await new Promise(setImmediate);
check('Clipboard denial has a useful fallback', () => {
  assert.ok(document.querySelector('#copy-status').textContent.includes('Select the email address'));
});
console.log(JSON.stringify({ passed: report.length, checks: report, limitations: ['DOM simulation, not a rendered browser test', 'Mobile layout and actual clipboard permission behavior require visual/browser review'] }, null, 2));
