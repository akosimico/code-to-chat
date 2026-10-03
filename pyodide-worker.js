// Runs inside a sandboxed extension page (eval is allowed here, and only here).
// Line numbers: code built with new Function sits 2 lines below the user's line 1 in stack traces.
const LINE_OF = `(err) => { const m = /<anonymous>:(\\d+):\\d+/.exec((err && err.stack) || ''); return m ? Math.max(1, +m[1] - 2) : undefined; }`;

const WORKER_SRC = `
const lineOf = ${LINE_OF};
onmessage = (e) => {
  const { code, fnName, tests } = e.data;
  try {
    const f = new Function(code + '\\nreturn typeof ' + fnName + ' === "function" ? ' + fnName + ' : null;')();
    if (!f) throw new Error('Function ' + fnName + ' not found');
    const results = tests.map((t) => {
      try { return { got: f(...t.args) }; } catch (err) { return { error: String(err), line: lineOf(err) }; }
    });
    postMessage({ results });
  } catch (err) { postMessage({ fatal: String(err), line: lineOf(err) }); }
};`;

const lineOf = eval(LINE_OF);

function runInline({ code, fnName, tests }) {
  try {
    const f = new Function(code + '\nreturn typeof ' + fnName + ' === "function" ? ' + fnName + ' : null;')();
    if (!f) return { fatal: 'Function ' + fnName + ' not found' };
    return { results: tests.map((t) => { try { return { got: f(...t.args) }; } catch (err) { return { error: String(err), line: lineOf(err) }; } }) };
  } catch (err) { return { fatal: String(err), line: lineOf(err) }; }
}

window.addEventListener('message', (e) => {
  const msg = e.data;
  const reply = (out) => e.source.postMessage({ id: msg.id, ...out }, '*');
  let worker;
  try {
    worker = new Worker(URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' })));
  } catch {
    return reply(runInline(msg)); // no worker support: run inline, no timeout
  }
  const timer = setTimeout(() => { worker.terminate(); reply({ fatal: 'Timed out (infinite loop?)' }); }, 3000);
  worker.onmessage = (ev) => { clearTimeout(timer); worker.terminate(); reply(ev.data); };
  worker.onerror = (ev) => { clearTimeout(timer); worker.terminate(); reply({ fatal: String(ev.message || 'Error'), line: ev.lineno ? Math.max(1, ev.lineno - 2) : undefined }); };
  worker.postMessage(msg);
});