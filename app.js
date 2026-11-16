'use strict';
/* Трекер «План на 6 месяцев» · 16.11.2026 → 16.05.2027
   Данные: localStorage на устройстве + (по желанию) секретный gist на GitHub для синхронизации. */

// ───────────────────────── План (из документа) ─────────────────────────
const START = new Date(2026, 10, 16);           // понедельник, день 1
const TOTAL_DAYS = 182;                          // 26 недель
const TOTAL_WEEKS = 26;
const DAY_MS = 86400000;

const MONTHS = [
  { n: 1, name: 'Фундамент', w: [1, 4], subs: 700, proj: 2, reels: 3, reward: false,
    tasks: [
      'Подъём и отбой в одно время 7 дней в неделю',
      'Будильники на 3 приёма пищи и 2 перекуса',
      '3 силовые в неделю по 45 минут',
      '4–6 занятий с тренером на технику (по желанию)',
      'Терапевт и анализы: ОАК, ферритин, витамин D, ТТГ',
      'Первый замер веса и состава тела',
      'Переписать шапку профиля',
      'Сделать 3 закрепа',
      'Выбрать 3 постоянные рубрики',
      'Банк идей на 30 проектов и рилсов',
      'Лимиты экранного времени и режим «Сон» в 22:30',
      'Рассказать про план 1–2 близким',
      'Договориться о помощи в быту на вт–чт',
      'Проекты № 1 и № 2',
    ] },
  { n: 2, name: 'Ритм', w: [5, 8], subs: 1500, proj: 4, reels: 4, reward: true,
    tasks: [
      'Контент на 31.12–02.01 смонтирован и запланирован',
      'Проект на новогодний тренд',
      'Голос за кадром — 1 рилс в неделю',
      'Постепенно прибавлять вес в упражнениях',
      'Отдых 31.12–02.01 без чувства вины',
      'Проекты № 3 и № 4',
    ] },
  { n: 3, name: 'Рост', w: [9, 13], subs: 3000, proj: 7, reels: 4, reward: false,
    tasks: [
      'Найти 3 рилса, которые привели больше всего подписчиков',
      'Лид-магнит: гайд с промптами',
      'Автоответ в директ по кодовому слову',
      '1–2 коллаборации с авторами ниши',
      'Лицо в сторис 2 раза в неделю',
      'Повторный замер состава тела',
      'Проекты № 5–7',
    ] },
  { n: 4, name: 'Масштаб', w: [14, 17], subs: 5000, proj: 10, reels: 5, reward: true,
    tasks: [
      'Запустить рубрику «как это сделано»',
      '2–3 коллаборации',
      'Проект для бренда или клиента',
      'Новая программа тренировок, 3–4 раза в неделю',
      'Проекты № 8–10',
    ] },
  { n: 5, name: 'Ускорение', w: [18, 21], subs: 7500, proj: 13, reels: 5, reward: false,
    tasks: [
      'То, что работает, — вдвое чаще',
      '1 рилс в неделю с собой в кадре (если комфортно)',
      'Портфолио из лучших работ',
      'Пересдать анализы, если были отклонения',
      'Проекты № 11–13',
    ] },
  { n: 6, name: 'Финиш', w: [22, 26], subs: 10000, proj: 15, reels: 5, reward: true,
    tasks: [
      'Итоговый кейс «15 нейровидео за 6 месяцев»',
      'Проекты № 14 и № 15',
      'Финальный замер 16.05',
      'Разбор полугодия',
      'Цели на следующие 6 месяцев',
    ] },
];
MONTHS.forEach(m => { m.startIdx = (m.w[0] - 1) * 7; m.endIdx = m.w[1] * 7 - 1; });

const PROJECT_TASK = {
  1: ['Проект: идея и сценарий', 'блок фокуса 2–3 ч, телефон в другой комнате'],
  2: ['Проект: генерация', 'блок фокуса 2–3 ч'],
  3: ['Проект: генерация и монтаж', 'блок фокуса 2–3 ч'],
  4: ['Проект: монтаж и доводка', 'блок фокуса 2–3 ч'],
  5: ['Проект: публикация и «как это сделано»', 'выложить работу и записать процесс'],
  6: ['Муза: референсы и банк идей', '1–2 часа насмотренности'],
  0: ['Монтаж 2 рилсов вперёд', 'и поставить их на отложенную публикацию'],
};
const MINIMUM = [
  { id: 'm_eat', t: 'Поесть 3 раза' },
  { id: 'm_work', t: '1 сторис или 10 минут над проектом' },
  { id: 'm_move', t: '10 минут прогулки или растяжки' },
  { id: 'm_bed', t: 'Лечь вовремя' },
];
const STAGES = ['Идея', 'Сценарий', 'Генерация', 'Монтаж', 'Опубликован'];
const DOW_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

// ───────────────────────── Даты ─────────────────────────
const pad = n => String(n).padStart(2, '0');
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const dateAt = idx => addDays(START, idx);
const idxOf = d => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - START) / DAY_MS);
const weekOfIdx = i => Math.floor(i / 7) + 1;
const monthOfWeek = w => MONTHS.find(m => w >= m.w[0] && w <= m.w[1]) || (w < 1 ? MONTHS[0] : MONTHS[5]);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtShort = d => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '');
const fmtLong = d => d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const todayIdxRaw = () => idxOf(new Date());
const todayIdx = () => clamp(todayIdxRaw(), 0, TOTAL_DAYS - 1);

// ───────────────────────── Состояние ─────────────────────────
const KEY = 'p6m-tracker-v1';
const SYNC_KEY = 'p6m-sync-v1';

