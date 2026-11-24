/* 키글워크샵숙제1 · 코코비 낚시놀이 — 레퍼런스: emblematica.agency
 * 레퍼런스 사이트의 CSS/스크립트에서 직접 읽어 온 값으로 재현:
 *  - 프리로더: 오브젝트 640ms 워터폴(지연 70ms + 110ms 간격) → 커튼 1080ms cubic-bezier(.68,0,.14,1) 아치형 상승
 *  - 히어로 오브젝트: idle drift(sin/cos), 마우스 밀어내기, hover 시 배경색 전환 + 원형 배지
 *  - 스크롤: pressure(0.02~0.30) 들어올림 → sideTravel(0.11~0.74) 양옆으로 → exit(0.60~1.0) 화면 밖으로, 축소
 *  - 글자 단위 리빌, 좌우 번갈아 들어오는 카드 덱, 밑줄 핫스팟 미리보기, 아치형 전환, 무한 루프
 */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOutQuint = t => (t < .5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => innerWidth <= 900;
const U = () => Math.min(innerWidth * 0.0694444444, innerHeight * 0.1315789474) / 100 * (isMobile() ? 2 : 1);

/* ───────── 데이터 ───────── */
const GAMES = [
  { t: ['소라게', '집 꾸미기'], tag: '갯벌 놀이', d: '갯벌의 돌을 뒤집어 숨은 소라게를 찾고, 수조에 모래와 조개를 담아 소라게 집을 꾸며요.', img: 'game01_hermitcrab_13', obj: 'hermit2', c: '#ff7a59' },
  { t: ['바다', '청소'], tag: '해변 놀이', d: '그물에 걸린 쓰레기를 치우고, 기름 묻은 거북이와 돌고래를 깨끗하게 씻겨 줘요.', img: 'game02_seaclean_18', obj: 'turtle', c: '#14b3a6' },
  { t: ['미끼', '낚시'], tag: '바닷가 놀이', d: '낚시 가방에 도구를 챙기고 미끼를 골라 바다에 낚싯대를 드리워요.', img: 'game03_bait_10', obj: 'fish', c: '#7c5cff' },
  { t: ['뜰채', '낚시'], tag: '개울 놀이', d: '개울가에서 뜰채를 휘둘러 물고기를 건지고 아이스박스에 차곡차곡 담아요.', img: 'game04_net_8', obj: 'clownfish', c: '#2f7bff' },
  { t: ['통발', '낚시'], tag: '방파제 놀이', d: '방파제에서 통발을 던져 두었다가 바닷속 물고기를 한가득 끌어올려요.', img: 'game05_trap_9', obj: 'crab', c: '#ff5aa5' },
  { t: ['얼음', '낚시'], tag: '겨울 놀이', d: '모닥불을 피워 몸을 녹이고, 얼음 구멍에 낚싯줄을 내려 물고기를 낚아요.', img: 'game06_ice_11', obj: 'seal', c: '#3c8fd8' },
  { t: ['대어', '낚시'], tag: '먼바다 놀이', d: '배를 타고 먼바다로 나가 무지개 아래 커다란 물고기와 힘겨루기를 해요.', img: 'game07_bigfish_4', obj: 'shark_big', c: '#ff9a1f' },
  { t: ['심해', '탐험'], tag: '바닷속 놀이', d: '잠수 마스크를 쓰고 깊은 바닷속으로! 해적선과 산호 사이에서 보물을 찾아요.', img: 'game08_deepsea_8', obj: 'anglerfish', c: '#2b3a9e' },
  { t: ['낚시', '대회'], tag: '마지막 놀이', d: '친구들과 낚시 대회에 나가 누가 더 많이 낚는지 겨루고 트로피에 도전해요.', img: 'game09_contest_3', obj: 'fish_yellow', c: '#e8476b' },
];

// 히어로 오브젝트: 위치(x,y = 뷰포트 비율), 크기(u), 기본 회전, 깊이, flow = 레퍼런스 objectFlow 값
const HERO = [
  { n: 'turtle',       x: 0.10, y: 0.60, size: 360, rot: -5,  depth: .9,  spin: 6, color: '#b5ec8f', card: 1, label: '바다 청소\n보러 가기',   flow: { side: -1, edgeX: -.02, edgeY: .82, offX: -.26, offY: .96, lift: 42, shove: 26, shrink: .32, boost: 1.05 } },
  { n: 'octopus',      x: 0.21, y: 0.29, size: 270, rot: 10,  depth: .7,  spin: 8, color: '#ffa3a8', card: 4, label: '통발 낚시\n보러 가기',   flow: { side: -1, edgeX: .04, edgeY: .40, offX: -.12, offY: .44, lift: 56, shove: 18, shrink: .34, boost: 1.14 } },
  { n: 'puffer',       x: 0.31, y: 0.65, size: 250, rot: -8,  depth: .8,  spin: 5, color: '#ffe27a', card: 2, label: '미끼 낚시\n보러 가기',   flow: { side: -1, edgeX: .08, edgeY: .62, offX: -.16, offY: .70, lift: 48, shove: 20, shrink: .34, boost: 1.26 } },
  { n: 'shark_blue',   x: 0.45, y: 0.30, size: 330, rot: -10, depth: .6,  spin: 7, color: '#9dbcff', card: 6, label: '대어 낚시\n보러 가기',   flow: { side: -1, edgeX: .16, edgeY: .18, offX: -.22, offY: .06, lift: 72, shove: 16, shrink: .40, boost: 1.55 } },
  { n: 'jelly_blue',   x: 0.55, y: 0.66, size: 230, rot: 6,   depth: .48, spin: 5, color: '#a6d6ff', card: 7, label: '심해 탐험\n보러 가기',   flow: { side: 1, edgeX: .84, edgeY: .18, offX: 1.22, offY: .05, lift: 68, shove: 18, shrink: .38, boost: 1.58 } },
  { n: 'hermit2',      x: 0.67, y: 0.29, size: 290, rot: -6,  depth: .38, spin: 6, color: '#c3b6ff', card: 0, label: '소라게 집\n꾸미기 보기', flow: { side: 1, edgeX: .93, edgeY: .54, offX: 1.15, offY: .58, lift: 48, shove: 20, shrink: .34, boost: 1.34 } },
  { n: 'starfish_y',   x: 0.68, y: 0.74, size: 150, rot: -14, depth: .7,  spin: 9, color: '#fff08a', card: 5, label: '얼음 낚시\n보러 가기',   flow: { side: 1, edgeX: .86, edgeY: .86, offX: 1.10, offY: 1.0, lift: 30, shove: 14, shrink: .36, boost: 1.2 } },
  { n: 'dolphin_jump', x: 0.82, y: 0.58, size: 300, rot: 8,   depth: .75, spin: 5, color: '#93ebff', card: 8, label: '낚시 대회\n보러 가기',   flow: { side: 1, edgeX: .98, edgeY: .90, offX: 1.24, offY: 1.06, lift: 24, shove: 16, shrink: .40, boost: 1.2 } },
  { n: 'clownfish',    x: 0.93, y: 0.22, size: 230, rot: -12, depth: .85, spin: 8, color: '#ffb27a', card: 3, label: '뜰채 낚시\n보러 가기',   flow: { side: 1, edgeX: .96, edgeY: .12, offX: 1.2, offY: -.1, lift: 60, shove: 14, shrink: .36, boost: 1.4 } },
];
// 히어로 동물 전체 크기 배율 + 화면 가장자리 여백 (양 끝 친구가 잘리지 않게)
const HERO_SCALE = .86, EDGE = 18;
function heroBase(h, vw, vh, u) {
  const half = h.size * HERO_SCALE * u / 2;
  const x = clamp(h.x * vw, half * .95 + EDGE, vw - half * .95 - EDGE);
  const y = clamp(h.y * vh, half * .8 + 60, vh - half * .8 - 30);
  return [x, y];
}
// hover 시 배경 그라데이션 (동물 색 기반)
const GRAD = {
  turtle: ['#e6fbc8', '#a8e68c', '#5ccfa8'], octopus: ['#ffe3e6', '#ffa2b0', '#ff78b4'], puffer: ['#fff7c6', '#ffd65f', '#ffa64d'],
  shark_blue: ['#dde9ff', '#97b8ff', '#6c86ff'], jelly_blue: ['#e3f4ff', '#a3d4ff', '#8c9dff'], hermit2: ['#ffe8d4', '#ffb58b', '#ff7d86'],
  starfish_y: ['#fffbd6', '#ffea70', '#ffbf4d'], dolphin_jump: ['#e3fcff', '#92ebff', '#5cbcff'], clownfish: ['#fff1de', '#ffc28c', '#ff8a6a'],
};
const gradOf = n => { const g = GRAD[n] || ['#fff', '#eee', '#ddd'];
  return `radial-gradient(120% 90% at 20% 15%, rgb(255 255 255 / .55), transparent 55%), linear-gradient(155deg, ${g[0]} 0%, ${g[1]} 52%, ${g[2]} 100%)`; };
// 실루엣에서 가장 두꺼운 지점(내접원 중심)에 물음표: [x%, y%, 폭%]
const QPOS = { turtle: [50.0, 51.5, 21.1], octopus: [50.2, 26.8, 25.4], puffer: [47.2, 52.8, 34.1], shark_blue: [38.8, 61.5, 23.6], jelly_blue: [50.0, 25.5, 25.4], hermit2: [32.0, 48.8, 29.8], starfish_y: [43.2, 56.8, 34.7], dolphin_jump: [55.5, 29.5, 22.9], clownfish: [45.8, 52.8, 30.4] };
const PRE = ['turtle', 'octopus', 'puffer', 'shark_blue', 'jelly_blue', 'hermit2', 'starfish_y', 'dolphin_jump', 'clownfish', 'squid', 'stingray', 'narwhal'];

/* ───────── 프리로더 ───────── */
function preloader() {
  const pre = $('#preloader'), wf = $('#waterfall');
  wf.innerHTML = PRE.map((n, i) => {
    const s = i % 2 ? 1 : -1;
    return `<div class="preloader-object" style="--size:${95 + (i % 3) * 12};--delay:${35 + i * 55}ms;--r0:${-s * (18 + i % 4 * 2)}deg;--r1:${s * (7 + i % 3)}deg;--r2:${s * (26 + i % 3 * 2)}deg"><img src="assets/ani/${n}.png" alt=""></div>`;
  }).join('');
  const total = 35 + (PRE.length - 1) * 55 + 320;
  const imgs = $$('img', wf);
  let started = false;
  const start = () => {
    if (started) return; started = true;
    pre.classList.add('is-playing');
    setTimeout(() => {
      pre.classList.add('is-leaving');
      popStart = performance.now() + 120;      // 커튼이 걷히는 순간부터 동물들이 차례로 뿅!
      if (!userMuted && bgm.paused) musicOn();  // 메인 화면으로 넘어갈 때 BGM 자동 시작 (브라우저가 막으면 첫 클릭/터치 때 시작)
      document.body.classList.remove('is-booting');
      wrapRamp = 0;
      setTimeout(() => { pre.classList.add("is-done"); introDoneAt = performance.now(); moveSinceIntro = 0; }, 680);
    }, reduce ? 0 : total + 60);
  };
  // 첫 화면 = 타이틀 화면. 클릭(터치)하면 BGM 시작 + 물고기 워터폴 → 메인 화면
  // (클릭이 "사용자 동작"이라 브라우저가 소리 재생을 허용함)
  let ready = false, requested = false;
  const markReady = () => {
    if (ready) return; ready = true;
    pre.classList.add('is-ready');
    if (requested) start();
  };
  Promise.all(imgs.map(i => i.decode().catch(() => {}))).then(markReady);
  setTimeout(markReady, 4000);                      // 이미지가 늦어도 4초 뒤엔 진행 가능
  const go = () => {
    if (requested) return; requested = true;
    pre.classList.add('is-go');
    if (!userMuted) musicOn();
    if (ready) start();
  };
  pre.addEventListener('click', go);
  addEventListener('keydown', e => { if (!requested && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(); } });
}

/* ───────── 히어로 오브젝트 ───────── */
const layer = $('#objects');
const items = HERO.map((h, i) => {
  const el = document.createElement('div');
  el.className = 'object';
  el.style.setProperty('--size', h.size * HERO_SCALE);
  el.style.setProperty('--base-rot', `${h.rot}deg`);
  const q = QPOS[h.n] || [50, 50, 30];
  el.style.setProperty('--qx', `${q[0]}%`); el.style.setProperty('--qy', `${q[1]}%`); el.style.setProperty('--qw', `${q[2]}%`);
  el.innerHTML = `<img src="assets/ani/${h.n}.png" alt=""><span class="qmark"><svg viewBox="0 0 60 90"><path d="M14 26C14 15 21 8 31 8s17 7 17 16c0 8-5 12-10 15-5 3-7 6-7 11v3" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round"/><circle cx="31" cy="76" r="7" fill="#fff"/></svg></span>`;
  layer.appendChild(el);
  return { ...h, el, phase: i * 1.7 + .4, sx: 0, sy: 0, sc: 1, tx: 0, ty: 0, rz: 0 };
});
// 등장 "뿅!": 왼쪽부터 차례로 0 → 살짝 크게 → 1 로 튀어나옴
let popStart = Infinity;
[...items].sort((a, b) => a.x - b.x).forEach((it, k) => { it.popDelay = k * 75; });
const popOut = t => { const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const popOf = (it, now) => {
  if (reduce) return 1;
  const t = clamp((now - popStart - it.popDelay) / 520);
  return t <= 0 ? 0 : popOut(t);
};
// 루프 복제본(정지 포즈)
$('#loopStage').innerHTML = HERO.map(h =>
  `<div class="object" style="--size:${h.size * HERO_SCALE};--base-rot:${h.rot}deg"><img src="assets/ani/${h.n}.png" alt=""></div>`).join('');
const clones = $$('#loopStage .object');
function placeClones() {          // 복제본도 히어로와 똑같은 위치 → 루프 이음새 없음
  const vw = innerWidth, vh = innerHeight, u = U();
  HERO.forEach((h, i) => { const [x, y] = heroBase(h, vw, vh, u); clones[i].style.left = `${x}px`; clones[i].style.top = `${y}px`; });
}

const mouse = { x: innerWidth / 2, y: innerHeight / 2, on: false };
let hovered = null;
// 인트로가 끝난 뒤 사용자가 실제로 마우스를 움직여야 hover 반응 시작
// (인트로 직후 커서가 우연히 동물 위에 있어도 바로 그라데이션으로 바뀌지 않게)
let hoverReady = false, introDoneAt = 0, moveSinceIntro = 0;
addEventListener('pointermove', e => {
  if (introDoneAt && !hoverReady) {
    moveSinceIntro += Math.hypot(e.clientX - mouse.x, e.clientY - mouse.y);
    if (moveSinceIntro > 40 && performance.now() - introDoneAt > 400) hoverReady = true;
  }
  mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true;
});
document.addEventListener('pointerleave', () => { mouse.on = false; });
items.forEach(it => {
  const enter = () => {
    if (!hoverReady || hovered === it || scrollY > innerHeight * .25) return;
    hovered = it;
    document.body.style.setProperty('--hover-grad', gradOf(it.n));
    document.body.classList.add('is-hovering');
    it.el.classList.add('is-q');          // 검은 실루엣 + 물음표
  };
  it.el.addEventListener('pointerenter', enter);
  it.el.addEventListener('pointermove', enter);   // 준비된 뒤 이미 올라가 있던 커서를 움직이면 그때 반응
  it.el.addEventListener('pointerleave', () => {
    if (hovered !== it) return;
    hovered = null;
    document.body.classList.remove('is-hovering');
    it.el.classList.remove('is-q');
  });
  it.el.addEventListener('click', () => scrollToCard(it.card));
});

/* ───────── 글자 단위 리빌 ───────── */
const reveals = $$('.reveal-text').map(root => {
  const chars = [];
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.style.whiteSpace = 'nowrap';
          [...part].forEach(ch => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; w.appendChild(s); chars.push(s); });
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
  };
  walk(root);
  return { root, chars, lines: [], hots: $$('.hot', root).map(h => ({ el: h, chars: $$('.ch', h) })) };
});
function measureLines() {
  reveals.forEach(r => {
    const map = new Map();
    r.chars.forEach(c => { const t = Math.round(c.offsetTop); if (!map.has(t)) map.set(t, []); map.get(t).push(c); });
    r.lines = [...map.entries()].sort((a, b) => a[0] - b[0]).map(([top, chars]) => ({ top, chars, lit: -1 }));
    r.topOffset = r.root.offsetTop;
  });
}
function updateReveals(vh) {
  reveals.forEach(r => {
    const rect = r.root.getBoundingClientRect();
    if (rect.bottom < -vh || rect.top > vh * 2) return;
    const base = rect.top - r.root.offsetTop + (r.root.offsetParent ? 0 : 0);
    r.lines.forEach(line => {
      const y = rect.top + (line.top - r.lines[0].top);
      const f = clamp((vh * .74 - y) / (vh * .17));
      const n = Math.round(f * line.chars.length);
      if (n === line.lit) return;
      line.chars.forEach((c, i) => c.classList.toggle('on', i < n));
      line.lit = n;
    });
    r.hots.forEach(h => h.el.style.setProperty('--ul', h.chars.every(c => c.classList.contains('on')) ? 1 : 0));
  });
}

