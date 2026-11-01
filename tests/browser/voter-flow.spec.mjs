import {test,expect} from '@playwright/test';

const openFresh=async page=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload()};

test('the first screen asks for location without choosing one for the voter',async({page})=>{
  await openFresh(page);
  await page.evaluate(()=>localStorage.setItem('represent-me-location-ready','true'));
  await page.reload();
  await expect(page.locator('main > section:not([hidden])').first()).toHaveAttribute('id','location-tools');
  await expect(page.locator('#location-tools')).toBeVisible();
  await expect(page.getByRole('button',{name:'Use my location'})).toBeVisible();
  await expect(page.locator('.notice')).toBeHidden();
  await expect(page.locator('#contests')).toBeHidden();
  await expect(page.locator('#location-tools')).toBeVisible();
  await expect(page.locator('#ballot-preview-content')).toBeHidden();
  await expect(page.locator('#representatives')).toBeHidden();
  await expect(page.locator('#sources')).toBeHidden();
  await expect(page.locator('.location-links')).toBeHidden();
});

test('Use my location requests permission and fills state before street address',async({context,page})=>{
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({latitude:33.3789,longitude:-84.7997});
  await page.route('https://api.bigdatacloud.net/data/reverse-geocode-client**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({principalSubdivisionCode:'US-GA',postcode:'30263'})}));
  await openFresh(page);
  await page.getByRole('button',{name:'Use my location'}).click();
  await expect(page.locator('#voting-state')).toHaveValue('GA');
  await expect(page.locator('#voting-address')).toHaveValue('30263');
  await expect(page.locator('#location-label')).toHaveText('Location not set');
  await expect(page.locator('#location-status')).toContainText('street address');
  await expect(page.locator('#ballot-preview-content')).toBeHidden();
});

test('a voter can find official ballot help without reading the research sections',async({page})=>{
  await openFresh(page);
  await page.locator('#location-tools').scrollIntoViewIfNeeded();
  await expect(page.locator('#location-tools')).toBeInViewport();
  await expect(page.getByRole('button',{name:'Use my location'})).toBeVisible();
  await page.locator('#voting-state').selectOption('GA');
  await expect(page.getByLabel('Street address',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:/Continue/})).toBeVisible();
  await expect(page.locator('.location-links')).toBeHidden();
  await page.getByLabel('Street address',{exact:true}).fill('123 Main Street, Newnan, GA 30263');
  const popupPromise=page.waitForEvent('popup');
  await page.getByRole('button',{name:/Continue/}).click();
  const popup=await popupPromise;await popup.close();
  await expect(page.locator('#ballot-preview-content')).toBeVisible();
  await expect(page.locator('#location-label')).toContainText('Location set: Georgia');
  await page.locator('.location-help summary').click();
  await expect(page.getByRole('link',{name:'Check my registration'})).toBeVisible();
  await expect(page.getByRole('button',{name:/Print guide/}).first()).toBeVisible();
});

test('a voter can open the candidate guide and see loaded races',async({page})=>{
  await openFresh(page);
  await page.evaluate(()=>{localStorage.setItem('represent-me-location-ready-v3','true');localStorage.setItem('represent-me-location-state-v3','GA')});
  await page.reload();
  await expect(page.locator('#contests')).toBeVisible();
  await expect(page.locator('#preliminary-ballot')).not.toContainText('Loading candidate roster');
  await expect(page.locator('#preliminary-ballot')).toContainText('Georgia');
});

test('candidate info opens without losing a ballot choice',async({page})=>{
  await openFresh(page);
  await page.evaluate(()=>{localStorage.setItem('represent-me-location-ready-v3','true');localStorage.setItem('represent-me-location-state-v3','GA')});
  await page.reload();
  const firstChoice=page.locator('#preliminary-ballot .ballot-option:not(.ballot-undecided)').first();
  await firstChoice.click();
  await page.getByRole('button',{name:/More information about Jon Ossoff/}).click();
  await expect(page.locator('.candidate-info-dialog')).toBeVisible();
  await expect(page.locator('.candidate-info-title')).toHaveText('Jon Ossoff');
  await page.getByRole('button',{name:'Close candidate information'}).click();
  await expect(page.locator('.candidate-info-dialog')).toBeHidden();
  await expect(firstChoice.locator('input')).toBeChecked();
});

test('a non-Georgia selection never shows the Georgia ballot preview',async({page})=>{
  await openFresh(page);
  await page.locator('#voting-state').selectOption('OH');
  await page.getByLabel('Street address',{exact:true}).fill('100 High Street, Columbus, OH 43215');
  await page.getByRole('button',{name:/Continue/}).click();
  await expect(page.locator('#ballot-preview-content')).toBeHidden();
  await expect(page.locator('#out-of-state-message')).toBeVisible();
  await expect(page.locator('#out-of-state-message')).toContainText('Federal races only');
  await expect(page.locator('#out-of-state-message')).toContainText('State and local ballot details are coming soon');
  await expect(page.locator('#explore-results')).toContainText('State and local research is coming soon');
  await expect(page.locator('#representative-list')).toContainText('State and local research is coming soon');
});

test('privacy information is easy to find',async({page})=>{
  await openFresh(page);
  await page.getByRole('button',{name:'Privacy'}).click();
  await expect(page.locator('#privacy-dialog')).toBeVisible();
  await expect(page.locator('#privacy-dialog')).toContainText('not saved or sent');
});

test('clearing location removes the visible location state',async({page})=>{
  await openFresh(page);
  await page.locator('#voting-state').selectOption('GA');
  await page.getByLabel('Street address',{exact:true}).fill('123 Main Street, Newnan, GA 30263');
  const popupPromise=page.waitForEvent('popup');
  await page.getByRole('button',{name:/Continue/}).click();
  const popup=await popupPromise;await popup.close();
  await expect(page.locator('#location-label')).toContainText('Location set: Georgia');
  await page.getByRole('button',{name:'Remove location',exact:true}).click();
  await expect(page.locator('#location-label')).toHaveText('Location not set');
  await expect(page.locator('#ballot-preview-content')).toBeHidden();
});

test('keyboard users can reach the main actions',async({page})=>{
  await openFresh(page);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