function defaults() {
  return {
    v: 1,
    goals: { u: 0, subsA: 242, subsB: 10000, weightA: 47.5, weightB: 52, muscleA: 15, muscleB: 22, projB: 15 },
    settings: { u: 0, wake: '08:00', bed: '23:00' },
    days: {}, weeks: {}, months: {}, projects: {},
  };
}
function readLS(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function writeLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

let state = Object.assign(defaults(), readLS(KEY) || {});
['goals', 'settings'].forEach(k => { state[k] = Object.assign(defaults()[k], state[k] || {}); });
let sync = readLS(SYNC_KEY) || {};
const ui = { tab: 'today', day: todayIdx(), week: weekOfIdx(todayIdx()), month: monthOfWeek(weekOfIdx(todayIdx())).n };
try { Object.assign(ui, JSON.parse(sessionStorage.getItem('p6m-ui')) || {}); } catch (e) {}

function persist() {
  writeLS(KEY, state);
  scheduleSync();
}
function rec(coll, k) {
  if (!state[coll][k]) state[coll][k] = { u: 0 };
  return state[coll][k];
}
function touch(r) { r.u = Date.now(); }

// ───────────────────────── Расчёты ─────────────────────────
const G = () => state.goals;

// Кривая подписчиков: доля пути от A к B в конце каждого месяца (по исходному плану 242 → 10 000)
const SUBS_CURVE = [[0, 0]].concat(MONTHS.map(m => [m.endIdx, (m.subs - 242) / (10000 - 242)]));
function lerpCurve(curve, i) {
  if (i <= curve[0][0]) return curve[0][1];
  for (let k = 1; k < curve.length; k++) {
    const [x1, y1] = curve[k - 1], [x2, y2] = curve[k];
    if (i <= x2) return y1 + (y2 - y1) * (i - x1) / (x2 - x1);
  }
  return curve[curve.length - 1][1];
}
const planSubs = i => Math.round(G().subsA + (G().subsB - G().subsA) * lerpCurve(SUBS_CURVE, i));
const planWeight = i => +(G().weightA + (G().weightB - G().weightA) * clamp(i, 0, 181) / 181).toFixed(1);
const planMuscle = i => +(G().muscleA + (G().muscleB - G().muscleA) * clamp(i, 0, 181) / 181).toFixed(1);
const PROJ_CURVE = [[0, 0]].concat(MONTHS.map(m => [m.endIdx, m.proj / 15]));
const planProjects = i => Math.floor(G().projB * lerpCurve(PROJ_CURVE, i) + 1e-9);

function reelDay(dow, m) {
  const days = [1, 3, 5];
  if (m >= 2) days.push(6);
  if (m >= 4) days.push(4);
  return days.includes(dow);
}
function dayItems(i) {
  const d = dateAt(i), dow = d.getDay(), m = monthOfWeek(weekOfIdx(i)).n, s = state.settings;
  const morning = [
    { id: 'wake', t: `Подъём в ${s.wake}` },
    { id: 'nophone', t: '30 минут без телефона' },
    { id: 'breakfast', t: 'Завтрак в течение часа' },
    { id: 'top3', t: '3 задачи дня записаны' },
  ];
  const [pt, ph] = PROJECT_TASK[dow];
  const day = [{ id: 'focus', t: pt, h: ph }];
  if ([1, 3, 5].includes(dow)) day.push({ id: 'strength', t: 'Силовая тренировка, 45 мин' });
  else if (dow === 2 || dow === 4) day.push({ id: 'walk', t: 'Прогулка 30 мин' });
  else if (dow === 6) day.push({ id: 'walk', t: 'Прогулка или отдых' });
  if (dow === 0) {
    day.push({ id: 'weigh', t: 'Замер веса утром натощак', h: 'внеси цифры во вкладке «Неделя»' });
    day.push({ id: 'review', t: 'Разбор недели, 20 мин' });
    day.push({ id: 'mealprep', t: 'Заготовка еды на неделю' });
  }
  const evening = [];
  if (reelDay(dow, m)) evening.push({ id: 'reel', t: 'Рилс опубликован' });
  evening.push(
    { id: 'stories', t: 'Сторис' },
    { id: 'insta', t: 'Instagram «как автор», 30 мин', h: 'публикация, ответы, 10 комментариев в нише' },
    { id: 'snack', t: 'Перекус перед сном' },
    { id: 'phoneout', t: 'Телефон вне спальни в 22:30' },
    { id: 'bed', t: `Сон в ${s.bed}` },
  );
  return [{ title: 'Утро', items: morning }, { title: 'День', items: day, meals: true }, { title: 'Вечер', items: evening }];
}
function dayData(i) { return state.days[keyOf(dateAt(i))] || {}; }
function dayPct(i) {
  const r = dayData(i), c = r.c || {};
  const items = dayItems(i).flatMap(s => s.items);
  const done = items.filter(x => c[x.id]).length + Math.min(r.meals || 0, 5) / 5;
  return done / (items.length + 1);
}
function minDone(i) { const c = dayData(i).c || {}; return MINIMUM.every(x => c[x.id]); }
function dayStatus(i) {
  const t = todayIdxRaw();
  if (i > t) return 'future';
  const p = dayPct(i);
  if (p >= 0.7) return 'good';
  if (minDone(i)) return 'min';
  if (p >= 0.3) return 'part';
  return i < t ? 'miss' : 'none';
}
function streak() {
  let i = todayIdx();
  if (dayStatus(i) === 'none') i--;
  let n = 0;
  for (; i >= 0; i--) { const s = dayStatus(i); if (s === 'good' || s === 'min' || s === 'part') n++; else break; }
  return n;
}
function weekStats(w) {
  const t = todayIdxRaw(), m = monthOfWeek(w);
  const o = { reels: 0, reelsPlan: 0, strength: 0, good: 0, min: 0, part: 0, miss: 0, bed: 0, wake: 0, meals: 0, mealDays: 0, passed: 0 };
  for (let k = 0; k < 7; k++) {
    const i = (w - 1) * 7 + k, d = dateAt(i), c = dayData(i).c || {};
    if (reelDay(d.getDay(), m.n)) o.reelsPlan++;
    if (i > t) continue;
    o.passed++;
    if (c.reel) o.reels++;
    if (c.strength) o.strength++;
    if (c.bed || c.m_bed) o.bed++;
    if (c.wake) o.wake++;
    const r = dayData(i);
    if (r.meals != null) { o.meals += r.meals; o.mealDays++; }
    const s = dayStatus(i);
    if (o[s] != null) o[s]++;
  }
  return o;
}
function publishedBy(idx) {
  return Object.values(state.projects).filter(p => p.stage === 4 && (!p.date || idxOf(fromKey(p.date)) <= idx)).length;
}
function publishedTotal() { return Object.values(state.projects).filter(p => p.stage === 4).length; }
function lastWeekValue(field, uptoWeek = TOTAL_WEEKS) {
  for (let w = uptoWeek; w >= 1; w--) {
    const r = state.weeks['W' + w];
    if (r && r[field] != null && r[field] !== '') return { w, v: +r[field] };
  }
  return null;
}
function factSeries(field) {
  const out = [];
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const r = state.weeks['W' + w];
    if (r && r[field] != null && r[field] !== '') out.push({ i: w * 7 - 1, v: +r[field] });
  }
  return out;
}

