/** Presentational HTML for the two charts. Labels only; the numbers come from the engines. */

const BRANCH_GRID = ['巳', '午', '未', '申', '辰', '酉', '卯', '戌', '寅', '丑', '子', '亥'];
const BRANCH_AREA = { 巳: 'si', 午: 'wu', 未: 'wei', 申: 'shen', 辰: 'chen', 酉: 'you', 卯: 'mao', 戌: 'xu', 寅: 'yin', 丑: 'chou', 子: 'zi', 亥: 'hai' };
const BRANCH_ORDER = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];

const PALACE_GLOSS = {
  命宫: 'Life', 兄弟: 'Siblings', 夫妻: 'Spouse', 子女: 'Children', 财帛: 'Wealth', 疾厄: 'Health',
  迁移: 'Travel', 仆役: 'Friends', 官禄: 'Career', 田宅: 'Property', 福德: 'Fortune', 父母: 'Parents',
};
const STAR_GLOSS = {
  紫微: 'Emperor', 天机: 'Advisor', 太阳: 'Sun', 武曲: 'Finance', 天同: 'Joy', 廉贞: 'Integrity',
  天府: 'Treasury', 太阴: 'Moon', 贪狼: 'Desire', 巨门: 'Gate', 天相: 'Minister', 天梁: 'Roof',
  七杀: 'General', 破军: 'Army',
};
const BRIGHT_GLOSS = { 庙: 'temple', 旺: 'bright', 得: 'gained', 利: 'sharp', 平: 'level', 不: 'dim', 陷: 'fallen' };
const MUTAGEN_GLOSS = { 禄: 'abundance', 权: 'authority', 科: 'recognition', 忌: 'obstacle' };

function starsLine(stars, language) {
  if (!stars.length) return language === 'en' ? 'No major star' : '无主星';
  return stars.map((star) => {
    const gloss = language === 'en' && STAR_GLOSS[star.name] ? ` ${STAR_GLOSS[star.name]}` : '';
    const bright = star.brightness ? `·${star.brightness}` : '';
    const mutagen = star.mutagen ? ` ${star.mutagen}` : '';
    return `${star.name}${gloss}${bright}${mutagen}`;
  }).join('、');
}

function orderedPalaces(ziwei) {
  return BRANCH_ORDER.map((branch) => ziwei.palaces.find((palace) => palace.branch === branch)).filter(Boolean);
}

export function surroundedPalaces(ziwei, name) {
  const ordered = orderedPalaces(ziwei);
  const index = ordered.findIndex((palace) => palace.name === name);
  if (index < 0) return [];
  return [0, 4, 6, 8].map((step) => ordered[(index + step) % 12]);
}

function scoreRows(chart, t, elementNames) {
  return elementNames.map((name) => {
    const score = chart.strength?.scores?.[name] ?? 0;
    const count = chart.counts?.[name] ?? 0;
    return { name, score, count };
  });
}

export function readingHTML({ chart, ziwei, t, escapeHTML, elementNames }) {
  const rows = scoreRows(chart, t, elementNames);
  const max = Math.max(...rows.map((row) => row.score), 1);
  const words = ['chartMetal', 'chartWood', 'chartWater', 'chartFire', 'chartEarth'];
  const pillarRows = [
    ['yearPillar', 'year'],
    ['monthPillar', 'month'],
    ['dayPillar', 'day'],
    ['hourPillar', 'hour'],
  ];
  const ziweiBlock = ziwei?.available
    ? `<section class="chart-block" id="ziwei-summary"><h3>${t('ziweiTitle')}</h3><p class="chart-meta">${escapeHTML(ziwei.fiveElementsClass)} · ${t('soulStar')} ${escapeHTML(ziwei.soul)} · ${t('bodyStar')} ${escapeHTML(ziwei.body)} · ${escapeHTML(ziwei.shichen)} ${escapeHTML(ziwei.timeRange)}</p><ol class="ziwei-list">${ziwei.palaces.map((palace) => `<li><b>${escapeHTML(palace.name)}</b> <small>${escapeHTML(palace.stem)}${escapeHTML(palace.branch)}</small> ${escapeHTML(starsLine(palace.major, 'zh'))}</li>`).join('')}</ol><p class="chart-note">${t('ziweiEngineNote')}</p></section>`
    : `<section class="chart-block"><h3>${t('ziweiTitle')}</h3><p class="chart-note">${t('genderNeeded')}</p></section>`;
  return `<div class="card-topline"><span>${t('chartsKicker')}</span><span>✦</span></div>
    <section class="chart-block" id="bazi-summary"><h3>${t('baziTitle')}</h3>
      <div class="time-pair"><div><small>${t('localTime')}</small><b>${escapeHTML(chart.local.label)}</b><em>${escapeHTML(chart.local.offset)}</em></div><div><small>${t('beijingTime')}</small><b>${escapeHTML(chart.beijing.label)}</b><em>Asia/Shanghai · ${escapeHTML(chart.beijing.offset)}</em></div></div>
      <div class="solar-note"><small>${t('trueSolar')}</small><b>${escapeHTML(chart.trueSolar.label)}</b><em>${chart.pillarBasis === 'true-solar-v1' ? t('trueSolarUsed') : t('trueSolarNote')}</em></div>
      <div class="pillar-grid">${pillarRows.map(([label, key]) => `<div class="pillar-cell"><small>${t(label)}</small><b>${escapeHTML(chart.pillars[key])}</b><em>${escapeHTML(chart.tenGods[key])} · ${escapeHTML(chart.naYin[key])}</em></div>`).join('')}</div>
      <div class="element-bars">${rows.map((row, index) => `<div class="element-row"><span>${row.name}</span><span>${t(words[index])}</span><div class="element-track"><div style="width:${Math.min(100, row.score / max * 100)}%"></div></div><span>${row.score.toFixed(1)}</span></div>`).join('')}</div>
      <p class="dominant-line">${t('strongestLine', { element: chart.dominant })}</p>
      <p class="chart-note">${t('strengthNote')}</p>
    </section>
    ${ziweiBlock}
    <p class="journey-invite" lang="zh-CN">探索你的人生旅程</p>
    <p class="journey-invite-en">${t('journeyInviteEn')}</p>
    <button class="primary-button enter-button" type="button" data-action="confirm-entry"><span>${t('mindJourney')}</span></button>
    <button class="text-button" type="button" data-action="edit-birth">${t('recalculate')}</button>`;
}

