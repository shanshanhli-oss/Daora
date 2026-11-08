/** Select London through the country → region → city cascade. */
export async function chooseLondon(page) {
  await page.locator('[name="country"]').fill('United Kingdom');
  await page.locator('#country-suggest li').first().click();
  await page.locator('[name="region"]').fill('England');
  await page.locator('#region-suggest li').first().click();
  await page.locator('[name="city"]').fill('London');
  await page.locator('#city-suggest li').first().click();
  await page.waitForFunction(() => document.querySelector('[name="city"]')?.dataset.cityId === '2643743');
}
