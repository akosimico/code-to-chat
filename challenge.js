const $ = (id) => document.getElementById(id);
const API = globalThis.browser ?? chrome;

// mode 'fn' = write a function (runs locally). mode 'io' = read stdin / print stdout (runs on Judge0).
const LANGS = [
  { id: 'js',   label: 'JavaScript', mode: 'fn', file: 'solution.js' },
  { id: 'py',   label: 'Python',     mode: 'fn', file: 'solution.py' },
  { id: 'c',    label: 'C',          mode: 'io', file: 'main.c',       match: /^C \(GCC/ },
  { id: 'cpp',  label: 'C++',        mode: 'io', file: 'main.cpp',     match: /^C\+\+ \(GCC/ },
  { id: 'cs',   label: 'C#',         mode: 'io', file: 'Program.cs',   match: /^C# \(/ },
  { id: 'java', label: 'Java',       mode: 'io', file: 'Main.java',    match: /^Java \(OpenJDK/ }
];
const UNLOCK_DELAY_SEC = [3, 5];   // pause after a correct answer, picked at random in this range
const langById = (id) => LANGS.find((l) => l.id === id);

let ch, lang = 'js', drafts = {}, errLines = new Set();

// Keep the same challenge until it is solved, even if the tab is closed and reopened.
// A new challenge is random and never the same one as last time.
async function pickChallenge() {
  let idx = -1, last = -1;
  try {
    const s = await API.storage.local.get(['pending', 'lastIdx']);
    idx = s.pending?.idx ?? -1;
    last = s.lastIdx ?? -1;
  } catch {}
  if (!(idx >= 0 && idx < CHALLENGES.length)) {
    do { idx = Math.floor(Math.random() * CHALLENGES.length); } while (idx === last && CHALLENGES.length > 1);
    try { await API.storage.local.set({ pending: { idx }, lastIdx: idx }); } catch {}
  }
  return CHALLENGES[idx];
}

function setStatus(msg, ok) {
  $('status').textContent = msg;
  $('status').className = 'status' + (ok ? ' ok' : '');
}

// ---------- Editor: line numbers + syntax colours ----------
function refresh() {
  const lines = HL.render($('code').value, lang);
  $('hl').innerHTML = lines.map((h, i) => `<div class="l${errLines.has(i + 1) ? ' err' : ''}">${h || '&#8203;'}</div>`).join('');
  $('gutter').innerHTML = lines.map((_, i) => `<div class="n${errLines.has(i + 1) ? ' err' : ''}">${i + 1}</div>`).join('');
  syncScroll();
}
function syncScroll() {
  const t = $('code');
  $('hl').style.transform = `translate(${-t.scrollLeft}px, ${-t.scrollTop}px)`;
  $('gutter').style.transform = `translateY(${-t.scrollTop}px)`;
}
function insert(text) {
  const t = $('code');
  t.focus();
  if (!document.execCommand('insertText', false, text)) {   // keeps undo history where supported
    const s = t.selectionStart;
    t.setRangeText(text, s, t.selectionEnd, 'end');
    t.dispatchEvent(new Event('input'));
  }
}

$('code').addEventListener('input', () => { errLines = new Set(); refresh(); });
$('code').addEventListener('scroll', syncScroll);
$('code').addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); $('run').click(); return; }
  if (e.key === 'Tab') { e.preventDefault(); insert('    '); return; }
  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
    // Auto-indent: keep the current line's indentation, add one level after { or :
    const t = e.target, before = t.value.slice(0, t.selectionStart);
    const line = before.slice(before.lastIndexOf('\n') + 1);
    const indent = line.match(/^\s*/)[0];
    const extra = /[{:(\[]\s*$/.test(line) ? '    ' : '';
    e.preventDefault();
    insert('\n' + indent + extra);
  }
});

// ---------- No copy / paste ----------
let noticeTimer;
const NOTICE = 'Copy and paste are disabled. Type your answer.';
function notice() {
  clearTimeout(noticeTimer);
  setStatus(NOTICE);
  noticeTimer = setTimeout(() => { if ($('status').textContent === NOTICE) setStatus(''); }, 2500);
}
['copy', 'cut', 'paste', 'contextmenu', 'dragstart', 'dragover', 'drop'].forEach((ev) =>
  document.addEventListener(ev, (e) => {
    e.preventDefault();
    if (ev !== 'dragover' && ev !== 'dragstart') notice();
  }, true));
document.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  const clip = ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'insert'].includes(k)) || (e.shiftKey && ['insert', 'delete'].includes(k));
  if (clip) { e.preventDefault(); notice(); }
}, true);
$('code').addEventListener('beforeinput', (e) => {
  if (/^(insertFromPaste|insertFromPasteAsQuotation|insertFromDrop|insertFromYank|deleteByCut)$/.test(e.inputType)) { e.preventDefault(); notice(); }
});
$('code').addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); });   // Linux middle-click paste

function showLang() {
  const l = langById(lang);
  $('prompt').textContent = l.mode === 'io' ? ch.io.prompt : ch.prompt;
  $('tab').textContent = l.file;
  $('code').value = drafts[lang];
  $('results').innerHTML = '';
  errLines = new Set();
  setStatus('');
  refresh();
}