function palaceCard(palace, language, escapeHTML, selected) {
  const gloss = language === 'en' ? ` ${PALACE_GLOSS[palace.name] || ''}` : '';
  return `<button type="button" class="ziwei-cell${selected === palace.name ? ' is-selected' : ''}${palace.isBody ? ' is-body' : ''}" data-palace="${escapeHTML(palace.name)}" style="grid-area:${BRANCH_AREA[palace.branch]}"><small>${escapeHTML(palace.stem)}${escapeHTML(palace.branch)} · ${escapeHTML(palace.name)}${gloss}</small><b>${escapeHTML(starsLine(palace.major, language))}</b><em>${escapeHTML(palace.minor.slice(0, 4).map((star) => star.name).join(' '))}</em></button>`;
}

export function baziSpaceHTML({ chart, t, escapeHTML, consultHTML }) {
  const keys = ['year', 'month', 'day', 'hour'];
  const labels = ['yearPillar', 'monthPillar', 'dayPillar', 'hourPillar'];
  const hidden = keys.map((key, index) => `<li><b>${t(labels[index])} ${escapeHTML(chart.pillars[key])}</b> ${escapeHTML(chart.hidden[key].map((item) => `${item.stem} ${item.god}`).join(' · '))} · ${escapeHTML(chart.naYin[key])}</li>`).join('');
  const luck = chart.luck
    ? `<p>${t('luckDirection', { direction: chart.luck.forward ? t('luckForward') : t('luckBackward'), start: chart.luck.start })}</p><ol class="luck-list">${chart.luck.cycles.map((cycle) => `<li>${escapeHTML(cycle.ganZhi)} · ${cycle.startAge}${t('yearsOld')} · ${cycle.startYear}–${cycle.endYear}</li>`).join('')}</ol>`
    : `<p>${t('genderNeeded')}</p>`;
  return `<button class="icon-button panel-close" data-action="close-space" aria-label="${t('close')}"><i data-lucide="x"></i></button>
    <p class="eyebrow">${t('baziSpaceKicker')}</p>
    <h2 id="system-title">${t('baziTitle')}</h2>
    <p class="panel-intro">${t('baziGuidance')}</p>
    <div class="pillar-grid">${keys.map((key, index) => `<div class="pillar-cell"><small>${t(labels[index])}</small><b>${escapeHTML(chart.pillars[key])}</b><em>${escapeHTML(chart.tenGods[key])}</em></div>`).join('')}</div>
    <h3>${t('hiddenStems')}</h3><ul class="detail-list">${hidden}</ul>
    <p class="chart-note">${t('voidNote', { day: chart.voids.day, year: chart.voids.year })}</p>
    <h3>${t('luckTitle')}</h3>${luck}
    <div class="guidance"><h3>${t('guidanceTitle')}</h3><p>${t('baziGuideBody')}</p><p class="chart-note">${t('notAdvice')}</p></div>
    ${consultHTML}`;
}