// ───────────────────────── Утилиты вывода ─────────────────────────
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v, d = 0) => (v == null || v === '' || isNaN(v)) ? '—' : (+v).toLocaleString('ru-RU', { maximumFractionDigits: d, minimumFractionDigits: 0 });
function delta(fact, plan, higherIsBetter = true, digits = 0) {
  if (fact == null || plan == null || plan === 0) return '';
  const diff = fact - plan;
  const pct = Math.round(diff / plan * 100);
  if (Math.abs(diff) < (digits ? 0.15 : 1) || Math.abs(pct) < 3) return '<span class="tag eq">по плану</span>';
  const good = higherIsBetter ? diff > 0 : diff < 0;
  const sign = diff > 0 ? '+' : '−';
  return `<span class="tag ${good ? 'up' : 'down'}">${sign}${num(Math.abs(diff), digits)}</span>`;
}
function ring(p) {
  const r = 32, c = 2 * Math.PI * r, off = c * (1 - clamp(p, 0, 1));
  return `<svg class="ring" viewBox="0 0 76 76" aria-hidden="true"><circle class="bg" cx="38" cy="38" r="${r}"/><circle class="fg" cx="38" cy="38" r="${r}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 38 38)"/><text x="38" y="45" text-anchor="middle">${Math.round(p * 100)}%</text></svg>`;
}
function checkRow(path, checked, label, hint, extraCls = '') {
  return `<label class="check ${checked ? 'done' : ''} ${extraCls}"><input type="checkbox" data-bind="${path}" ${checked ? 'checked' : ''}><span class="lbl"><span>${esc(label)}</span>${hint ? `<small>${esc(hint)}</small>` : ''}</span></label>`;
}
function textInput(path, val, ph = '', cls = 'inp', type = 'text') {
  return `<input class="${cls}" type="${type}" data-bind="${path}" value="${esc(val)}" placeholder="${esc(ph)}" ${type === 'num' ? '' : ''}>`;
}
function numInput(path, val, ph = '') {
  return `<input class="inp" type="text" inputmode="decimal" data-bind="${path}" data-type="num" value="${val == null ? '' : esc(String(val).replace('.', ','))}" placeholder="${esc(ph)}">`;
}
function area(path, val, ph = '') {
  return `<textarea class="inp" data-bind="${path}" placeholder="${esc(ph)}" rows="2">${esc(val)}</textarea>`;
}

// ───────────────────────── Экраны ─────────────────────────
function renderToday() {
  const i = ui.day, d = dateAt(i), k = keyOf(d), r = dayData(i), c = r.c || {};
  const w = weekOfIdx(i), m = monthOfWeek(w), t = todayIdxRaw();
  const isToday = i === t;
  const p = dayPct(i), st = streak();
  let html = `
  <div class="navhead">
    <button class="arrow" data-act="day" data-d="-1" ${i <= 0 ? 'disabled' : ''} aria-label="Предыдущий день">‹</button>
    <div class="t"><b>${cap(fmtLong(d))}</b><small>День ${i + 1} из ${TOTAL_DAYS} · неделя ${w} · месяц ${m.n} «${m.name}»</small></div>
    <button class="arrow" data-act="day" data-d="1" ${i >= TOTAL_DAYS - 1 ? 'disabled' : ''} aria-label="Следующий день">›</button>
  </div>
  ${!isToday && t >= 0 && t < TOTAL_DAYS ? '<button class="jump" data-act="gotoday">Вернуться к сегодня</button>' : ''}`;

  if (t < 0 && isToday === false && i === 0) html += `<div class="banner good">План стартует 16 ноября. Можно уже осмотреться.</div>`;
  if (isToday && i > 0 && dayStatus(i - 1) === 'miss') {
    html += `<div class="banner">Вчера не получилось — это нормально. Правило: не пропускай дважды. Сегодня сделай хотя бы минимум.</div>`;
  }

  html += `<section class="card"><div class="summary">${ring(r.minMode ? (MINIMUM.filter(x => c[x.id]).length / 4) : p)}
    <div class="stats">
      <div class="stat"><b>${st}</b><span>дней подряд</span></div>
      <div class="stat"><b>${num(publishedTotal())} / ${G().projB}</b><span>проектов готово</span></div>
      <div class="stat"><b>${num(lastWeekValue('subs')?.v ?? G().subsA)}</b><span>подписчиков</span></div>
      <div class="stat"><b>${num(lastWeekValue('weight')?.v ?? G().weightA, 1)} кг</b><span>вес</span></div>
    </div></div></section>`;

  html += `<section class="card"><label class="switch"><span>Плохой день — только минимум<small>Минимум засчитывает день и сохраняет цепочку</small></span><input type="checkbox" data-bind="days.${k}.minMode" ${r.minMode ? 'checked' : ''}></label></section>`;

  if (r.minMode) {
    const n = MINIMUM.filter(x => c[x.id]).length;
    html += `<section class="card minlist"><h3>Минимум <span class="count">${n} / 4</span></h3>${MINIMUM.map(x => checkRow(`days.${k}.c.${x.id}`, c[x.id], x.t)).join('')}</section>`;
  } else {
    for (const sec of dayItems(i)) {
      const n = sec.items.filter(x => c[x.id]).length;
      html += `<section class="card"><h3>${sec.title} <span class="count">${n} / ${sec.items.length}</span></h3>`;
      html += sec.items.map(x => checkRow(`days.${k}.c.${x.id}`, c[x.id], x.t, x.h)).join('');
      if (sec.meals) {
        const meals = r.meals || 0;
        html += `<div class="meals"><span>Приёмы пищи<small class="hint" style="display:block;margin:0">3 еды + 2 перекуса</small></span><div class="dots">${[1, 2, 3, 4, 5].map(n2 => `<button data-act="meals" data-k="${k}" data-n="${n2}" class="${meals >= n2 ? 'on' : ''}" aria-label="${n2}">${n2}</button>`).join('')}</div></div>`;
      }
      html += `</section>`;
    }
  }

  const top = r.top || [];
  html += `<section class="card"><h3>3 главные задачи дня</h3><div class="top3">${[0, 1, 2].map(n2 => `<label><b>${n2 + 1}</b>${textInput(`days.${k}.top.${n2}`, top[n2], n2 === 0 ? 'Самое важное' : '')}</label>`).join('')}</div></section>`;

  html += `<section class="card"><h3>Энергия</h3><div class="energy">${[1, 2, 3, 4, 5].map(n2 => `<button data-act="energy" data-k="${k}" data-n="${n2}" class="${r.energy === n2 ? 'on' : ''}">${n2}</button>`).join('')}</div><div class="energy-cap"><span>нет сил</span><span>полна сил</span></div>
  <label class="field"><span>Заметка: что получилось, что помешало</span>${area(`days.${k}.note`, r.note)}</label></section>`;
  return html;
}

