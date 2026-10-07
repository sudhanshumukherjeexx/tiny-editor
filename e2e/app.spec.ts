import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const editor = (page: Page) => page.locator('.ProseMirror');
const words = (page: Page) => page.locator('.status-bar .stat').first();

async function write(page: Page, text: string) {
  await editor(page).click();
  await page.keyboard.type(text);
}

test.beforeEach(async ({ page }) => {
  // Leaving a page with text triggers the beforeunload prompt; accept it.
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('./');
});

test('opens straight into a blank, temporary document', async ({ page }) => {
  await expect(editor(page)).toBeVisible();
  await expect(page.locator('textarea.doc-title')).toHaveValue('Untitled');
  await expect(words(page)).toHaveText('0 words');
  await expect(page.locator('.temp-indicator')).toBeVisible();
  await expect(page.locator('.ProseMirror p.is-editor-empty')).toHaveAttribute('data-placeholder', /start writing something beautiful/);
});

test('formats text and counts words', async ({ page }) => {
  await write(page, 'Today I learned ');
  await page.keyboard.press('ControlOrMeta+b');
  await page.keyboard.type('something useful');
  await expect(editor(page).locator('strong')).toHaveText('something useful');
  await expect(words(page)).toHaveText('5 words');
});

test('never writes the document to browser storage, and a reload clears it', async ({ page, context }) => {
  const secret = 'a very private sentence';
  await write(page, secret);
  await expect(words(page)).toHaveText('4 words');

  const storage = await page.evaluate(async () => ({
    local: JSON.stringify({ ...localStorage }),
    session: JSON.stringify({ ...sessionStorage }),
    cookie: document.cookie,
    idb: (await indexedDB.databases()).map((d) => d.name),
  }));
  expect(storage.local).not.toContain('private');
  expect(storage.session).not.toContain('private');
  expect(storage.cookie).toBe('');
  expect(storage.idb).toEqual([]);
  expect(JSON.stringify(await context.storageState())).not.toContain('private');

  await page.reload();
  await expect(words(page)).toHaveText('0 words');
  await expect(editor(page)).not.toContainText(secret);
});

test('a new tab after closing starts blank', async ({ page, context }) => {
  await write(page, 'gone when the tab closes');
  await page.close({ runBeforeUnload: false });
  const next = await context.newPage();
  await next.goto('./');
  await expect(words(next)).toHaveText('0 words');
});

test('exports Markdown named after the title', async ({ page }) => {
  await page.locator('textarea.doc-title').fill('Sunday Thoughts');
  await editor(page).click();
  await page.keyboard.type('# Things to remember');
  await page.keyboard.press('Enter');
  await page.keyboard.type('- Keep systems simple');

  await page.getByRole('button', { name: /export/i }).first().click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: /^Markdown/ }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('Sunday Thoughts.md');
  const markdown = await readFile(await download.path(), 'utf8');
  expect(markdown).toContain('# Things to remember');
  expect(markdown).toContain('- Keep systems simple');
  await expect(page.locator('.export-btn')).toHaveClass(/is-done/);
});

test('prints only the document, without a trailing blank page', async ({ page }) => {
  await page.locator('textarea.doc-title').fill('Short note');
  await write(page, 'One short paragraph.');
  for (const format of ['A4', 'Letter']) {
    const pdf = (await page.pdf({ format })).toString('latin1');
    expect(pdf.match(/\/Type\s*\/Page[^s]/g), format).toHaveLength(1);
  }
});

test('switches themes', async ({ page }) => {
  await page.getByRole('button', { name: 'Theme' }).click();
  await page.getByRole('radio', { name: /Tokyo Night/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'tokyo-night');
  await expect(page.locator('html')).toHaveAttribute('data-scheme', 'dark');
});

test('inserts a kaomoji at the cursor', async ({ page, isMobile }) => {
  test.skip(isMobile, 'kaomoji live under More on mobile');
  await write(page, 'hello ');
  await page.getByRole('button', { name: 'Kaomoji and symbols' }).click();
  await page.locator('.kaomoji').first().click();
  await expect(editor(page)).toContainText(/hello \S/);
});

test('focus mode hides the toolbar and Escape leaves it', async ({ page }) => {
  await page.getByRole('button', { name: 'Focus mode' }).click();
  await expect(page.locator('.toolbar')).toHaveCount(0);
  await expect(words(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.toolbar')).toBeVisible();
});

test('layout never scrolls sideways', async ({ page }) => {
  await write(page, 'A fairly long line of text that should wrap politely rather than pushing the page wider than the screen.');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.locator('.export-btn')).toBeVisible();
});
