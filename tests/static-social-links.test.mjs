import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../app/web/index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/web/styles.css', import.meta.url), 'utf8');

const externalLinks = [
  {
    className: 'social-link-facebook',
    href: 'https://www.facebook.com/profile.php?id=61590457417522',
    label: 'Follow Rusty Art on Facebook'
  },
  {
    className: 'social-link-instagram',
    href: 'https://www.instagram.com/rusty.art.og/',
    label: 'Follow Rusty Art on Instagram'
  },
  {
    className: 'social-link-github',
    href: 'https://github.com/Gil-1/rusty-art',
    label: 'View Rusty Art source code on GitHub'
  }
];

function anchorForHref(href) {
  const hrefIndex = html.indexOf(`href="${href}"`);
  assert.notEqual(hrefIndex, -1, `${href} link exists`);

  const anchorStart = html.lastIndexOf('<a ', hrefIndex);
  const anchorEnd = html.indexOf('>', hrefIndex);

  assert.ok(anchorStart >= 0 && anchorEnd > hrefIndex, `${href} link is an anchor`);

  return html.slice(anchorStart, anchorEnd + 1);
}

test('header exposes social follows and source link', () => {
  for (const { className, href, label } of externalLinks) {
    const anchor = anchorForHref(href);

    assert.ok(anchor.includes('class="social-link '), `${href} uses social link styling`);
    assert.ok(anchor.includes(className), `${href} has platform styling`);
    assert.ok(anchor.includes(`aria-label="${label}"`), `${href} has accessible label`);
    assert.ok(anchor.includes('target="_blank"'), `${href} opens in a new tab`);
    assert.ok(anchor.includes('rel="me noopener noreferrer"'), `${href} has safe external rel`);
  }
});

test('social link presentation stays in Tailwind markup', () => {
  assert.equal(css.includes('.social-link'), false);
  assert.equal(css.includes('.social-links'), false);
  assert.ok(html.includes('hover:border-blue-300/60'));
  assert.ok(html.includes('hover:border-pink-300/60'));
  assert.ok(html.includes('hover:border-slate-200/60'));
});