function renderWeek() {
  const w = ui.week, m = monthOfWeek(w), s0 = (w - 1) * 7, end = s0 + 6;
  const st = weekStats(w), r = state.weeks['W' + w] || {}, t = todayIdxRaw();
  let html = `
  <div class="navhead">
    <button class="arrow" data-act="week" data-d="-1" ${w <= 1 ? 'disabled' : ''} aria-label="Предыдущая неделя">‹</button>
    <div class="t"><b>Неделя ${w} из ${TOTAL_WEEKS}</b><small>${fmtShort(dateAt(s0))} – ${fmtShort(dateAt(end))} · месяц ${m.n} «${m.name}»</small></div>
    <button class="arrow" data-act="week" data-d="1" ${w >= TOTAL_WEEKS ? 'disabled' : ''} aria-label="Следующая неделя">›</button>
  </div>
  ${weekOfIdx(todayIdx()) !== w ? '<button class="jump" data-act="gothisweek">К текущей неделе</button>' : ''}`;

  html += `<section class="card"><h3>Дни недели</h3><div class="strip">${[0, 1, 2, 3, 4, 5, 6].map(k => {
    const i = s0 + k, d = dateAt(i), s = dayStatus(i);
    return `<button class="${s} ${i === t ? 'today' : ''}" data-act="openday" data-i="${i}"><small>${DOW_SHORT[d.getDay()]}</small><b>${d.getDate()}</b></button>`;
  }).join('')}</div>
  <div class="legend"><span><i style="background:var(--good)"></i>по плану (70%+)</span><span><i style="background:var(--min)"></i>минимум</span><span><i style="background:var(--part)"></i>частично</span><span><i style="background:var(--miss)"></i>пропуск</span></div></section>`;

  const avgMeals = st.mealDays ? st.meals / st.mealDays : null;
  const row = (name, plan, fact, hib = true, dig = 0) => `<tr><td>${name}</td><td>${plan}</td><td class="f">${fact}${typeof fact === 'number' && typeof plan === 'number' && st.passed === 7 ? delta(fact, plan, hib, dig) : ''}</td></tr>`;
  html += `<section class="card"><h3>План / факт недели <span class="count">${st.passed < 7 ? `прошло дней: ${Math.max(st.passed, 0)}` : 'неделя завершена'}</span></h3>
  <table class="pf"><thead><tr><th></th><th>План</th><th>Факт</th></tr></thead><tbody>
  ${row('Рилсы', st.reelsPlan, st.reels)}
  ${row('Силовые тренировки', 3, st.strength)}
  ${row('Дни по плану', 7, st.good)}
  ${row('Дни «минимум»', '—', st.min)}
  ${row('Пропуски', 0, st.miss, false)}
  ${row('Подъём вовремя', 7, st.wake)}
  ${row('Сон вовремя', 7, st.bed)}
  <tr><td>Еда, приёмов в день</td><td>5</td><td class="f">${avgMeals == null ? '—' : num(avgMeals, 1)}</td></tr>
  </tbody></table></section>`;

  const pS = planSubs(end), pW = planWeight(end), pM = planMuscle(end), pP = planProjects(end);
  const fP = publishedBy(end);
  html += `<section class="card"><h3>Воскресный замер</h3>
  <table class="pf"><thead><tr><th></th><th>План</th><th>Факт</th></tr></thead><tbody>
  <tr><td>Подписчики</td><td>${num(pS)}</td><td>${numInput(`weeks.W${w}.subs`, r.subs, '')}</td></tr>
  <tr><td>Вес, кг</td><td>${num(pW, 1)}</td><td>${numInput(`weeks.W${w}.weight`, r.weight, '')}</td></tr>
  <tr><td>Мышцы, %</td><td>${num(pM, 1)}</td><td>${numInput(`weeks.W${w}.muscle`, r.muscle, '')}</td></tr>
  <tr><td>Проектов готово</td><td>${pP}</td><td class="f">${fP}${end <= t ? delta(fP, pP || 0.0001) : ''}</td></tr>
  </tbody></table>
  ${r.subs != null ? `<p class="hint">Подписчики: ${num(r.subs)} против плана ${num(pS)} ${delta(+r.subs, pS)}</p>` : ''}
  ${r.weight != null ? `<p class="hint">Вес: ${num(r.weight, 1)} кг против ${num(pW, 1)} ${delta(+r.weight, pW, true, 1)}</p>` : ''}
  <p class="hint">Проекты считаются сами — по статусу «Опубликован» во вкладке «Цели».</p></section>`;

  const next = r.next || [];
  html += `<section class="card"><h3>Разбор недели</h3>
  <label class="field"><span>Что сработало (какой рилс зашёл и почему)</span>${area(`weeks.W${w}.worked`, r.worked)}</label>
  <label class="field"><span>Что помешало</span>${area(`weeks.W${w}.blocked`, r.blocked)}</label>
  <label class="field"><span>Одно изменение на следующую неделю</span>${area(`weeks.W${w}.change`, r.change)}</label>
  <div class="field"><span>3 главные задачи следующей недели</span><div class="top3">${[0, 1, 2].map(n => `<label><b>${n + 1}</b>${textInput(`weeks.W${w}.next.${n}`, next[n])}</label>`).join('')}</div></div>
  </section>`;

  const prev = state.weeks['W' + (w - 1)];
  if (prev && (prev.next || []).some(Boolean)) {
    html += `<section class="card"><h3>Задачи на эту неделю (из прошлого разбора)</h3>${prev.next.map((x, n) => x ? checkRow(`weeks.W${w}.prevDone.${n}`, (r.prevDone || {})[n], x) : '').join('')}</section>`;
  }
  return html;
}