export function ziweiSpaceHTML({ ziwei, selected = '命宫', t, escapeHTML, language, consultHTML, horoscope }) {
  if (!ziwei?.available) {
    return `<button class="icon-button panel-close" data-action="close-space" aria-label="${t('close')}"><i data-lucide="x"></i></button><h2 id="system-title">${t('ziweiTitle')}</h2><p>${t('genderNeeded')}</p>`;
  }
  const focus = ziwei.palaces.find((palace) => palace.name === selected) || ziwei.palaces.find((palace) => palace.name === '命宫');
  const around = surroundedPalaces(ziwei, focus.name).map((palace) => palace.name).join(' · ');
  const cells = BRANCH_GRID.map((branch) => ziwei.palaces.find((palace) => palace.branch === branch)).filter(Boolean);
  const horo = horoscope ? `<p class="chart-meta">${t('horoscopeLine', { date: horoscope.date, decadal: horoscope.decadal, yearly: horoscope.yearly })}</p><label class="horoscope-year">${t('horoscopeYear')}<input name="horoscopeYear" type="number" min="1900" max="2100" value="${escapeHTML(String(horoscope.date).slice(0, 4))}" /></label>` : '';
  return `<button class="icon-button panel-close" data-action="close-space" aria-label="${t('close')}"><i data-lucide="x"></i></button>
    <p class="eyebrow">${t('ziweiSpaceKicker')}</p>
    <h2 id="system-title">${t('ziweiTitle')}</h2>
    <p class="panel-intro">${t('ziweiGuidance')}</p>
    <p class="chart-meta">${escapeHTML(ziwei.lunarDate)} · ${escapeHTML(ziwei.fiveElementsClass)} · ${t('soulStar')} ${escapeHTML(ziwei.soul)} · ${t('bodyStar')} ${escapeHTML(ziwei.body)} · ${escapeHTML(ziwei.shichen)}</p>
    ${horo}
    <div class="ziwei-grid">${cells.map((palace) => palaceCard(palace, language, escapeHTML, focus.name)).join('')}<div class="ziwei-core"><b>${escapeHTML(ziwei.fiveElementsClass)}</b><small>${t('mingShen', { ming: ziwei.soulBranch, shen: ziwei.bodyBranch })}</small></div></div>
    <ol class="ziwei-list ziwei-list-mobile">${ziwei.palaces.map((palace) => `<li><button type="button" data-palace="${escapeHTML(palace.name)}"><b>${escapeHTML(palace.name)}</b> ${escapeHTML(starsLine(palace.major, language))}</button></li>`).join('')}</ol>
    <article class="palace-detail"><h3>${escapeHTML(focus.name)}${language === 'en' && PALACE_GLOSS[focus.name] ? ` · ${PALACE_GLOSS[focus.name]}` : ''}</h3><p>${t('sanfang')}: ${escapeHTML(around)}</p><p>${t('majorStars')}: ${escapeHTML(starsLine(focus.major, language))}</p><p>${t('minorStars')}: ${escapeHTML(starsLine(focus.minor, language))}</p><p>${t('decadalRange')}: ${focus.decadal.range.join('–')}</p></article>
    <p class="chart-note">${t('transformNote')}: ${escapeHTML(ziwei.transformations.map((item) => `${item.star}${item.mutagen}·${item.palace}`).join('  '))}</p>
    <p class="chart-note">${language === 'en' ? Object.entries(BRIGHT_GLOSS).map(([zh, en]) => `${zh} ${en}`).join(' · ') : ''} ${language === 'en' ? Object.entries(MUTAGEN_GLOSS).map(([zh, en]) => `${zh} ${en}`).join(' · ') : ''}</p>
    <div class="guidance"><h3>${t('guidanceTitle')}</h3><p>${t('ziweiGuideBody')}</p><p class="chart-note">${t('notAdvice')}</p></div>
    ${consultHTML}`;
}

export function consultHTML({ t, draft, timezone, system, escapeHTML }) {
  const saved = draft
    ? `<p class="unsent" data-consult-status="unsent">${t('unsent')}</p><pre class="draft-preview">${escapeHTML(draft.topic || '')}</pre><div class="modal-actions"><button class="secondary-button" type="button" data-action="export-consult">${t('exportDraft')}</button><button class="text-button" type="button" data-action="delete-consult">${t('deleteDraft')}</button></div>`
    : `<p class="unsent" data-consult-status="unsent">${t('unsent')}</p>`;
  return `<form id="consult-form" class="consult-form" autocomplete="off">
      <h3>${t('consultTitle')}</h3>
      <p class="chart-note">${t('consultIntro')}</p>
      <label>${t('consultSystem')}<select name="system"><option value="bazi"${system === 'bazi' ? ' selected' : ''}>${t('baziTitle')}</option><option value="ziwei"${system === 'ziwei' ? ' selected' : ''}>${t('ziweiTitle')}</option></select></label>
      <label>${t('consultTopic')}<textarea name="topic" maxlength="500" required>${escapeHTML(draft?.topic || '')}</textarea></label>
      <label>${t('consultLanguage')}<select name="language"><option value="zh"${draft?.language !== 'en' ? ' selected' : ''}>中文</option><option value="en"${draft?.language === 'en' ? ' selected' : ''}>English</option></select></label>
      <label>${t('timezone')}<input name="timezone" type="text" value="${escapeHTML(timezone || '')}" maxlength="80" required /></label>
      <label>${t('consultTimes')}<textarea name="times" maxlength="500">${escapeHTML(draft?.times || '')}</textarea></label>
      <button class="primary-button" type="submit">${t('consultSave')}</button>
      ${saved}
    </form>`;
}
