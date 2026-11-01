import {test,expect} from '@playwright/test';

test('the first screen gives a voter three clear choices',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Ready to vote?'})).toBeVisible();
  const start=page.locator('.quick-start-card');
  await expect(start).toHaveCount(3);
  await expect(start.nth(0)).toContainText('Find my ballot');
  await expect(start.nth(1)).toContainText('Print my guide');
  await expect(start.nth(2)).toContainText('More research');
  await expect(page.locator('#contests')).toBeVisible();
  await expect(page.locator('#representatives')).toBeHidden();
  await expect(page.locator('#sources')).toBeHidden();
});

test('a voter can find official ballot help without reading the research sections',async({page})=>{
  await page.goto('/');
  await page.locator('.quick-start-card').nth(0).click();
  await expect(page.locator('#location-tools')).toBeInViewport();
  await expect(page.getByRole('link',{name:'See my official ballot'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Check my polling place'})).toBeVisible();
});

test('a voter can open the candidate guide and see loaded races',async({page})=>{
  await page.goto('/');
  await page.locator('.quick-start-card').nth(1).click();
  await expect(page.locator('#contests')).toBeInViewport();
  await expect(page.locator('#preliminary-ballot')).not.toContainText('Loading candidate roster');
  await expect(page.locator('#preliminary-ballot')).toContainText('Georgia');
});

test('privacy information is easy to find',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Privacy'}).click();
  await expect(page.locator('#privacy-dialog')).toBeVisible();
  await expect(page.locator('#privacy-dialog')).toContainText('not saved or sent');
});

test('keyboard users can reach the main actions',async({page})=>{
  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