function renderMonth() {
  const m = MONTHS[ui.month - 1], r = state.months['M' + m.n] || {}, t = todayIdxRaw();
  const tasks = r.tasks || {};
  const doneN = m.tasks.filter((_, n) => tasks[n]).length;
  let html = `
  <div class="navhead">
    <button class="arrow" data-act="month" data-d="-1" ${m.n <= 1 ? 'disabled' : ''} aria-label="Предыдущий месяц">‹</button>
    <div class="t"><b>Месяц ${m.n} · ${m.name}</b><small>${fmtShort(dateAt(m.startIdx))} – ${fmtShort(dateAt(m.endIdx))} · недели ${m.w[0]}–${m.w[1]}</small></div>
    <button class="arrow" data-act="month" data-d="1" ${m.n >= 6 ? 'disabled' : ''} aria-label="Следующий месяц">›</button>
  </div>`;

  const subsF = lastWeekValue('subs', m.w[1]), weightF = lastWeekValue('weight', m.w[1]), musF = lastWeekValue('muscle', m.w[1]);
  const inMonth = x => x && x.w >= m.w[0];
  const pS = planSubs(m.endIdx), pW = planWeight(m.endIdx), pP = planProjects(m.endIdx), pM = planMuscle(m.endIdx);
  const fP = publishedBy(m.endIdx);
  const fmtF = (x, d = 0) => inMonth(x) ? `${num(x.v, d)}` : '—';
  html += `<section class="card"><h3>Контрольная точка ${fmtShort(dateAt(m.endIdx))}</h3>
  <table class="pf"><thead><tr><th></th><th>План</th><th>Факт</th></tr></thead><tbody>
  <tr><td>Подписчики</td><td>${num(pS)}</td><td class="f">${fmtF(subsF)}${inMonth(subsF) ? delta(subsF.v, planSubs(subsF.w * 7 - 1)) : ''}</td></tr>
  <tr><td>Проектов, всего</td><td>${pP}</td><td class="f">${m.startIdx <= t ? fP : '—'}${m.endIdx <= t ? delta(fP, pP) : ''}</td></tr>
  <tr><td>Вес, кг</td><td>${num(pW, 1)}</td><td class="f">${fmtF(weightF, 1)}${inMonth(weightF) ? delta(weightF.v, planWeight(weightF.w * 7 - 1), true, 1) : ''}</td></tr>
  <tr><td>Мышцы, %</td><td>${num(pM, 1)}</td><td class="f">${fmtF(musF, 1)}</td></tr>
  </tbody></table><p class="hint">Факт — последний воскресный замер в этом месяце. Отклонение сравнивается с планом на дату замера.</p></section>`;

  const agg = { reels: 0, reelsPlan: 0, strength: 0, strengthPlan: 0, good: 0, min: 0, miss: 0 };
  for (let w = m.w[0]; w <= m.w[1]; w++) {
    const s = weekStats(w);
    agg.reels += s.reels; agg.reelsPlan += s.reelsPlan; agg.strength += s.strength; agg.strengthPlan += 3;
    agg.good += s.good; agg.min += s.min; agg.miss += s.miss;
  }
  html += `<section class="card"><h3>Итоги месяца по дням</h3><div class="stats">
    <div class="stat"><b>${agg.reels} / ${agg.reelsPlan}</b><span>рилсов</span></div>
    <div class="stat"><b>${agg.strength} / ${agg.strengthPlan}</b><span>силовых</span></div>
    <div class="stat"><b>${agg.good}</b><span>дней по плану</span></div>
    <div class="stat"><b>${agg.min} · ${agg.miss}</b><span>минимум · пропуски</span></div>
  </div></section>`;

  html += `<section class="card"><h3>Задачи месяца <span class="count">${doneN} / ${m.tasks.length}</span></h3>${m.tasks.map((x, n) => checkRow(`months.M${m.n}.tasks.${n}`, tasks[n], x)).join('')}</section>`;

  if (m.reward) {
    html += `<section class="card"><h3>Награда ${m.n === 6 ? '(главная)' : `за ${m.n} месяца`}</h3>
    <label class="field"><span>Чем себя награжу</span>${textInput(`months.M${m.n}.reward`, r.reward, 'Впиши сама')}</label>
    ${checkRow(`months.M${m.n}.rewardDone`, r.rewardDone, 'Награда получена')}</section>`;
  }
  html += `<section class="card"><h3>Заметки месяца</h3>${area(`months.M${m.n}.note`, r.note, 'Выводы, идеи, что поменять')}</section>`;

  const curM = monthOfWeek(weekOfIdx(todayIdx())).n;
  html += `<section class="card mlist"><h3>Все месяцы</h3>${MONTHS.map(x => {
    const rr = state.months['M' + x.n] || {}, dn = x.tasks.filter((_, n) => (rr.tasks || {})[n]).length;
    return `<button data-act="openmonth" data-n="${x.n}" class="${x.n === curM ? 'cur' : ''}"><span class="num">${x.n}</span><span><b>${x.name}</b><small>${fmtShort(dateAt(x.startIdx))} – ${fmtShort(dateAt(x.endIdx))} · ${num(x.subs)} подп. · ${x.proj} проектов</small></span><span class="mini"><i style="width:${Math.round(dn / x.tasks.length * 100)}%"></i></span></button>`;
  }).join('')}</section>`;
  return html;
}

function goalBlock(name, a, b, cur, plan, unit, dig = 0, note = '', measured = true) {
  const span = b - a || 1;
  const p = clamp((cur - a) / span, 0, 1), pp = clamp((plan - a) / span, 0, 1);
  return `<div class="goal"><div class="goal-head"><b>${name}</b>${measured ? delta(cur, plan, true, dig) : '<span class="tag eq">нет замера</span>'}</div>
  <div class="goal-now">${num(cur, dig)}<small> ${unit} · цель ${num(b, dig)}</small></div>
  <div class="bar"><div class="fill" style="width:${(p * 100).toFixed(1)}%"></div><div class="plan" style="left:${(pp * 100).toFixed(1)}%" title="план на сегодня"></div></div>
  <div class="goal-foot"><span>старт ${num(a, dig)}</span><span>план на сегодня: ${num(plan, dig)}</span></div>${note ? `<p class="hint">${note}</p>` : ''}</div>`;
}

function chart({ title, plan, facts, dig = 0, unit = '' }) {
  const W = 340, H = 170, L = 38, R = 8, T = 10, B = 22;
  const xs = i => L + (W - L - R) * i / 181;
  const planPts = [];
  for (let i = 0; i <= 181; i += 7) planPts.push([i, plan(i)]);
  planPts.push([181, plan(181)]);
  const vals = planPts.map(p => p[1]).concat(facts.map(f => f.v));
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi === lo) { hi += 1; lo -= 1; }
  const padv = (hi - lo) * 0.08; lo -= padv; hi += padv;
  const ys = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const path = pts => pts.map((p, n) => `${n ? 'L' : 'M'}${xs(p[0]).toFixed(1)},${ys(p[1]).toFixed(1)}`).join('');
  const step = dig === 0 && hi - lo > 2000 ? 500 : dig === 0 ? 10 : 0.5;
  const ticks = [lo + padv, Math.round((lo + hi) / 2 / step) * step, hi - padv];
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">`;
  ticks.forEach(v => { s += `<line class="ax" x1="${L}" x2="${W - R}" y1="${ys(v)}" y2="${ys(v)}"/><text class="lab" x="${L - 4}" y="${ys(v) + 3}" text-anchor="end">${num(v, dig)}</text>`; });
  MONTHS.forEach(m => { s += `<text class="lab" x="${xs((m.startIdx + m.endIdx) / 2)}" y="${H - 6}" text-anchor="middle">М${m.n}</text>`; });
  const t = todayIdxRaw();
  if (t >= 0 && t <= 181) s += `<line class="nowl" x1="${xs(t)}" x2="${xs(t)}" y1="${T}" y2="${H - B}"/>`;
  s += `<path class="planl" d="${path(planPts)}"/>`;
  if (facts.length) {
    s += `<path class="factl" d="${path(facts.map(f => [f.i, f.v]))}"/>`;
    facts.forEach(f => { s += `<circle class="dot" cx="${xs(f.i)}" cy="${ys(f.v)}" r="3.5"><title>${num(f.v, dig)} ${unit}</title></circle>`; });
  }
  s += `</svg>`;
  return `<section class="card chart"><h3>${esc(title)}</h3>${s}<div class="legend"><span><i style="background:var(--muted)"></i>план</span><span><i style="background:var(--accent)"></i>факт (воскресные замеры)</span></div></section>`;
}

