// Tiny syntax highlighter: turns code into an array of HTML lines.
const HL = (() => {
  const set = (s) => new Set(s.split(' '));
  const R = {
    slash: /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|(?![\s\S]))/,
    hash: /#[^\n]*/,
    pre: /^[ \t]*#[ \t]*[a-z]+/,
    strPlain: /"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?/,
    strC: /(?<=#[ \t]*include[ \t]*)<[^>\n]*>|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?/,
    strJs: /"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|`(?:\\[\s\S]|[^`\\])*`?/,
    strPy: /"""[\s\S]*?(?:"""|(?![\s\S]))|'''[\s\S]*?(?:'''|(?![\s\S]))|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?/,
    num: /0x[\da-fA-F]+|\b\d+\.?\d*(?:[eE][+-]?\d+)?[fFlLuU]*\b/,
    id: /[A-Za-z_$][\w$]*/
  };
  const build = (comment, str, pre) => new RegExp(
    `(${comment.source})|(${str.source})|(${pre ? pre.source : '(?!)'})|(${R.num.source})|(${R.id.source})|(\\s+)|([\\s\\S])`, 'gm');

  const CTL = 'if else for while do switch case break continue return goto default throw try catch finally';
  const DEFS = {
    js:   { re: build(R.slash, R.strJs), ctl: set(CTL + ' yield await'), kw: set('function const let var class new typeof instanceof in of delete void async import export from extends static this super true false null undefined'), types: set('Math Number String Array Object JSON console') },
    py:   { re: build(R.hash, R.strPy), ctl: set('if elif else for while break continue return try except finally raise with pass yield assert'), kw: set('def class lambda import from as in is not and or None True False self global nonlocal del async await'), types: set('int str float list dict set tuple bool range len print') },
    c:    { re: build(R.slash, R.strC, R.pre), ctl: set(CTL), kw: set('struct typedef enum union const static sizeof extern volatile register NULL true false'), types: set('int char float double void long short unsigned signed size_t bool FILE') },
    cpp:  { re: build(R.slash, R.strC, R.pre), ctl: set(CTL), kw: set('struct class namespace using new delete template typename public private protected virtual const static this nullptr true false typedef enum'), types: set('int char float double void long short unsigned signed bool auto string vector map set size_t') },
    cs:   { re: build(R.slash, R.strPlain), ctl: set(CTL + ' foreach'), kw: set('using namespace class struct static public private protected internal new this null true false readonly const in out ref override virtual abstract interface enum'), types: set('int string bool double float char long object void var decimal byte short') },
    java: { re: build(R.slash, R.strPlain), ctl: set(CTL + ' throws'), kw: set('import package public private protected static final class interface extends implements new this null true false abstract enum'), types: set('int String boolean double float char long void var byte short') }
  };

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function render(code, langId) {
    const L = DEFS[langId] || DEFS.js;
    const toks = [];
    L.re.lastIndex = 0;
    let m;
    while ((m = L.re.exec(code)) !== null) {
      if (m[0] === '') { L.re.lastIndex++; continue; }
      toks.push({ t: m[1] ? 'cm' : m[2] ? 'st' : m[3] ? 'pp' : m[4] ? 'nu' : m[5] ? 'id' : m[6] ? 'ws' : 'op', s: m[0] });
    }
    toks.forEach((tk, i) => {
      if (tk.t !== 'id') return;
      const w = tk.s;
      if (L.ctl.has(w)) tk.t = 'ctl';
      else if (L.kw.has(w)) tk.t = 'kw';
      else if (L.types.has(w)) tk.t = 'type';
      else {
        let j = i + 1, k = i - 1;
        while (toks[j] && toks[j].t === 'ws') j++;
        while (toks[k] && toks[k].t === 'ws') k--;
        const next = toks[j] && toks[j].s[0], prev = toks[k] && toks[k].s;
        if (prev === 'new' || prev === 'class') tk.t = 'type';          // constructors and class names
        else if (prev === 'def') tk.t = 'fn';
        else if (next === '(') tk.t = /^[A-Z]/.test(w) ? 'type' : 'fn';  // calls: Foo(...) is a constructor-style call
        else if (/^[A-Z]/.test(w) && !/^[A-Z0-9_]+$/.test(w)) tk.t = 'type';
        else tk.t = 'var';
      }
    });
    const lines = [''];
    for (const tk of toks) {
      tk.s.split('\n').forEach((piece, idx) => {
        if (idx > 0) lines.push('');
        if (piece) lines[lines.length - 1] += tk.t === 'ws' ? esc(piece) : `<span class="t-${tk.t}">${esc(piece)}</span>`;
      });
    }
    return lines;
  }
  return { render };
})();