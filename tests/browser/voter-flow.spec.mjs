import {test,expect} from '@playwright/test';

test('the first screen opens directly to the ballot',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Your ballot'})).toBeVisible();
  await expect(page.locator('#contests')).toBeVisible();
  await expect(page.getByRole('button',{name:/Print guide/}).first()).toBeVisible();
  await expect(page.getByRole('link',{name:'Compare my choices with my views'})).toBeVisible();
  await expect(page.locator('#representatives')).toBeHidden();
  await expect(page.locator('#sources')).toBeHidden();
});

test('a voter can find official ballot help without reading the research sections',async({page})=>{
  await page.goto('/');
  await page.locator('#location-tools').scrollIntoViewIfNeeded();
  await expect(page.locator('#location-tools')).toBeInViewport();
  await expect(page.getByRole('button',{name:'Use my location'})).toBeVisible();
  await expect(page.getByLabel('Address or ZIP code')).toBeVisible();
  await expect(page.getByRole('button',{name:/Continue/})).toBeVisible();
  await expect(page.getByRole('link',{name:'Check my registration'})).toBeVisible();
});

test('a voter can open the candidate guide and see loaded races',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#contests')).toBeVisible();
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