function heatmap() {
  const t = todayIdxRaw();
  let h = `<div class="heat"><span></span>`;
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const m = MONTHS.find(x => x.w[0] === w);
    h += `<span class="mlab">${m ? 'М' + m.n : ''}</span>`;
  }
  const rows = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  rows.forEach((name, k) => {
    h += `<span>${k % 2 === 0 ? name : ''}</span>`;
    for (let w = 1; w <= TOTAL_WEEKS; w++) {
      const i = (w - 1) * 7 + k;
      h += `<button class="${dayStatus(i)} ${i === t ? 'today' : ''}" data-act="openday" data-i="${i}" aria-label="${fmtShort(dateAt(i))}"></button>`;
    }
  });
  return h + '</div>';
}

function renderGoals() {
  const g = G(), t = todayIdx();
  const subs = lastWeekValue('subs'), weight = lastWeekValue('weight'), mus = lastWeekValue('muscle');
  let html = `<section class="card"><h3>Точка А → точка Б</h3>
    ${goalBlock('Подписчики в Instagram', g.subsA, g.subsB, subs ? subs.v : g.subsA, planSubs(subs ? subs.w * 7 - 1 : t), 'подп.', 0, '', !!subs)}
    ${goalBlock('Проекты по нейровидео', 0, g.projB, publishedTotal(), planProjects(t), 'готово')}
    ${goalBlock('Вес', g.weightA, g.weightB, weight ? weight.v : g.weightA, planWeight(weight ? weight.w * 7 - 1 : t), 'кг', 1, '', !!weight)}
    ${goalBlock('Мышцы', g.muscleA, g.muscleB, mus ? mus.v : g.muscleA, planMuscle(mus ? mus.w * 7 - 1 : t), '%', 1, g.muscleB < 30 ? 'Рабочая цель. Исходная — 30%, ориентир на год. Поменять можно во вкладке «Ещё».' : '', !!mus)}
  </section>`;

  html += chart({ title: 'Подписчики: план и факт', plan: planSubs, facts: factSeries('subs'), unit: 'подп.' });
  html += chart({ title: 'Вес, кг: план и факт', plan: planWeight, facts: factSeries('weight'), dig: 1, unit: 'кг' });

  html += `<section class="card"><h3>Все 182 дня <span class="count">${streak()} подряд</span></h3>${heatmap()}
  <div class="legend"><span><i style="background:var(--good)"></i>по плану</span><span><i style="background:var(--min)"></i>минимум</span><span><i style="background:var(--part)"></i>частично</span><span><i style="background:var(--miss)"></i>пропуск</span></div></section>`;

  html += `<section class="card"><h3>Проекты <span class="count">${publishedTotal()} / ${g.projB}</span></h3>`;
  for (let n = 1; n <= g.projB; n++) {
    const p = state.projects['P' + n] || {};
    const stage = p.stage == null ? -1 : p.stage;
    const dueM = MONTHS.find(m => m.proj >= n * 15 / g.projB - 1e-9) || MONTHS[5];
    html += `<div class="proj"><span class="n ${stage === 4 ? 'done' : stage >= 0 ? 'wip' : ''}">${n}</span>
      ${textInput(`projects.P${n}.title`, p.title, 'Название / идея')}
      <div class="row2"><select class="inp" data-bind="projects.P${n}.stage" data-type="int"><option value="">— статус —</option>${STAGES.map((s, k) => `<option value="${k}" ${stage === k ? 'selected' : ''}>${s}</option>`).join('')}</select>
      <input class="inp" type="date" data-bind="projects.P${n}.date" value="${esc(p.date || '')}" aria-label="Дата публикации"></div>
      <div class="due">по плану к концу месяца ${dueM.n} (${fmtShort(dateAt(dueM.endIdx))})${p.stage === 4 && !p.date ? ' · укажи дату публикации' : ''}</div></div>`;
  }
  html += `</section>`;
  return html;
}

