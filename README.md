# Code to Chat

Pops a full-screen coding challenge over AI chat sites (ChatGPT, Gemini, Claude, Copilot, Perplexity, Grok, DeepSeek, Poe). The page can't be used until all tests pass.

<img src="assets/code-to-chat.gif" width="500" alt="Code To Chat GIF">


## Install (Chrome, Edge, Brave, Opera)

1. Open the extensions page: `chrome://extensions`, `edge://extensions`, `brave://extensions` or `opera://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and pick this `code-to-chat` folder.

## Python and JavaScript offline (optional)

JavaScript and Python run locally when possible. If the local runner is unavailable (no Pyodide folder for Python, or the browser blocks the local JavaScript sandbox), the extension automatically uses the online Judge0 runner instead, so both languages still work with internet.

To make Python run offline:

1. Download a Pyodide release from https://github.com/pyodide/pyodide/releases (the `pyodide-<version>.tar.bz2` file).
2. Extract it and copy the contents into a folder named `pyodide` inside `code-to-chat`, so that `code-to-chat/pyodide/pyodide.js` exists (along with `pyodide.asm.js`, `pyodide.asm.wasm`, `python_stdlib.zip` and `pyodide-lock.json`).
3. Reload the extension.

## After reloading the extension

Tabs that were already open do not get the new code until you refresh them (Ctrl+R). A tab opened after the reload works straight away.

## Unsolved challenges come back

When a challenge pops up, the extension records it as pending. If you close the tab (or the whole browser) without passing the tests, the same challenge appears again the next time you open any AI site, immediately and with no random chance. It is cleared only when every test passes. Solving it in one tab unlocks your other open AI tabs too.

## C, C++, C# and Java

These run on a remote Judge0 server (`config.js`), so they need internet and your code is sent to that server. They use stdin/stdout: read input, print the answer. The public server is free but rate limited. To self-host, change `JUDGE0_URL` in `config.js` and add the same origin to `host_permissions` in `manifest.json`.

## Tune the randomness

Edit the `CFG` block at the top of `content.js`:

- `testMode`: while `true`, a challenge appears on every visit and there is no cooldown. Set it to `false` for real use.
- `chanceOnLoad`: chance of a challenge when you open the site or type its address
- `chanceOnReturn`: chance of a challenge when you switch back to an already-open tab
- `loadDelaySec`: random delay before it appears
- `recurMin`: random minutes between challenges while you stay on the site
- `graceOptionsMin`: after each solve, the quiet time is picked at random from this list (default 3, 5, 10, 15, 20, 30, 45 or 60 minutes)

## The editor

The code box shows line numbers and VS Code style colours (keywords, strings, comments, numbers, functions, types and constructors, variables). When code fails to compile or crashes, the offending line number is marked in red. Line numbers for JavaScript syntax errors are not available (the browser doesn't report them); other errors are.

## No copy and paste

On the challenge page, copy, cut and paste are blocked everywhere: keyboard shortcuts (Ctrl/Cmd+C, V, X, Ctrl+Insert, Shift+Insert, Shift+Delete), the right-click menu, drag and drop, and middle-click paste. The page text can't be selected either, so the question can't be copied out. This stops casual cheating, but it can't stop someone retyping the question elsewhere or using OS-level tools.

## Add challenges or sites

- Challenges: add an entry to `CHALLENGES` in `challenges.js` (one `mk(...)` line: function form with tests, plus an `io` form with a prompt and input/output tests for C, C++, C# and Java). A new challenge is picked at random and is never the same as the previous one.
- Sites: add a URL pattern to both `matches` lists in `manifest.json`.

## Known limits

- It locks the page, not the browser. Someone can still close the tab, switch tabs, or disable the extension.
- Firefox is not supported yet: it has no `sandbox` manifest key, so the JavaScript runner needs a different approach.
- Only lightly tested in a live browser so far, so expect a bug or two.