/* ───────── 카드 덱 ───────── */
const deck = $('#deck'), services = $('#services');
services.style.setProperty('--cards', GAMES.length);
deck.innerHTML = GAMES.map((g, i) => `
  <article class="card" style="--c:${g.c};z-index:${i + 1}">
    <div class="card-body">
      <div class="card-top"><span>${String(i + 1).padStart(2, '0')}</span><span>${g.tag}</span></div>
      <div class="card-bottom">
        <img class="card-logo" src="assets/titles/t${i + 1}.png" alt="${g.t.join(' ')}">
        <p class="card-desc">${g.d}</p>
      </div>
    </div>
    <div class="card-media"><img src="assets/shots/${g.img}.jpg" alt="${g.t.join(' ')} 놀이 화면" decoding="async"></div>
  </article>`).join('');
const cards = $$('.card', deck).map((el, i) => ({ el, media: $('.card-media img', el), side: i % 2 ? 1 : -1, fin: (i % 2 ? 1.4 : -1.6) * (i % 3 === 2 ? .6 : 1), e: 0 }));
let svcTop = 0, svcH = 0;
const svcT = (y, vh) => clamp((y - (svcTop - vh * .7)) / (svcH - vh + vh * .7));
function scrollToCard(i) {
  const vh = innerHeight, n = GAMES.length;
  const t = (i + .85) / n;
  scrollTo({ top: svcTop - vh * .7 + t * (svcH - vh + vh * .7), behavior: 'smooth' });
}
function updateCards(y, vh, vw, k) {
  if (y < svcTop - vh * 1.6 || y > svcTop + svcH + vh) return;
  const n = cards.length, t = svcT(y, vh);
  cards.forEach((c, i) => {
    const target = clamp((t * n - i) / .72);
    c.e = lerp(c.e, target, k(.16));
    if (Math.abs(c.e - target) < .0005) c.e = target;
  });
  cards.forEach((c, i) => {
    const e = easeInOutQuint(c.e);
    let above = 0;
    for (let j = i + 1; j < n; j++) above += easeOutCubic(cards[j].e);
    const inv = 1 - e;
    const x = c.side * inv * vw * 1.05;
    const yy = inv * vh * .1 - Math.min(above, 3) * 10;
    const rot = c.fin + c.side * inv * 9;
    const ry = c.side * inv * -16;
    const sc = 1 - Math.min(above, 4) * .018;
    c.el.style.transform = `translate3d(${x.toFixed(1)}px,${yy.toFixed(1)}px,0) rotateY(${ry.toFixed(2)}deg) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
    c.el.style.visibility = (c.e < .001 || above > 3.2) ? 'hidden' : 'visible';
    c.media.style.transform = `scale(${(1 + inv * .12).toFixed(4)}) translateX(${(c.side * inv * -8).toFixed(2)}%)`;   // 들어오는 동안만 살짝 확대, 자리 잡으면 원본 비율 그대로
  });
}

/* ───────── 메인 루프 ───────── */
const topbar = $('#topbar'), captions = $$('.hero .caption'), darkZones = $$('.dark-zone');
const about = $('#about'), aboutImg = $('.about-img img'), aboutObjs = $$('#aboutObjects img');

/* ───────── 바다 친구들: 누르면 흔들흔들 + 하트 뿅뿅 ───────── */
const HEART_COLORS = ['#ff4f8b', '#ff6fa5', '#ff8fb8', '#ff3d6e', '#ffb3cf'];
function burstHearts(x, y) {
  const n = 7 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'heart-fx';
    const size = 16 + Math.random() * 22;
    el.style.width = `${size}px`;
    el.innerHTML = `<svg viewBox="0 0 32 29"><path d="M16 29S0 19.2 0 8.7C0 3.6 3.9 0 8.6 0c3.1 0 5.8 1.7 7.4 4.3C17.6 1.7 20.3 0 23.4 0 28.1 0 32 3.6 32 8.7 32 19.2 16 29 16 29z" fill="${HEART_COLORS[i % HEART_COLORS.length]}" stroke="#fff" stroke-width="2"/></svg>`;
    document.body.appendChild(el);
    const dx = (Math.random() - .5) * 160, dy = 120 + Math.random() * 140, rot = (Math.random() - .5) * 50;
    const dur = 900 + Math.random() * 600, delay = i * 45;
    const base = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    el.animate([
      { transform: `${base} scale(.2)`, opacity: 0 },
      { transform: `${base} translate(${dx * .25}px, ${-dy * .25}px) scale(1.15)`, opacity: 1, offset: .2 },
      { transform: `${base} translate(${dx}px, ${-dy}px) rotate(${rot}deg) scale(.85)`, opacity: 0 },
    ], { duration: dur, delay, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' }).onfinish = () => el.remove();
  }
}
aboutObjs.forEach(o => {
  o.addEventListener('click', e => {
    o.classList.remove('wiggle'); void o.offsetWidth; o.classList.add('wiggle');
    burstHearts(e.clientX, e.clientY);
  });
  o.addEventListener('animationend', () => o.classList.remove('wiggle'));
});
const loopHero = $('#loopHero');
let last = performance.now(), wrapRamp = 0, instant = true, loopTop = 0, frameN = 0;

function layout() {
  svcTop = services.offsetTop; svcH = services.offsetHeight;
  loopTop = loopHero.offsetTop;
  measureLines();
  placeClones();
}

/* ───────── 스크롤 게이지: 파도가 차오르고 코코가 배를 저어 이동 ───────── */
const gauge = $('#gauge'), coco = $('.g-coco', gauge);
const G = { p: 0, lastY: scrollY, lastMove: 0, lastFlip: 0, frame: 0 };
function updateGauge(now, y, vh, wrapAt, k) {
  const target = clamp(y / Math.max(1, wrapAt));
  // 루프로 맨 위로 돌아갈 때는 즉시, 평소엔 부드럽게 따라감
  G.p = Math.abs(target - G.p) > .5 ? target : lerp(G.p, target, k(.18));
  gauge.style.setProperty('--p', G.p.toFixed(4));
  const booting = document.body.classList.contains('is-booting');
  gauge.style.setProperty('--go', !booting && y > 30 ? 1 : 0);
  const dy = y - G.lastY; G.lastY = y;
  if (Math.abs(dy) > .5 && Math.abs(dy) < vh) {          // 실제 스크롤 중 (루프 점프는 제외)
    G.lastMove = now;
    coco.classList.toggle('back', dy < 0);               // 위로 스크롤하면 뒤돌아 이동
  }
  const moving = now - G.lastMove < 220;
  coco.classList.toggle('moving', moving && !reduce);
  if (moving && now - G.lastFlip > 130) { G.frame ^= 1; G.lastFlip = now; }   // 0 ↔ 1 프레임 교차
  if (!moving) G.frame = 0;
  coco.classList.toggle('f1', G.frame === 1);
}

/* ───────── 마지막 섹션 진입: 양쪽 아래에서 버블건 파파팡! ───────── */
let bubblesArmed = true;
function bubbleGun() {
  const vw = innerWidth, vh = innerHeight;
  const shots = 3, perShot = isMobile() ? 9 : 14;
  for (let s = 0; s < shots; s++) {
    [-1, 1].forEach(side => {
      for (let i = 0; i < perShot; i++) {
        const b = document.createElement('span');
        b.className = 'bubble-fx';
        const size = 12 + Math.random() ** 1.6 * 58;
        b.style.width = b.style.height = `${size}px`;
        document.body.appendChild(b);
        // 화면 아래 모서리에서 안쪽 위로 발사되는 포물선
        const x0 = side < 0 ? -20 : vw + 20, y0 = vh + 20;
        const ang = (35 + Math.random() * 40) * Math.PI / 180;          // 발사 각도
        const pow = vh * (.55 + Math.random() * .5);
        const dx = -side * Math.cos(ang) * pow * (vw / vh) * .55, dy = -Math.sin(ang) * pow;
        const drift = (Math.random() - .5) * 60;
        const dur = 1500 + Math.random() * 1100, delay = s * 170 + i * 18 + Math.random() * 60;
        const T = (fx, fy, sc) => `translate(${x0 + fx}px, ${y0 + fy}px) translate(-50%, -50%) scale(${sc})`;
        b.animate([
          { transform: T(0, 0, .3), opacity: 0 },
          { transform: T(dx * .55, dy * .7, 1), opacity: 1, offset: .25 },
          { transform: T(dx * .9 + drift * .5, dy * .95, 1.02), opacity: .95, offset: .7 },
          { transform: T(dx + drift, dy * .9, 1.35), opacity: 0 },             // 톡! 터지며 사라짐
        ], { duration: dur, delay, easing: 'cubic-bezier(.15,.75,.35,1)', fill: 'both' }).onfinish = () => b.remove();
      }
    });
  }
}

function frame(now) {
  const dt = Math.min(64, now - last) / 16.667; last = now;
  const k = a => 1 - Math.pow(1 - a, dt);          // 프레임 독립 lerp 계수
  const vw = innerWidth, vh = innerHeight, y = scrollY, u = U(), sec = now / 1000;

  // 무한 루프: 복제 히어로에 닿으면 맨 위로
  if ((frameN++ & 15) === 0) loopTop = loopHero.offsetTop;
  const wrapAt = Math.min(loopTop, document.documentElement.scrollHeight - vh) - 2;
  if (loopTop > 0 && !document.body.classList.contains('is-booting') && y >= wrapAt) {
    scrollTo(0, Math.max(0, y - wrapAt)); instant = true; wrapRamp = 0; requestAnimationFrame(frame); return;
  }

  // 히어로 → 카드 섹션이 올라오는 동안의 진행도 (오브젝트가 흩어져 나감)
  const mp = clamp(y / (vh * 1.25));
  const pressure = easeInOut(clamp((mp - .02) / .28));
  const sideBase = easeInOut(clamp((mp - .11) / .63));
  const exit = easeOutCubic(clamp((mp - .60) / .40));
  wrapRamp = Math.min(1, wrapRamp + dt * .012);
  const heroIdle = 1 - clamp(mp / .3);

  captions.forEach(c => { c.style.opacity = (1 - clamp(y / (vh * .3))).toFixed(3); });
  layer.style.visibility = mp >= .999 ? 'hidden' : '';

  if (mp < .999) {
    items.forEach(it => {
      const f = it.flow, [bx, by] = heroBase(it, vw, vh, u);
      const st = clamp(sideBase * f.boost);
      const lx = bx + f.side * f.shove * u * pressure, ly = by - f.lift * u * pressure;
      const tx = lerp(lx, f.edgeX * vw, st), ty = lerp(ly, f.edgeY * vh, st);
      const fx = lerp(tx, f.offX * vw, exit), fy = lerp(ty, f.offY * vh, exit);
      const ds = (1 - exit * .8) * (.15 + st * .85);
      const dx = Math.sin(now / 760 + it.phase + mp * 6.4) * (4 + it.depth * 2.2) * ds;
      const dy = Math.cos(now / 930 + it.phase * .9 + mp * 4.8) * (2.4 + it.depth * 1.6) * ds;
      const tsx = fx - bx + dx, tsy = fy - by + dy;
      const tsc = 1 - pressure * .012 - st * f.shrink * .72 - exit * f.shrink * .28;

      // 마우스 밀어내기 (히어로에서만)
      let mx = 0, my = 0;
      if (mouse.on && heroIdle > 0 && hovered !== it && !isMobile()) {
        const ox = bx + it.sx - mouse.x, oy = by + it.sy - mouse.y, d = Math.hypot(ox, oy) || 1;
        const R = vw * .3, p = Math.pow(clamp(1 - d / R), 2) * 170 * u * (.55 + it.depth * .6) * heroIdle;
        mx = ox / d * p; my = oy / d * p;
      }
      if (instant) { it.sx = tsx; it.sy = tsy; it.sc = tsc; it.tx = mx; it.ty = my; }
      else {
        it.sx = lerp(it.sx, tsx, k(.12)); it.sy = lerp(it.sy, tsy, k(.12)); it.sc = lerp(it.sc, tsc, k(.12));
        it.tx = lerp(it.tx, mx, k(.07)); it.ty = lerp(it.ty, my, k(.07));
      }
      // idle drift (깊이에 비례, 최소치 보장)
      const reach = Math.max(it.depth, .6) * u * 1.6 * wrapRamp * (reduce ? 0 : 1);
      const ix = Math.sin(sec * (.9 + it.depth * .2) + it.phase) * 9 * reach;
      const iy = Math.cos(sec * (.82 + it.depth * .16) + it.phase) * 11 * reach;
      const irz = Math.sin(sec * .7 + it.phase) * it.spin * .32 * wrapRamp;
      const s = it.el.style;
      s.setProperty('--tx', `${(bx + it.tx + ix).toFixed(2)}px`);
      s.setProperty('--ty', `${(by + it.ty + iy).toFixed(2)}px`);
      s.setProperty('--sx', `${it.sx.toFixed(2)}px`);
      s.setProperty('--sy', `${it.sy.toFixed(2)}px`);
      s.setProperty('--sc', (it.sc * popOf(it, now)).toFixed(4));
      s.setProperty('--rz', `${irz.toFixed(3)}deg`);
    });
  }

  // 히어로(바다 배경) 또는 바다 패턴 위에서는 흰색, hover 색 배경·회색 소개 영역에서는 검정
  const overHero = !hovered && (y < svcTop - 32 || loopHero.getBoundingClientRect().top <= 32);
  const onDark = overHero || darkZones.some(z => { const r = z.getBoundingClientRect(); return r.top <= 32 && r.bottom >= 32; });
  topbar.classList.toggle('on-dark', onDark);

  updateReveals(vh);
  updateCards(y, vh, vw, k);

  // 친구들 섹션: 이미지 패럴랙스 + 떠다니는 바다 친구들
  const ar = about.getBoundingClientRect();
  if (ar.top < vh * 1.3 && ar.bottom > -vh * .2) {
    aboutObjs.forEach((o, i) => {
      const d = +o.dataset.d, r = o.getBoundingClientRect();
      const py = (r.top - vh / 2) * -.18 * d;
      const fx = Math.sin(sec * (.8 + d * .2) + i) * 10 * d, fy = Math.cos(sec * (.7 + d * .15) + i * 1.3) * 14 * d;
      o.style.transform = `translate3d(${fx.toFixed(1)}px,${(py + fy).toFixed(1)}px,0) rotate(${(Math.sin(sec * .6 + i) * 6).toFixed(2)}deg)`;
    });
  }

  updateGauge(now, y, vh, wrapAt, k);

  // 마지막(친구들) 섹션이 화면 절반쯤 들어오면 한 번 발사, 위로 벗어나면 다시 장전
  const atop = about.getBoundingClientRect().top;
  if (bubblesArmed && atop < vh * .45 && atop > -vh * .5 && !reduce) { bubblesArmed = false; bubbleGun(); }
  else if (!bubblesArmed && atop > vh * 1.05) bubblesArmed = true;

  instant = false;
  requestAnimationFrame(frame);
}

/* ───────── 배경음악: 첫 클릭/터치에 서서히 시작, 곡이 끝나면 처음부터 반복 ───────── */
const bgm = $('#bgm'), soundBtn = $('#soundBtn');
const BGM_VOL = .5;
let userMuted = false, fadeRAF = 0;
// 반복 재생: 곡 끝 3.2초 동안 서서히 작아지며 꺼지고(1→0), 처음부터 다시 3.2초 동안 서서히 커짐(0→1)
const BGM_FADE = 3200;
let fadingOut = false;
bgm.loop = false; bgm.volume = 0;
bgm.addEventListener('timeupdate', () => {
  const left = (bgm.duration - bgm.currentTime) * 1000;
  if (!fadingOut && !bgm.paused && isFinite(left) && left <= BGM_FADE) {
    fadingOut = true;
    fadeTo(0, Math.max(200, left - 150));
  }
});
bgm.addEventListener('ended', () => {
  fadingOut = false;
  if (userMuted || !soundBtn.classList.contains('on')) return;
  bgm.currentTime = 0;
  bgm.play().then(() => fadeTo(BGM_VOL, BGM_FADE)).catch(() => {});
});
bgm.addEventListener('seeked', () => { if (bgm.duration - bgm.currentTime > BGM_FADE / 1000) fadingOut = false; });
function fadeTo(target, ms, done) {
  cancelAnimationFrame(fadeRAF);
  const from = bgm.volume, t0 = performance.now();
  const step = now => {
    const p = Math.min(1, (now - t0) / ms);
    bgm.volume = Math.max(0, Math.min(1, from + (target - from) * p));
    if (p < 1) fadeRAF = requestAnimationFrame(step); else if (done) done();
  };
  fadeRAF = requestAnimationFrame(step);
}
function setMusicUI(on) {
  soundBtn.classList.toggle('on', on);
  soundBtn.setAttribute('aria-pressed', on);
  soundBtn.setAttribute('aria-label', on ? '배경음악 끄기' : '배경음악 켜기');
}
function musicOn() {
  bgm.play().then(() => { setMusicUI(true); fadeTo(BGM_VOL, BGM_FADE); }).catch(() => setMusicUI(false));   // 서서히 (3.2초)
}
function musicOff() {
  setMusicUI(false);
  fadeTo(0, 450, () => bgm.pause());
}
soundBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (soundBtn.classList.contains('on')) { userMuted = true; musicOff(); }
  else { userMuted = false; musicOn(); }
});
// 브라우저는 사용자 동작 전 소리 재생을 막으므로, 첫 클릭/터치/키 입력 때 시작
const firstTouch = e => {
  if (soundBtn.contains(e.target)) return;
  ['pointerdown', 'keydown', 'touchend'].forEach(t => removeEventListener(t, firstTouch, true));
  if (!userMuted && bgm.paused) musicOn();
};
['pointerdown', 'keydown', 'touchend'].forEach(t => addEventListener(t, firstTouch, true));

/* ───────── 시작 ───────── */
preloader();
layout();
addEventListener('resize', () => { layout(); instant = true; });
addEventListener('load', layout);
if (document.fonts) document.fonts.ready.then(layout);
requestAnimationFrame(frame);
})();