function renderSettings() {
  const g = G(), s = state.settings;
  let html = `<section class="card"><h3>Цели</h3>
    <div class="grid2">
      <label class="field"><span>Подписчики: старт</span>${numInput('goals.subsA', g.subsA)}</label>
      <label class="field"><span>Подписчики: цель</span>${numInput('goals.subsB', g.subsB)}</label>
      <label class="field"><span>Вес: старт, кг</span>${numInput('goals.weightA', g.weightA)}</label>
      <label class="field"><span>Вес: цель, кг</span>${numInput('goals.weightB', g.weightB)}</label>
      <label class="field"><span>Мышцы: старт, %</span>${numInput('goals.muscleA', g.muscleA)}</label>
      <label class="field"><span>Мышцы: цель, %</span>${numInput('goals.muscleB', g.muscleB)}</label>
    </div>
    <p class="hint">Помесячный план пересчитывается от этих чисел.</p></section>`;

  html += `<section class="card"><h3>Режим</h3><div class="grid2">
    <label class="field"><span>Подъём</span><input class="inp" type="time" data-bind="settings.wake" value="${esc(s.wake)}"></label>
    <label class="field"><span>Сон</span><input class="inp" type="time" data-bind="settings.bed" value="${esc(s.bed)}"></label>
  </div></section>`;

  const on = !!sync.token;
  html += `<section class="card"><h3>Синхронизация телефон ↔ компьютер</h3>`;
  if (on) {
    html += `<p>Включена. Данные хранятся в твоём <b>секретном</b> gist на GitHub${sync.gistId ? ` (<a href="https://gist.github.com/${esc(sync.gistId)}" target="_blank" rel="noopener">открыть</a>)` : ''}.</p>
    <p class="hint">Последняя синхронизация: ${sync.last ? new Date(sync.last).toLocaleString('ru-RU') : 'ещё не было'}${sync.error ? `<br>Ошибка: ${esc(sync.error)}` : ''}</p>
    <div class="btns"><button class="btn" data-act="sync">Синхронизировать сейчас</button><button class="btn ghost" data-act="syncoff">Отключить на этом устройстве</button></div>`;
  } else {
    html += `<p class="hint" style="margin-top:0">Без синхронизации всё хранится только на этом устройстве. Чтобы заполнять и с телефона, и с компьютера:</p>
    <ol class="steps">
      <li>Открой <a href="https://github.com/settings/tokens/new?scopes=gist&description=plan-6-months-tracker" target="_blank" rel="noopener">создание токена на GitHub</a> (галочка <code>gist</code> уже стоит).</li>
      <li>В поле Expiration выбери <b>No expiration</b> или дату после 16.05.2027 → <b>Generate token</b>.</li>
      <li>Скопируй токен (начинается с <code>ghp_</code>) и вставь сюда. На втором устройстве вставь тот же токен.</li>
    </ol>
    <label class="field"><span>Токен GitHub</span><input class="inp" id="tokenInp" type="password" autocomplete="off" placeholder="ghp_…"></label>
    <div class="btns"><button class="btn" data-act="syncon">Включить синхронизацию</button></div>
    <p class="hint">Токен хранится только в браузере этого устройства и даёт доступ лишь к gist’ам.</p>`;
  }
  html += `</section>`;

  html += `<section class="card"><h3>Резервная копия</h3>
    <div class="btns"><button class="btn ghost" data-act="export">Скачать данные (JSON)</button><button class="btn ghost" data-act="import">Загрузить из файла</button></div>
    <input type="file" id="importFile" accept="application/json,.json" hidden>
    <div class="btns"><button class="btn danger" data-act="reset">Стереть всё на этом устройстве</button></div></section>`;

  html += `<section class="card"><h3>Как пользоваться</h3><ol class="steps">
    <li><b>Сегодня</b> — каждый день отмечай чеклист. На плохой день включай «минимум».</li>
    <li><b>Неделя</b> — в воскресенье впиши подписчиков, вес и мышцы, ответь на вопросы разбора.</li>
    <li><b>Месяц</b> — задачи этапа и контрольная точка план/факт.</li>
    <li><b>Цели</b> — прогресс, графики, все дни и список 15 проектов со статусами.</li>
    <li>Чтобы трекер был как приложение: Safari → «Поделиться» → «На экран „Домой“».</li>
  </ol></section>`;
  return html;
}

// ───────────────────────── Рендер ─────────────────────────
const view = document.getElementById('view');
function render(keepScroll = true) {
  const y = window.scrollY;
  const map = { today: renderToday, week: renderWeek, month: renderMonth, goals: renderGoals, settings: renderSettings };
  view.innerHTML = (map[ui.tab] || renderToday)();
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === ui.tab));
  const t = todayIdxRaw();
  document.getElementById('brandSub').textContent = t < 0 ? `старт через ${-t} дн.` : t >= TOTAL_DAYS ? 'полугодие завершено' : `день ${t + 1} из ${TOTAL_DAYS} · осталось ${TOTAL_DAYS - t - 1}`;
  if (keepScroll) window.scrollTo(0, y);
  try { sessionStorage.setItem('p6m-ui', JSON.stringify(ui)); } catch (e) {}
}
function go(tab) { ui.tab = tab; render(false); window.scrollTo(0, 0); }

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// ───────────────────────── Запись по data-bind ─────────────────────────
function setPath(path, value) {
  const parts = path.split('.');
  const coll = parts[0];
  let target, rest;
  if (coll === 'goals' || coll === 'settings') { target = state[coll]; rest = parts.slice(1); }
  else { target = rec(coll, parts[1]); rest = parts.slice(2); }
  const record = target;
  for (let n = 0; n < rest.length - 1; n++) {
    const p = rest[n], nextIsIdx = /^\d+$/.test(rest[n + 1]);
    if (target[p] == null || typeof target[p] !== 'object') target[p] = nextIsIdx && p !== 'c' && p !== 'tasks' && p !== 'prevDone' ? [] : {};
    target = target[p];
  }
  const last = rest[rest.length - 1];
  if (value === undefined || value === '' || value === null) delete target[last];
  else target[last] = value;
  touch(record);
}
function readValue(el) {
  if (el.type === 'checkbox') return el.checked || undefined;
  const v = el.value;
  if (el.dataset.type === 'num') {
    if (v.trim() === '') return undefined;
    const n = parseFloat(v.replace(/\s/g, '').replace(',', '.'));
    return isNaN(n) ? undefined : n;
  }
  if (el.dataset.type === 'int') return v === '' ? undefined : parseInt(v, 10);
  return v;
}

