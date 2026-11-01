import {test,expect} from '@playwright/test';

const state=process.env.PLAYWRIGHT_TEST_STATE||'GA';
const address=process.env.PLAYWRIGHT_TEST_ADDRESS||'30263';

test('voter journey: set location, complete the ballot, and report browser errors',async({page},testInfo)=>{
  const errors=[];
  page.on('pageerror',error=>errors.push({type:'pageerror',message:error.message,stack:error.stack}));
  page.on('console',message=>{if(message.type()==='error')errors.push({type:'console',message:message.text()})});
  page.on('requestfailed',request=>errors.push({type:'requestfailed',url:request.url(),message:request.failure()?.errorText||'request failed'}));

  await page.goto('/');
  await page.evaluate(()=>localStorage.clear());
  await page.reload();

  await expect(page.locator('#location-tools')).toBeVisible();
  await page.locator('#voting-state').selectOption(state);
  await page.getByLabel('Address or ZIP code',{exact:true}).fill(address);

  const popupPromise=page.waitForEvent('popup',{timeout:5000}).catch(()=>null);
  await page.getByRole('button',{name:/Continue/}).click();
  const popup=await popupPromise;
  if(popup)await popup.close();

  if(state==='GA'){
    await expect(page.locator('#ballot-preview-content')).toBeVisible();
    const races=page.locator('#preliminary-ballot .ballot-row');
    const raceCount=await races.count();
    expect(raceCount).toBeGreaterThan(0);
    for(let index=0;index<raceCount;index++){
      const choices=races.nth(index).locator('.ballot-option:not(.ballot-undecided)');
      await choices.first().click();
    }
    await expect(page.locator('#ballot-selection-status')).toContainText('Choices are temporary');
    await expect(page.locator('#ballot-progress-text')).toContainText(`${raceCount} race`);
    await page.evaluate(()=>{window.print=()=>{}});
    await page.getByRole('button',{name:/Print guide/}).first().click();
    await expect(page.locator('#private-print-sheet')).toBeAttached();
    await testInfo.attach('voter-journey-summary.json',{body:JSON.stringify({state,address,racesCompleted:raceCount,errors},null,2),contentType:'application/json'});
  }else{
    await expect(page.locator('#out-of-state-message')).toBeVisible();
    await expect(page.locator('#out-of-state-message')).toContainText('Federal races only');
    await testInfo.attach('voter-journey-summary.json',{body:JSON.stringify({state,address,federalOnly:true,errors},null,2),contentType:'application/json'});
  }

  expect(errors,errors.map(error=>JSON.stringify(error)).join('\n')).toEqual([]);
});