async function init() {
  ch = await pickChallenge();
  drafts = { js: ch.starter.js, py: ch.starter.py, ...IO_STARTERS };
  $('title').textContent = ch.title;
  LANGS.forEach((l) => $('lang').add(new Option(l.label, l.id)));
  $('lang').addEventListener('change', () => {
    drafts[lang] = $('code').value;
    lang = $('lang').value;
    showLang();
  });
  showLang();
  window.focus();
  $('code').focus();
}

// ---------- JavaScript: runs inside the sandboxed iframe ----------
let sandbox, jsReqId = 0;
function runJS(code) {
  return new Promise((resolve) => {
    if (!sandbox) {
      sandbox = document.createElement('iframe');
      sandbox.src = 'sandbox.html';
      sandbox.style.display = 'none';
      document.body.append(sandbox);
      sandbox.addEventListener('load', () => send());
    } else send();
    function send() {
      const id = ++jsReqId;
      const onMsg = (e) => {
        if (e.source !== sandbox.contentWindow || e.data?.id !== id) return;
        window.removeEventListener('message', onMsg);
        resolve(e.data);
      };
      window.addEventListener('message', onMsg);
      setTimeout(() => { window.removeEventListener('message', onMsg); resolve({ fatal: 'EvalError: local sandbox did not respond' }); }, 6000);
      sandbox.contentWindow.postMessage({ id, code, fnName: ch.fn, tests: ch.tests }, '*');
    }
  });
}

// ---------- Python: Pyodide in a worker ----------
let pyWorker, pyReqId = 0;
function runPy(code) {
  return new Promise((resolve) => {
    if (!pyWorker) pyWorker = new Worker('pyodide-worker.js');
    const id = ++pyReqId;
    const timer = setTimeout(() => {
      pyWorker.terminate(); pyWorker = null;
      resolve({ fatal: 'Timed out (infinite loop?)' });
    }, 30000);
    pyWorker.onmessage = (e) => { if (e.data.id === id) { clearTimeout(timer); resolve(e.data); } };
    pyWorker.onerror = () => {
      clearTimeout(timer); pyWorker = null;
      resolve({ missing: true });
    };
    pyWorker.postMessage({ id, code, fnName: ch.fn, tests: ch.tests });
  });
}

// ---------- Online runner (Judge0): C, C++, C#, Java, and fallback for JavaScript / Python ----------
let judgeLangs;
async function judgeLanguageId(spec) {
  if (!judgeLangs) {
    let res;
    try { res = await fetch(`${JUDGE0_URL}/languages`); } catch { throw new Error('Could not reach the code runner (check your internet connection).'); }
    if (!res.ok) throw new Error(`Code runner error (HTTP ${res.status}).`);
    judgeLangs = await res.json();
  }
  const found = judgeLangs.find((x) => spec.match.test(x.name));
  if (!found) throw new Error(`${spec.label} is not offered by this Judge0 server`);
  return found.id;
}

async function judgeSubmit(language_id, source_code, stdin) {
  let res;
  try {
    res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language_id, source_code, stdin, cpu_time_limit: 3 })
    });
  } catch { throw new Error('Could not reach the code runner (check your internet connection).'); }
  if (res.status === 429) throw new Error('The free code runner is rate limited. Wait a minute and run again.');
  if (!res.ok) throw new Error(`Code runner error (HTTP ${res.status}).`);
  return res.json();
}

