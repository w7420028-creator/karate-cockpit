import { expect, test } from '@playwright/test';

async function setAppDate(page, isoDate) {
  await page.addInitScript(dateString => {
    const fixed = new Date(dateString).valueOf();
    const RealDate = Date;
    class MockDate extends RealDate {
      constructor(...args) {
        super(...(args.length ? args : [fixed]));
      }
      static now() { return fixed; }
      static parse(value) { return RealDate.parse(value); }
      static UTC(...args) { return RealDate.UTC(...args); }
    }
    globalThis.Date = MockDate;
  }, isoDate);
}

async function seedState(page, state) {
  await page.addInitScript(seed => {
    localStorage.setItem('karate-cockpit-v1', JSON.stringify(seed));
  }, state);
}

const defaultPain = { knees: 0, achilles: 0, hips: 0, lowerBack: 0 };

test.describe('Karate Cockpit V1', () => {
  test('Sunday Review uses real inputs, saves once, then switches to completed/update state', async ({ page }) => {
    await setAppDate(page, '2026-05-31T20:30:00+02:00');
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
    await expect(page.getByText('Three-minute review. No workout.')).toBeVisible();
    await expect(page.locator('#weight')).toBeVisible();
    await expect(page.locator('#energy')).toBeVisible();
    await expect(page.locator('#pain-knees')).toBeVisible();
    await expect(page.getByText('Best kumite feeling', { exact: true })).toBeVisible();

    await page.locator('#weight').fill('94,0');
    await page.locator('#pain-achilles').fill('3');
    await page.locator('#energy').fill('6');
    await page.locator('#note').fill('kizami timing');
    await page.getByRole('button', { name: /^Done$/ }).tap();

    await expect(page.getByText('Completed today.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update entry' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View analytics' })).toBeVisible();

    const logCount = await page.evaluate(() => JSON.parse(localStorage.getItem('karate-cockpit-v1')).logs.length);
    expect(logCount).toBe(1);

    await page.getByRole('button', { name: 'Update entry' }).tap();
    await expect(page.getByRole('heading', { name: 'Four signals. No workout.' })).toBeVisible();
    await page.getByLabel('Sunday review').locator('[data-weight]').fill('93.8');
    await page.getByRole('button', { name: 'Update review' }).tap();

    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('karate-cockpit-v1')));
    expect(state.logs).toHaveLength(1);
    expect(state.logs[0].weight).toBe('93.8');
  });

  test('Progress analytics tracks weight, pain, energy, readiness and coach decision', async ({ page }) => {
    await setAppDate(page, '2026-06-07T20:30:00+02:00');
    await seedState(page, {
      readiness: 'GREEN',
      pain: defaultPain,
      sparring: 0,
      weight: '93.8',
      energy: 7,
      note: '',
      logs: [
        { id: '1', date: '2026-06-07T18:30:00+02:00', card: 'sunday-review', type: 'DONE', readiness: 'GREEN', pain: { knees: 1, achilles: 2, hips: 1, lowerBack: 0 }, weight: '93.8', energy: 7, note: 'kizami' },
        { id: '2', date: '2026-05-31T18:30:00+02:00', card: 'sunday-review', type: 'DONE', readiness: 'YELLOW', pain: { knees: 2, achilles: 3, hips: 1, lowerBack: 1 }, weight: '94,5', energy: 5, note: 'distance' }
      ]
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Progress' }).tap();

    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
    await expect(page.getByText('Coach decision')).toBeVisible();
    await expect(page.getByText('93.8', { exact: true })).toBeVisible();
    await expect(page.getByText('-0.7 kg')).toBeVisible();
    await expect(page.getByText('Avg energy')).toBeVisible();
    await expect(page.getByText('Pain trend')).toBeVisible();
    await expect(page.locator('.timeline .log-row').first()).toContainText('kizami');

    await page.getByRole('button', { name: 'Open charts' }).tap();
    await expect(page.getByRole('heading', { name: 'Insights' })).toBeVisible();
    await expect(page.locator('[data-chart="weight-trend"]')).toContainText('93.8 kg');
    await expect(page.locator('[data-chart="pain-trend"] svg[aria-label*="2 datapoints"]')).toBeVisible();
    await expect(page.locator('[data-chart="energy-trend"]')).toContainText('7 /10');
    await expect(page.locator('[data-chart="consistency"]')).toContainText('2/14');
    await expect(page.locator('[data-chart="readiness"]')).toContainText('1/1/0');
  });

  test('Insights renders a clear first-marker with a single datapoint', async ({ page }) => {
    await setAppDate(page, '2026-06-01T08:00:00+02:00');
    await seedState(page, {
      readiness: 'GREEN',
      pain: defaultPain,
      sparring: 0,
      weight: '94.0',
      energy: 6,
      note: '',
      logs: [
        { id: 'single', date: '2026-06-01T07:45:00+02:00', card: 'monday-karate', type: 'DONE', readiness: 'GREEN', pain: { knees: 1, achilles: 1, hips: 0, lowerBack: 0 }, weight: '94.0', energy: 6, note: 'sharp' }
      ]
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Progress' }).tap();
    await page.getByRole('button', { name: 'Open charts' }).tap();

    await expect(page.locator('[data-chart="weight-trend"]')).toContainText('First marker');
    await expect(page.locator('[data-chart="weight-trend"] svg[aria-label*="1 datapoint"]')).toBeVisible();
    await expect(page.locator('[data-chart="pain-trend"]')).toContainText('1 /10');
    await expect(page.locator('[data-chart="consistency"]')).toContainText('1/14');
  });

  test('Notification setup is reachable from app UI and explains iOS push constraints', async ({ page }) => {
    await setAppDate(page, '2026-06-01T08:00:00+02:00');
    await page.goto('/');

    await page.getByRole('button', { name: 'Plan' }).tap();
    await expect(page.getByText('iPhone native push')).toBeVisible();
    await page.getByRole('button', { name: 'Set up notifications' }).tap();

    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
    await expect(page.getByText('One-time iPhone push setup.')).toBeVisible();
    await expect(page.getByText(/iOS only allows Web Push/)).toBeVisible();
    await expect(page.getByText('IOS_PUSH_SUBSCRIPTION')).toHaveCount(2);
    await expect(page.getByText(/No private VAPID key or GitHub token/)).toBeVisible();
    await expect(page.locator('.subscription-export').first()).toBeVisible();
  });

  test('Wednesday session overlay is checklist/timer, not review inputs', async ({ page }) => {
    await setAppDate(page, '2026-06-03T20:00:00+02:00');
    await page.goto('/');

    await expect(page.getByText('Durability before danger.')).toBeVisible();
    await page.getByRole('button', { name: 'Start full' }).tap();
    await expect(page.getByRole('heading', { name: /Full: Strength \/ Tendon A/ })).toBeVisible();
    await expect(page.getByLabel('Session mode').getByText(/Goblet squat/)).toBeVisible();
    await expect(page.getByLabel('Session mode').locator('.exercise-diagram')).toHaveCount(9);
    await expect(page.locator('[data-timer]')).toBeVisible();
    await expect(page.getByLabel('Session mode').locator('[data-weight]')).toHaveCount(0);

    await page.getByLabel('Session mode').getByRole('button', { name: /^Done$/ }).tap();
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('karate-cockpit-v1')));
    expect(state.logs).toHaveLength(1);
    expect(state.logs[0].card).toBe('wednesday-strength');
    expect(state.logs[0].type).toBe('DONE');
  });

  test('Readiness and pain control tissue-protection state', async ({ page }) => {
    await setAppDate(page, '2026-06-02T07:30:00+02:00');
    await page.goto('/');

    await page.getByRole('button', { name: 'RED' }).tap();
    await expect(page.locator('.topbar .pill.red')).toHaveText('RED');
    await page.locator('#pain-knees').fill('4');
    await page.getByRole('button', { name: /^Done$/ }).tap();

    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('karate-cockpit-v1')));
    expect(state.readiness).toBe('RED');
    expect(state.logs[0].readiness).toBe('RED');
    expect(state.logs[0].pain.knees).toBe(4);
  });
});
