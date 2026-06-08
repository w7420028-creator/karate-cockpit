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
    await expect(page.getByText('Weight and weekly recovery review.')).toBeVisible();
    await expect(page.locator('#weight')).toBeVisible();
    await expect(page.locator('#waist-cm')).toBeVisible();
    await expect(page.locator('#sleep-hours')).toBeVisible();
    await expect(page.locator('#energy')).toHaveCount(0);
    await expect(page.locator('#pain-knees')).toHaveCount(0);
    await expect(page.getByText('Weekly review note', { exact: true })).toBeVisible();

    await page.locator('#weight').fill('94,0');
    await page.locator('#waist-cm').fill('104.5');
    await page.locator('#sleep-hours').fill('7.2');
    await page.locator('#note').fill('kizami timing');
    await page.getByRole('button', { name: /^Done$/ }).tap();

    await expect(page.getByText('Completed today.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update entry' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View analytics' })).toBeVisible();

    const logCount = await page.evaluate(() => JSON.parse(localStorage.getItem('karate-cockpit-v1')).logs.length);
    expect(logCount).toBe(1);

    await page.locator('#weight').fill('93.8');
    await page.locator('#waist-cm').fill('104.0');
    await page.getByRole('button', { name: 'Update entry' }).tap();

    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('karate-cockpit-v1')));
    expect(state.logs).toHaveLength(1);
    expect(state.logs[0].weight).toBe('93.8');
    expect(state.logs[0].waistCm).toBe('104.0');
    expect(state.logs[0].sleepHours).toBe('7.2');
    expect(state.logs[0]).not.toHaveProperty('pain');
    expect(state.logs[0]).not.toHaveProperty('sparring');
    expect(state.logs[0]).not.toHaveProperty('energy');
  });

  test('Monday karate check-in logs conditioning and strength effort', async ({ page }) => {
    await setAppDate(page, '2026-06-01T21:00:00+02:00');
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Post-karate check' })).toBeVisible();
    await expect(page.getByText('Conditioning / cardio effort')).toBeVisible();
    await expect(page.getByText('Strength effort', { exact: true })).toBeVisible();

    await page.locator('#load-cardio').fill('8');
    await page.locator('#load-strength').fill('6');
    await page.locator('#note').fill('Unterschenkel heavy, Rücken fine');
    await page.getByRole('button', { name: /^Done$/ }).tap();

    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('karate-cockpit-v1')));
    expect(state.logs).toHaveLength(1);
    expect(state.logs[0].card).toBe('monday-karate');
    expect(state.logs[0].trainingLoad).toEqual({ cardio: 8, strength: 6 });
    expect(state.logs[0].note).toBe('Unterschenkel heavy, Rücken fine');
    expect(state.logs[0]).not.toHaveProperty('pain');
    expect(state.logs[0]).not.toHaveProperty('sparring');
    expect(state.logs[0]).not.toHaveProperty('energy');
  });

  test('Between karate days use recovery soreness check with optional sleep import', async ({ page }) => {
    await setAppDate(page, '2026-06-02T08:00:00+02:00');
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Recovery check' })).toBeVisible();
    await expect(page.locator('.field-label').filter({ hasText: 'Muscle soreness' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unterschenkel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Oberschenkel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bauch' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rücken' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Oberarme' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unterarme' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'calves/Achilles' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'hips' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Unterschenkel' }).tap();
    await page.getByRole('button', { name: 'Rücken' }).tap();
    await page.locator('#recovery-soreness').fill('5');
    await page.locator('#recovery-stiffness').fill('4');
    await page.getByText('Optional sleep / weight import').tap();
    await page.locator('#sleep-hours').fill('7.4');
    await page.getByRole('button', { name: /^Done$/ }).tap();

    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('karate-cockpit-v1')));
    expect(state.logs).toHaveLength(1);
    expect(state.logs[0].card).toBe('tuesday-recovery');
    expect(state.logs[0].readiness).toBe('YELLOW');
    expect(state.logs[0].recovery).toEqual({
      areas: ['Unterschenkel', 'Rücken'],
      soreness: 5,
      stiffness: 4,
      recommendation: 'mobility'
    });
    expect(state.logs[0].sleepHours).toBe('7.4');
    expect(state.logs[0]).not.toHaveProperty('pain');
    expect(state.logs[0]).not.toHaveProperty('sparring');
    expect(state.logs[0]).not.toHaveProperty('energy');
  });

  test('Progress analytics tracks weight, karate load, recovery and coach decision', async ({ page }) => {
    await setAppDate(page, '2026-06-07T20:30:00+02:00');
    await seedState(page, {
      readiness: 'GREEN',
      pain: defaultPain,
      sparring: 0,
      weight: '93.8',
      waistCm: '104.0',
      energy: 7,
      note: '',
      logs: [
        { id: '1', date: '2026-06-06T08:30:00+02:00', card: 'saturday-optional', type: 'DONE', readiness: 'GREEN', pain: defaultPain, weight: '', waistCm: '104.0', energy: 0, recovery: { areas: ['Unterschenkel'], soreness: 3, stiffness: 2, recommendation: 'normal' }, note: 'loose legs' },
        { id: '6', date: '2026-06-04T20:00:00+02:00', card: 'thursday-footwork', type: 'DONE', readiness: 'YELLOW', pain: defaultPain, weight: '', energy: 0, recovery: { areas: ['Rücken', 'Bauch'], soreness: 7, stiffness: 5, recommendation: 'pause' }, note: 'core/back loaded' },
        { id: '7', date: '2026-06-03T20:00:00+02:00', card: 'wednesday-strength', type: 'DONE', readiness: 'YELLOW', pain: defaultPain, weight: '', energy: 0, recovery: { areas: ['Rücken'], soreness: 6, stiffness: 4, recommendation: 'mobility' }, note: 'back still tight' },
        { id: '2', date: '2026-06-02T08:00:00+02:00', card: 'tuesday-recovery', type: 'DONE', readiness: 'YELLOW', pain: defaultPain, weight: '', energy: 0, recovery: { areas: ['Rücken'], soreness: 5, stiffness: 4, recommendation: 'mobility' }, note: 'back tight' },
        { id: '3', date: '2026-06-01T21:00:00+02:00', card: 'monday-karate', type: 'DONE', readiness: 'GREEN', pain: defaultPain, weight: '93.8', energy: 0, trainingLoad: { cardio: 8, strength: 6 }, note: 'kizami' },
        { id: '4', date: '2026-05-31T18:30:00+02:00', card: 'sunday-review', type: 'DONE', readiness: 'YELLOW', pain: { knees: 2, achilles: 3, hips: 1, lowerBack: 1 }, weight: '94,5', waistCm: '105.0', energy: 5, note: 'distance' },
        { id: '5', date: '2026-05-10T18:30:00+02:00', card: 'sunday-review', type: 'DONE', readiness: 'GREEN', pain: defaultPain, weight: '', waistCm: '106.0', energy: 6, note: 'baseline' }
      ]
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Progress' }).tap();

    await expect(page.getByRole('heading', { name: 'Analytics', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Trend decision' })).toBeVisible();
    await expect(page.getByText('Recovery debt', { exact: true })).toBeVisible();
    await expect(page.getByText('Weekly summary')).toBeVisible();
    await expect(page.getByText('Coach decision')).toBeVisible();
    await expect(page.getByText('93.8', { exact: true })).toBeVisible();
    await expect(page.getByText('-0.7 kg')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Transformation' })).toBeVisible();
    await expect(page.getByText('104.0', { exact: true })).toBeVisible();
    await expect(page.getByText('-2.0 cm')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Karate load' })).toBeVisible();
    await expect(page.getByText('Avg cardio')).toBeVisible();
    await expect(page.getByText('Avg strength')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recovery trend' })).toBeVisible();
    await expect(page.getByText('Avg soreness')).toBeVisible();
    await expect(page.getByText('Avg stiffness')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Soreness map' })).toBeVisible();
    await expect(page.getByText('Most recurring: Rücken · 3 of last 4 recovery checks')).toBeVisible();
    await expect(page.locator('[data-muscle-row="Rücken"]')).toContainText('recurring');
    await expect(page.locator('[data-muscle-row="Unterschenkel"]')).toContainText('stable');
    await expect(page.locator('[data-muscle-row="Unterarme"]')).toContainText('quiet');
    await expect(page.locator('[data-muscle-row="Rücken"] [data-soreness-cell="high"]')).toHaveCount(3);
    await expect(page.getByText('Pain trend')).toHaveCount(0);
    await expect(page.getByText('Avg energy')).toHaveCount(0);
    await expect(page.locator('.timeline .log-row').first()).toContainText('loose legs');
    await expect(page.locator('.timeline .log-row').first()).not.toContainText('knees');
    await expect(page.locator('.timeline .log-row').first()).not.toContainText('energy');

    await page.getByRole('button', { name: 'Open charts' }).tap();
    await expect(page.getByRole('heading', { name: 'Insights' })).toBeVisible();
    await expect(page.locator('[data-chart="weight-trend"]')).toContainText('93.8 kg');
    await expect(page.locator('[data-chart="waist-trend"]')).toContainText('104.0 cm');
    await expect(page.locator('[data-chart="cardio-load"]')).toContainText('8 /10');
    await expect(page.locator('[data-chart="strength-load"]')).toContainText('6 /10');
    await expect(page.locator('[data-chart="soreness-trend"] svg[aria-label*="4 datapoints"]')).toBeVisible();
    await expect(page.locator('[data-chart="stiffness-trend"]')).toContainText('2 /10');
    await expect(page.locator('[data-chart="muscle-heatmap"]')).toContainText('Muscle heatmap');
    await expect(page.locator('[data-chart="muscle-heatmap"]')).toContainText('Most recurring: Rücken · 3 of last 4 recovery checks');
    await expect(page.locator('[data-chart="muscle-heatmap"] [data-muscle-row="Rücken"]')).toContainText('recurring');
    await expect(page.locator('[data-chart="muscle-heatmap"] [data-muscle-row="Rücken"] [data-soreness-cell="high"]')).toHaveCount(3);
    await expect(page.locator('[data-chart="consistency"]')).toContainText('6/14');
    await expect(page.locator('[data-chart="readiness"]')).toContainText('2/4/0');
  });

  test('logging keeps more than 180 historical entries and preserves existing state', async ({ page }) => {
    await setAppDate(page, '2026-06-02T07:30:00+02:00');
    const oldLogs = Array.from({ length: 181 }, (_, index) => ({
      id: `old-${index}`,
      date: new Date(Date.parse('2026-05-25T07:00:00+02:00') - index * 86400000).toISOString(),
      card: 'monday-karate',
      type: 'DONE',
      readiness: 'GREEN',
      pain: { knees: 0, achilles: 0, hips: 0, lowerBack: 0 },
      weight: '',
      energy: 7,
      note: `old ${index}`
    }));
    await seedState(page, {
      readiness: 'GREEN',
      pain: defaultPain,
      sparring: 0,
      weight: '94.0',
      energy: 7,
      note: 'new day',
      logs: oldLogs
    });

    await page.goto('/');
    await page.getByRole('button', { name: /^Done$/ }).tap();

    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('karate-cockpit-v1')));
    expect(state.logs).toHaveLength(182);
    expect(state.logs[0].card).toBe('tuesday-recovery');
    expect(state.logs.at(-1).id).toBe('old-180');
  });

  test('skipped logs can record a holiday reason', async ({ page }) => {
    await setAppDate(page, '2026-06-02T07:30:00+02:00');
    await page.goto('/');

    await page.locator('#skip-reason-category').selectOption('holiday');
    await page.locator('#skip-reason-text').fill('Pentecost holiday');
    await page.getByRole('button', { name: 'Skip — no debt' }).tap();

    await expect(page.getByText('Skipped today. No debt.')).toBeVisible();
    await expect(page.locator('.today-status').filter({ hasText: 'skip: Holiday — Pentecost holiday' })).toBeVisible();
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('karate-cockpit-v1')));
    expect(state.logs).toHaveLength(1);
    expect(state.logs[0].type).toBe('SKIPPED');
    expect(state.logs[0].skipReason).toEqual({ category: 'holiday', text: 'Pentecost holiday' });
    expect(state.logs[0]).not.toHaveProperty('pain');
    expect(state.logs[0]).not.toHaveProperty('sparring');
    expect(state.logs[0]).not.toHaveProperty('energy');
  });

  test('analytics exports all logs as raw JSON and flattened CSV', async ({ page }) => {
    await setAppDate(page, '2026-06-07T20:30:00+02:00');
    await seedState(page, {
      readiness: 'GREEN',
      pain: defaultPain,
      sparring: 0,
      weight: '93.8',
      waistCm: '104.0',
      energy: 7,
      note: '',
      logs: [
        { id: 'skip', date: '2026-06-06T18:30:00+02:00', card: 'saturday-optional', type: 'SKIPPED', readiness: 'YELLOW', pain: { knees: 1, achilles: 1, hips: 0, lowerBack: 0 }, weight: '', energy: 5, note: '', skipReason: { category: 'holiday', text: 'Pentecost holiday' } },
        { id: 'done', date: '2026-06-05T18:30:00+02:00', card: 'friday-karate', type: 'DONE', readiness: 'GREEN', pain: { knees: 0, achilles: 1, hips: 0, lowerBack: 0 }, weight: '93.8', waistCm: '104.0', energy: 7, note: 'kizami, sharp' }
      ]
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Progress' }).tap();

    const exportCard = page.locator('.export-card');
    await expect(page.getByRole('heading', { name: 'Data export' })).toBeVisible();
    await expect(exportCard.getByText('Total logs')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Export JSON' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Export CSV' })).toBeEnabled();
    const exported = await page.evaluate(() => ({
      json: JSON.parse(exportLogsAsJson()),
      csv: exportLogsAsCsv()
    }));
    expect(exported.json.logCount).toBe(2);
    expect(exported.json.logs.map(log => log.id)).toEqual(['skip', 'done']);
    expect(exported.csv).toContain('skip_reason_category,skip_reason_text');
    expect(exported.csv).toContain('waist_cm');
    expect(exported.csv).toContain('104.0');
    expect(exported.csv).toContain('holiday,Pentecost holiday');
    expect(exported.csv).toContain('"kizami, sharp"');
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
        { id: 'single', date: '2026-06-01T07:45:00+02:00', card: 'monday-karate', type: 'DONE', readiness: 'GREEN', pain: { knees: 1, achilles: 1, hips: 0, lowerBack: 0 }, weight: '94.0', energy: 6, trainingLoad: { cardio: 8, strength: 5 }, note: 'sharp' }
      ]
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Progress' }).tap();
    await page.getByRole('button', { name: 'Open charts' }).tap();

    await expect(page.locator('[data-chart="weight-trend"]')).toContainText('First marker');
    await expect(page.locator('[data-chart="weight-trend"] svg[aria-label*="1 datapoint"]')).toBeVisible();
    await expect(page.locator('[data-chart="cardio-load"]')).toContainText('8 /10');
    await expect(page.locator('[data-chart="consistency"]')).toContainText('1/14');
  });

  test('Notification setup is reachable from Progress and explains iOS push constraints', async ({ page }) => {
    await setAppDate(page, '2026-06-01T08:00:00+02:00');
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Plan' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Progress' }).tap();
    await page.getByRole('button', { name: 'iPhone notifications' }).tap();

    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
    await expect(page.getByText('One-time iPhone push setup.')).toBeVisible();
    await expect(page.getByText(/iOS only allows Web Push/)).toBeVisible();
    await expect(page.getByText('IOS_PUSH_SUBSCRIPTION')).toHaveCount(2);
    await expect(page.getByText(/No private VAPID key or GitHub token/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Allow notifications' })).toBeDisabled();
    await expect(page.locator('.subscription-export').first()).toBeVisible();
  });

  test('Today only exposes the new check-in tracking, not session/program controls', async ({ page }) => {
    await setAppDate(page, '2026-06-03T20:00:00+02:00');
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Recovery check' })).toBeVisible();
    await expect(page.getByText('Strength / Tendon A')).toHaveCount(0);
    await expect(page.getByText('Footwork + Mobility')).toHaveCount(0);
    await expect(page.getByText('Optional Stable-Week Work')).toHaveCount(0);
    await expect(page.getByText('Full session')).toHaveCount(0);
    await expect(page.getByText('Minimum version')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Start full' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Minimum' })).toHaveCount(0);
    await expect(page.locator('.session-overlay')).toHaveCount(0);

    await page.locator('#recovery-soreness').fill('4');
    await page.getByRole('button', { name: /^Done$/ }).tap();
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('karate-cockpit-v1')));
    expect(state.logs).toHaveLength(1);
    expect(state.logs[0].card).toBe('wednesday-strength');
    expect(state.logs[0].type).toBe('DONE');
  });

  test('Readiness and recovery soreness control tissue-protection state', async ({ page }) => {
    await setAppDate(page, '2026-06-02T07:30:00+02:00');
    await page.goto('/');

    await page.getByRole('button', { name: 'RED' }).tap();
    await expect(page.locator('.topbar .pill.red')).toHaveText('RED');
    await page.locator('#recovery-soreness').fill('8');
    await page.getByRole('button', { name: /^Done$/ }).tap();

    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('karate-cockpit-v1')));
    expect(state.readiness).toBe('RED');
    expect(state.logs[0].readiness).toBe('RED');
    expect(state.logs[0].recovery.soreness).toBe(8);
    expect(state.logs[0].recovery.recommendation).toBe('pause');
  });

  test('Skipped holiday logs keep reason and all logs export without truncation', async ({ page }) => {
    await setAppDate(page, '2026-05-25T08:00:00+02:00');
    await seedState(page, {
      readiness: 'GREEN',
      pain: defaultPain,
      sparring: 0,
      weight: '94.0',
      energy: 7,
      note: '',
      skipReason: { category: '', text: '' },
      logs: Array.from({ length: 181 }, (_, index) => ({
        id: `old-${index}`,
        date: new Date(Date.UTC(2026, 4, 24 - index, 7, 0, 0)).toISOString(),
        card: 'tuesday-recovery',
        type: 'DONE',
        readiness: 'GREEN',
        pain: defaultPain,
        sparring: 0,
        weight: '',
        energy: 7,
        note: ''
      }))
    });
    await page.goto('/');

    await page.locator('#skip-reason-category').selectOption('holiday');
    await page.locator('#skip-reason-text').fill('Feiertag');
    await page.getByRole('button', { name: 'Skip — no debt' }).tap();

    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('karate-cockpit-v1')));
    expect(state.logs).toHaveLength(182);
    expect(state.logs[0].type).toBe('SKIPPED');
    expect(state.logs[0].skipReason).toEqual({ category: 'holiday', text: 'Feiertag' });

    await page.getByRole('button', { name: 'Progress' }).tap();
    await expect(page.getByRole('heading', { name: 'Data export' })).toBeVisible();
    await expect(page.locator('.export-card .metric').first()).toContainText('182');
    await expect(page.getByRole('button', { name: 'Export JSON' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Export CSV' })).toBeEnabled();

    const exported = await page.evaluate(() => ({
      json: JSON.parse(exportLogsAsJson()).logCount,
      csv: exportLogsAsCsv()
    }));
    expect(exported.json).toBe(182);
    expect(exported.csv).toContain('skip_reason_category,skip_reason_text');
    expect(exported.csv).toContain('holiday,Feiertag');
  });
});
