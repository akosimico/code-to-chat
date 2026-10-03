// ---- Settings: tweak these ----
const CFG = {
  testMode: false,             // true = challenge on EVERY visit, no cooldown. Set to false for real use.
  test: { chanceOnLoad: 1, chanceOnReturn: 1, loadDelaySec: [0.5, 1], recurMin: [0.5, 1], graceOptionsMin: [0] },

  chanceOnLoad: 0.7,          // probability of a challenge when the site opens
  chanceOnReturn: 0.4,        // probability when you switch back to an already-open tab of the site
  loadDelaySec: [2, 8],       // random delay before it pops up after load
  recurMin: [5, 20],          // while you stay on the site: random minutes between challenges
  graceOptionsMin: [3, 5, 10, 15, 20, 30, 45, 60]   // after each solve, one of these is picked at random
};
// --------------------------------
const S = CFG.testMode ? { ...CFG, ...CFG.test } : CFG;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const API = globalThis.browser ?? chrome;
const rand = (a, b) => a + Math.random() * (b - a);
const BLOCKED_EVENTS = ['keydown', 'keyup', 'keypress', 'click', 'dblclick', 'mousedown',
  'mouseup', 'wheel', 'contextmenu', 'paste', 'cut', 'copy', 'touchstart'];

let locked = false, host, iframe, observer, focusTimer;

const block = (e) => { e.stopImmediatePropagation(); e.preventDefault(); };

async function inGrace() {
  try {
    const { unlockedUntil = 0 } = await API.storage.local.get('unlockedUntil');
    return Date.now() < unlockedUntil;
  } catch { return false; }
}

async function lock() {
  if (locked) return;
  locked = true;

  // Remember that a challenge is owed. It is cleared only when the tests pass.
  try {
    const { pending } = await API.storage.local.get('pending');
    if (!pending) await API.storage.local.set({ pending: { idx: -1 } });
  } catch {}

  host = document.createElement('div');
  host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647;';
  const shadow = host.attachShadow({ mode: 'closed' });
  iframe = document.createElement('iframe');
  iframe.src = API.runtime.getURL('challenge.html');
  iframe.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;border:0;background:' + (matchMedia('(prefers-color-scheme: dark)').matches ? '#0c0c0c' : '#ffffff') + ';';
  shadow.append(iframe);
  document.documentElement.append(host);
  document.documentElement.style.overflow = 'hidden';
  document.activeElement?.blur?.();

  BLOCKED_EVENTS.forEach((ev) => window.addEventListener(ev, block, true));
  window.addEventListener('message', onMessage);

  // Put the overlay back if the page removes it, and keep focus inside it.
  observer = new MutationObserver(() => {
    if (locked && !host.isConnected) document.documentElement.append(host);
  });
  observer.observe(document.documentElement, { childList: true });
  focusTimer = setInterval(() => {
    if (document.activeElement !== host) iframe.focus();
  }, 400);
}

async function unlock() {
  if (!locked) return;
  locked = false;
  BLOCKED_EVENTS.forEach((ev) => window.removeEventListener(ev, block, true));
  window.removeEventListener('message', onMessage);
  observer.disconnect();
  clearInterval(focusTimer);
  host.remove();
  document.documentElement.style.overflow = '';
  try {
    await API.storage.local.set({ unlockedUntil: Date.now() + pick(S.graceOptionsMin) * 60000 });
    await API.storage.local.remove('pending');
  } catch {}
}

// Solved in another tab of an AI site? Unlock this one too.
API.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && locked && changes.pending && !changes.pending.newValue) unlock();
});

function onMessage(e) {
  // Only accept the message from our own challenge iframe.
  if (iframe && e.source === iframe.contentWindow && e.data?.codeToChat === 'solved') unlock();
}

async function maybeLock() {
  if (document.hidden || (await inGrace())) return;
  lock();
}

function scheduleRecurring() {
  setTimeout(async () => {
    await maybeLock();
    scheduleRecurring();
  }, rand(...S.recurMin) * 60000);
}

// Runs when the site is opened or typed into the address bar.
async function start() {
  let pending;
  try { ({ pending } = await API.storage.local.get('pending')); } catch {}
  if (pending) {
    lock();                                   // previous challenge was never solved: lock right away
  } else if (Math.random() < S.chanceOnLoad) {
    setTimeout(maybeLock, rand(...S.loadDelaySec) * 1000);
  }
  scheduleRecurring();
}
start();

// Switching to an already-open tab counts as a visit too.
document.addEventListener('visibilitychange', async () => {
  if (document.hidden || locked) return;
  let pending;
  try { ({ pending } = await API.storage.local.get('pending')); } catch {}
  if (pending) lock();
  else if (Math.random() < S.chanceOnReturn) maybeLock();
});