// Pull line numbers out of messages: file.c:5:3, Main.java:7, Program.cs(9,1), script.js:4, Python ", line 3".
const textLines = (t) => [...String(t || '').matchAll(/(?:\.(?:c|cpp|cc|java|cs|js)[:(]|, line )(\d+)/g)].map((m) => +m[1]);

// stdin/stdout programs: C, C++, C#, Java
async function runRemote(code, l) {
  try {
    const language_id = await judgeLanguageId(l);
    const results = [];
    for (const t of ch.io.tests) {
      const r = await judgeSubmit(language_id, code, t.input + '\n');
      if (r.status?.id === 6) return { fatal: 'Compile error:\n' + (r.compile_output || '').trim(), lines: textLines(r.compile_output) };
      if (r.status?.id > 3) {
        const msg = (r.stderr || r.message || r.status.description || 'Runtime error').trim();
        results.push({ error: msg, lines: textLines(msg) });
      } else results.push({ got: r.stdout ?? '' });
    }
    return { results };
  } catch (err) {
    return { fatal: err.message };
  }
}

// Function challenges run online: wrap the user's code in a small test harness.
const ONLINE_FN = {
  js: { label: 'JavaScript', match: /^JavaScript \(Node/ },
  py: { label: 'Python', match: /^Python \(3/ }
};
async function runOnlineFn(code, id) {
  const spec = ONLINE_FN[id];
  const n = code.split('\n').length;                       // harness lines come after the user's lines
  const tests = JSON.stringify(ch.tests.map((t) => ({ args: t.args })));
  const source = id === 'js'
    ? `${code}\n;(() => {\n  const tests = ${tests};\n  const out = tests.map((t) => { try { return { got: ${ch.fn}(...t.args) }; } catch (e) { return { error: String(e), stack: String((e && e.stack) || '') }; } });\n  console.log('@@RESULT@@' + JSON.stringify(out));\n})();`
    : `${code}\n\nimport json as _json, traceback as _tb\n_tests = _json.loads(${JSON.stringify(tests)})\n_out = []\nfor _t in _tests:\n    try:\n        _out.append({"got": ${ch.fn}(*_t["args"])})\n    except Exception as _e:\n        _ls = [f.lineno for f in _tb.extract_tb(_e.__traceback__) if f.lineno <= ${n}]\n        _out.append({"error": type(_e).__name__ + ": " + str(_e), "line": _ls[-1] if _ls else None})\nprint("@@RESULT@@" + _json.dumps(_out))`;
  try {
    const r = await judgeSubmit(await judgeLanguageId(spec), source, '');
    const m = /@@RESULT@@(.*)/.exec(r.stdout || '');
    if (!m) {
      const msg = (r.compile_output || r.stderr || r.message || r.status?.description || 'Error').trim();
      return { fatal: msg, lines: textLines(msg).filter((x) => x <= n) };
    }
    const results = JSON.parse(m[1]).map((x) => x.error
      ? { error: x.error, line: x.line || textLines(x.stack).find((v) => v <= n) }
      : x);
    return { results };
  } catch (err) {
    return { fatal: err.message };
  }
}

async function execute(code, l) {
  if (lang === 'js') {
    const r = await runJS(code);
    if (r.fatal && /EvalError|Content Security Policy|unsafe-eval/i.test(r.fatal)) {
      setStatus('Local sandbox unavailable, using the online runner...');
      return runOnlineFn(code, 'js');
    }
    return r;
  }
  if (lang === 'py') {
    const r = await runPy(code);
    if (r.missing) {
      setStatus('Python is not installed locally, using the online runner...');
      return runOnlineFn(code, 'py');
    }
    return r;
  }
  return runRemote(code, l);
}

// ---------- Run + grade ----------
const norm = (s) => String(s).replace(/\r\n/g, '\n').trim();
const linesOf = (o) => [...(o?.lines || []), ...(o?.line ? [o.line] : [])];

$('run').addEventListener('click', async () => {
  const code = $('code').value;
  const l = langById(lang);
  drafts[lang] = code;
  $('run').disabled = true;
  $('results').innerHTML = '';
  errLines = new Set();
  refresh();
  setStatus(l.mode === 'io' || lang === 'py' ? 'Running (this can take a few seconds)...' : 'Running...');

  const res = await execute(code, l);
  $('run').disabled = false;

  if (res.fatal) {
    errLines = new Set(linesOf(res));
    refresh();
    setStatus(res.line ? `Line ${res.line}: ${res.fatal}` : res.fatal);
    return;
  }

  const tests = l.mode === 'io'
    ? ch.io.tests.map((t) => ({ label: `input ${JSON.stringify(t.input)}`, expected: t.output, same: (g) => norm(g) === norm(t.output), show: (v) => JSON.stringify(norm(v)) }))
    : ch.tests.map((t) => ({ label: `${ch.fn}(${t.args.map((a) => JSON.stringify(a)).join(', ')})`, expected: t.expected, same: (g) => JSON.stringify(g) === JSON.stringify(t.expected), show: (v) => JSON.stringify(v) }));

  let passed = 0;
  tests.forEach((t, i) => {
    const r = res.results[i] || {};
    const ok = !r.error && t.same(r.got);
    if (ok) passed++;
    else linesOf(r).forEach((n) => errLines.add(n));
    const li = document.createElement('li');
    li.className = ok ? 'pass' : 'fail';
    const mark = document.createElement('span');
    mark.className = 'mark';
    mark.textContent = ok ? '\u2713' : '\u2717';
    const text = document.createElement('span');
    const where = !ok && linesOf(r).length ? ` (line ${linesOf(r)[0]})` : '';
    text.textContent = ok
      ? `${t.label} -> ${t.show(t.expected)}`
      : `${t.label}: expected ${t.show(t.expected)}, got ${r.error ? r.error + where : t.show(r.got)}`;
    li.append(mark, text);
    $('results').append(li);
  });
  refresh();

  if (passed === tests.length) {
    const wait = Math.round(UNLOCK_DELAY_SEC[0] + Math.random() * (UNLOCK_DELAY_SEC[1] - UNLOCK_DELAY_SEC[0]));
    let left = wait;
    $('run').disabled = true;
    setStatus(`All tests passed. Unlocking in ${left}s...`, true);
    const tick = setInterval(() => { if (--left > 0) setStatus(`All tests passed. Unlocking in ${left}s...`, true); }, 1000);
    setTimeout(async () => {
      clearInterval(tick);
      try { await API.storage.local.remove('pending'); } catch {}   // mark this challenge as answered
      parent.postMessage({ codeToChat: 'solved' }, '*');
    }, wait * 1000);
  } else {
    setStatus(`${passed} of ${tests.length} tests passed.`);
  }
});

init();