document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'importFile') return importFile(el);
  if (!el.dataset || !el.dataset.bind) return;
  setPath(el.dataset.bind, readValue(el));
  if (el.dataset.bind.startsWith('projects.') && el.dataset.bind.endsWith('.stage') && readValue(el) === 4) {
    const k = el.dataset.bind.split('.')[1];
    if (!state.projects[k].date) { state.projects[k].date = keyOf(new Date()); toast('Проект готов! Дата публикации — сегодня'); }
  }
  persist();
  if (el.type === 'checkbox') render();
  else if (el.tagName === 'SELECT' || el.dataset.type === 'num' || el.type === 'time' || el.type === 'date') softRender();
});
// Перерисовка, которая не выбивает фокус из поля, в которое человек перешёл
let pendingRender = false;
function isEditing() {
  const a = document.activeElement;
  return !!(a && a.closest && a.closest('#view') && (a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || (a.tagName === 'INPUT' && a.type !== 'checkbox')));
}
function softRender() {
  setTimeout(() => { if (isEditing()) pendingRender = true; else { pendingRender = false; render(); } }, 0);
}
document.addEventListener('focusout', () => { if (pendingRender) softRender(); });
let inputTimer;
document.addEventListener('input', e => {
  const el = e.target;
  if (!el.dataset || !el.dataset.bind || el.type === 'checkbox' || el.dataset.type === 'num' || el.tagName === 'SELECT') return;
  setPath(el.dataset.bind, readValue(el));
  clearTimeout(inputTimer); inputTimer = setTimeout(persist, 400);
});

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const a = b.dataset.act;
  if (a === 'tab') return go(b.dataset.tab);
  if (a === 'day') { ui.day = clamp(ui.day + +b.dataset.d, 0, TOTAL_DAYS - 1); return render(false); }
  if (a === 'gotoday') { ui.day = todayIdx(); return render(false); }
  if (a === 'openday') { ui.day = +b.dataset.i; return go('today'); }
  if (a === 'week') { ui.week = clamp(ui.week + +b.dataset.d, 1, TOTAL_WEEKS); return render(false); }
  if (a === 'gothisweek') { ui.week = weekOfIdx(todayIdx()); return render(false); }
  if (a === 'month') { ui.month = clamp(ui.month + +b.dataset.d, 1, 6); return render(false); }
  if (a === 'openmonth') { ui.month = +b.dataset.n; render(false); return window.scrollTo(0, 0); }
  if (a === 'meals') {
    const r = rec('days', b.dataset.k), n = +b.dataset.n;
    r.meals = r.meals === n ? n - 1 : n; touch(r); persist(); return render();
  }
  if (a === 'energy') {
    const r = rec('days', b.dataset.k), n = +b.dataset.n;
    r.energy = r.energy === n ? undefined : n; touch(r); persist(); return render();
  }
  if (a === 'sync') { if (!sync.token) return go('settings'); return syncNow(true); }
  if (a === 'syncon') return enableSync();
  if (a === 'syncoff') {
    if (!confirm('Отключить синхронизацию на этом устройстве? Данные останутся и здесь, и в gist.')) return;
    sync = {}; writeLS(SYNC_KEY, sync); setSyncUI(); return render();
  }
  if (a === 'export') return exportData();
  if (a === 'import') return document.getElementById('importFile').click();
  if (a === 'reset') {
    if (!confirm('Стереть все отметки на этом устройстве? Если включена синхронизация, данные в gist останутся.')) return;
    state = defaults(); writeLS(KEY, state); toast('Данные на устройстве стёрты'); return render();
  }
});

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `plan-6-months-${keyOf(new Date())}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function importFile(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const data = JSON.parse(fr.result);
      if (!data || typeof data !== 'object' || !data.days) throw new Error('не похоже на файл трекера');
      mergeInto(state, data, true);
      persist(); render(); toast('Данные загружены');
    } catch (err) { toast('Не получилось: ' + err.message); }
    input.value = '';
  };
  fr.readAsText(f);
}

// ───────────────────────── Синхронизация через gist ─────────────────────────
const GIST_DESC = 'plan-6-months-tracker', GIST_FILE = 'tracker.json';
function mergeInto(local, remote, preferRemoteOnTie = false) {
  let changed = false;
  for (const k of ['goals', 'settings']) {
    const r = remote[k];
    if (r && ((r.u || 0) > (local[k].u || 0) || (preferRemoteOnTie && (r.u || 0) === (local[k].u || 0)))) { local[k] = Object.assign({}, local[k], r); changed = true; }
  }
  for (const k of ['days', 'weeks', 'months', 'projects']) {
    const rc = remote[k] || {};
    for (const id of Object.keys(rc)) {
      const L = local[k][id], R = rc[id];
      if (!L || (R.u || 0) > (L.u || 0)) { local[k][id] = R; changed = true; }
    }
  }
  return changed;
}
async function api(path, opts = {}) {
  const res = await fetch('https://api.github.com' + path, Object.assign({}, opts, {
    headers: { Authorization: 'Bearer ' + sync.token, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    cache: 'no-store',
  }));
  if (!res.ok) {
    let msg = res.status + '';
    if (res.status === 401) msg = 'токен не подходит или истёк';
    else if (res.status === 403 || res.status === 404) msg = 'у токена нет доступа к gist (нужна галочка gist)';
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}
async function ensureGist() {
  if (sync.gistId) return sync.gistId;
  for (let page = 1; page <= 5; page++) {
    const list = await api(`/gists?per_page=100&page=${page}`);
    const g = list.find(x => x.description === GIST_DESC);
    if (g) { sync.gistId = g.id; writeLS(SYNC_KEY, sync); return g.id; }
    if (list.length < 100) break;
  }
  const created = await api('/gists', { method: 'POST', body: JSON.stringify({ description: GIST_DESC, public: false, files: { [GIST_FILE]: { content: JSON.stringify(state) } } }) });
  sync.gistId = created.id; writeLS(SYNC_KEY, sync);
  return created.id;
}
let syncing = false, syncAgain = false, syncTimer;
function setSyncUI(stateName) {
  const dot = document.getElementById('syncDot'), txt = document.getElementById('syncText');
  dot.className = 'sync-dot';
  if (!sync.token) { txt.textContent = 'локально'; return; }
  const s = stateName || (sync.error ? 'err' : 'ok');
  dot.classList.add(s);
  txt.textContent = s === 'busy' ? 'синхр…' : s === 'err' ? 'ошибка' : 'синхр.';
}
function scheduleSync() {
  if (!sync.token) return;
  clearTimeout(syncTimer); syncTimer = setTimeout(() => syncNow(false), 2500);
}
async function syncNow(manual) {
  if (!sync.token) return;
  if (syncing) { syncAgain = true; return; }
  syncing = true; setSyncUI('busy');
  try {
    const id = await ensureGist();
    const g = await api('/gists/' + id);
    const f = g.files && g.files[GIST_FILE];
    let changed = false;
    if (f) {
      let txt = f.content;
      if (f.truncated) txt = await (await fetch(f.raw_url, { cache: 'no-store' })).text();
      try { changed = mergeInto(state, JSON.parse(txt)); } catch (e) {}
    }
    writeLS(KEY, state);
    const body = JSON.stringify(state);
    if (!f || f.content !== body) await api('/gists/' + id, { method: 'PATCH', body: JSON.stringify({ files: { [GIST_FILE]: { content: body } } }) });
    sync.last = Date.now(); delete sync.error; writeLS(SYNC_KEY, sync);
    setSyncUI('ok');
    if (manual) toast('Синхронизировано');
    if (changed || (manual && ui.tab === 'settings')) softRender();
  } catch (err) {
    sync.error = err.message; writeLS(SYNC_KEY, sync); setSyncUI('err');
    if (manual) toast('Синхронизация: ' + err.message);
  } finally {
    syncing = false;
    if (syncAgain) { syncAgain = false; scheduleSync(); }
  }
}
async function enableSync() {
  const v = (document.getElementById('tokenInp').value || '').trim();
  if (!v) return toast('Вставь токен');
  sync = { token: v }; writeLS(SYNC_KEY, sync);
  await syncNow(true);
  if (sync.error) { toast('Не получилось: ' + sync.error); sync = {}; writeLS(SYNC_KEY, sync); setSyncUI(); }
  render();
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { syncNow(false); softRender(); } });

// ───────────────────────── Старт ─────────────────────────
setSyncUI();
render(false);
if (sync.token) syncNow(false);
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
