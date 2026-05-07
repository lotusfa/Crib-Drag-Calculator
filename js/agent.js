/**
 * Agent interface — Crib Drag Calculator
 * Loaded by agent.html via <script type="module">.
 * Solves OTP crib drag attacks via URL query parameters, outputs JSON.
 */

const app = document.getElementById('app');

// ============================================
// Conversion functions (mirrored from main.js)
// ============================================

function hexStrToArr(hex) {
  hex = hex.replace(/[^0-9a-fA-F]/g, '');
  if (hex.length % 2 !== 0) return [];
  const arr = [];
  for (let i = 0; i < hex.length / 2; i++) {
    arr[i] = hex.substr(i * 2, 2);
  }
  return arr;
}

function asciiToHexArr(str) {
  const arr = [];
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return arr;
}

function binToHexArr(bin) {
  if (bin.length % 4 !== 0) return [];
  const hex = parseInt(bin, 2).toString(16).padStart(Math.ceil(bin.length / 4), '0');
  return hexStrToArr(hex);
}

function hexArrToAscii(arr) {
  let str = '';
  for (const h of arr) {
    str += String.fromCharCode(parseInt(h, 16));
  }
  return str;
}

function xorHex(a, b) {
  let r = (parseInt(a, 16) ^ parseInt(b, 16)).toString(16);
  if (r.length === 1) r = '0' + r;
  return r;
}

function xorHexArr(arr1, arr2) {
  const result = [];
  const len = Math.max(arr1.length, arr2.length);
  for (let i = 0; i < len; i++) {
    result[i] = xorHex(arr1[i], arr2[i]);
  }
  return result;
}

/**
 * Convert ciphertext string to hex array based on type.
 */
function parseCiphertext(ct, type) {
  switch (type) {
    case 'hex': return hexStrToArr(ct);
    case 'ascii': return asciiToHexArr(ct);
    case 'bin': return binToHexArr(ct);
    default: return [];
  }
}

/**
 * Slide a crib across the XOR of two ciphertexts.
 * Returns array of { position, decrypted }.
 */
function slideCrib(xorArr, cribHexArr) {
  const results = [];
  for (let i = 0; i <= xorArr.length - cribHexArr.length; i++) {
    const decrypted = [];
    for (let j = 0; j < cribHexArr.length; j++) {
      decrypted.push(xorHex(cribHexArr[j], xorArr[i + j]));
    }
    results.push({
      position: i,
      decrypted_hex: decrypted,
      decrypted: hexArrToAscii(decrypted),
    });
  }
  return results;
}

/**
 * Check if a string matches the allowed character set.
 */
function matchesCharset(str, charset) {
  if (!str) return false;
  try {
    return !!str.match(new RegExp(`^[${charset}]+$`));
  } catch {
    return false;
  }
}

/**
 * Build state arrays from accepted crib results.
 * Accepted format: "index,crib,decrypted" (applies to output1)
 * Accepted2 format: "index,crib,decrypted" (applies to output2)
 */
function buildState(hexArr, acceptedArr) {
  const state = '.'.repeat(hexArr.length);
  for (const a of acceptedArr) {
    const idx = a.index;
    const text = a.text;
    state = state.substr(0, idx) + text + state.substr(idx + text.length);
  }
  return state;
}

/**
 * Apply accepted cribs to compute both output states.
 * When a crib is accepted at position i for output1:
 *   output1[i..i+n] = crib (known plaintext)
 *   output2[i..i+n] = decrypted (XOR result)
 */
function computeStates(ct1Len, ct2Len, accepted1, accepted2) {
  let out1 = '.'.repeat(ct1Len);
  let out2 = '.'.repeat(ct2Len);

  for (const a of accepted1) {
    out1 = out1.substr(0, a.index) + a.crib + out1.substr(a.index + a.crib.length);
    out2 = out2.substr(0, a.index) + a.decrypted + out2.substr(a.index + a.decrypted.length);
  }
  for (const a of accepted2) {
    out2 = out2.substr(0, a.index) + a.crib + out2.substr(a.index + a.crib.length);
    out1 = out1.substr(0, a.index) + a.decrypted + out1.substr(a.index + a.decrypted.length);
  }

  return { output1: out1, output2: out2 };
}

/**
 * Parse accepted parameter: "index,crib,decrypted" repeated with ";" separator.
 */
function parseAccepted(param) {
  if (!param) return [];
  const entries = [];
  for (const part of param.split(';')) {
    const pieces = part.split(',');
    if (pieces.length >= 3) {
      entries.push({
        index: parseInt(pieces[0], 10),
        crib: pieces[1],
        decrypted: pieces.slice(2).join(','),
      });
    }
  }
  return entries;
}

/**
 * Escape HTML for safe display.
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// localStorage — cache inputs across iterations
// ============================================

const STORAGE_KEY = 'crib-drag-cache';

function loadCache() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

function saveCache(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function clearCache() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

// ============================================
// Main entry — parse URL params and run
// ============================================

const params = new URLSearchParams(window.location.search);

// Clear cache if requested
if (params.get('clear')) {
  clearCache();
  showCleared();
} else {
  // Merge: URL params override cached values
  const cache = loadCache();
  const ct1 = params.get('ct1') ?? cache.ct1 ?? null;
  const ct2 = params.get('ct2') ?? cache.ct2 ?? null;
  const crib = params.get('crib');

  if (params.get('ct1') !== null || params.get('ct2') !== null) {
    // Save/update cache from URL params
    saveCache({
      ct1: params.get('ct1') ?? cache.ct1,
      ct2: params.get('ct2') ?? cache.ct2,
      c1type: (params.get('c1type') ?? cache.c1type ?? 'hex').toLowerCase(),
      c2type: (params.get('c2type') ?? cache.c2type ?? 'hex').toLowerCase(),
      charset: params.get('charset') ?? cache.charset ?? "a-zA-Z0-9.,?! :;'",
      accepted: params.get('accepted') ?? cache.accepted,
      accepted2: params.get('accepted2') ?? cache.accepted2,
    });
  }

  if (!ct1 || !ct2 || !crib) {
    showDocumentation(ct1 && ct2);
  } else {
    app.innerHTML = '<pre id="output" class="loading">Loading...</pre>';
    try {
      const result = await runAgent();
      const outputEl = document.getElementById('output');
      outputEl.textContent = JSON.stringify(result, null, 2);
    } catch (e) {
      showError(e.message);
    }
  }
}

function runAgent() {
  const cache = loadCache();
  const c1type = (params.get('c1type') ?? cache.c1type ?? 'hex').toLowerCase();
  const c2type = (params.get('c2type') ?? cache.c2type ?? 'hex').toLowerCase();
  const charset = params.get('charset') ?? cache.charset ?? "a-zA-Z0-9.,?! :;'";
  const showAll = params.get('show_all') === '1' || cache.showAll === '1';
  const accepted1 = parseAccepted(params.get('accepted') ?? cache.accepted);
  const accepted2 = parseAccepted(params.get('accepted2') ?? cache.accepted2);

  const crib = params.get('crib');
  // Use cached ct/ct2 if not in URL
  const ct1 = params.get('ct1') ?? cache.ct1;
  const ct2 = params.get('ct2') ?? cache.ct2;

  // Validate types
  const validTypes = ['hex', 'ascii', 'bin'];
  if (!validTypes.includes(c1type)) {
    throw new Error(`Invalid c1type "${params.get('c1type')}". Valid: ${validTypes.join(', ')}`);
  }
  if (!validTypes.includes(c2type)) {
    throw new Error(`Invalid c2type "${params.get('c2type')}". Valid: ${validTypes.join(', ')}`);
  }

  // Parse ciphertexts
  const ct1Arr = parseCiphertext(ct1, c1type);
  const ct2Arr = parseCiphertext(ct2, c2type);

  if (ct1Arr.length === 0) {
    throw new Error('Failed to parse ciphertext 1. Check the input and c1type.');
  }
  if (ct2Arr.length === 0) {
    throw new Error('Failed to parse ciphertext 2. Check the input and c2type.');
  }

  // Compute XOR
  const xorArr = xorHexArr(ct1Arr, ct2Arr);

  // Parse crib
  const cribHexArr = asciiToHexArr(crib);
  if (cribHexArr.length === 0) {
    throw new Error('Crib word cannot be empty.');
  }
  if (cribHexArr.length > xorArr.length) {
    throw new Error(`Crib length (${cribHexArr.length}) exceeds ciphertext XOR length (${xorArr.length}).`);
  }

  // Slide crib across XOR
  const slideResults = slideCrib(xorArr, cribHexArr);

  // Filter results by charset
  const filtered = slideResults.filter(r => matchesCharset(r.decrypted, charset));

  // Compute current state from accepted results
  const states = computeStates(ct1Arr.length, ct2Arr.length, accepted1, accepted2);

  // Build next-iteration URL (short — ciphertexts cached in localStorage)
  const baseUrl = window.location.origin + window.location.pathname;

  // Build output JSON
  const output = {
    tool: 'crib-drag-calculator',
    status: 'success',
    params: {
      c1type,
      c2type,
      crib,
      charset,
      show_all: showAll,
      filter_enabled: !showAll,
    },
    ciphertexts: {
      ct1_hex: ct1Arr.join(''),
      ct2_hex: ct2Arr.join(''),
      ct1_length: ct1Arr.length,
      ct2_length: ct2Arr.length,
    },
    xor_hex: xorArr.join(''),
    current_state: {
      output1: states.output1,
      output2: states.output2,
    },
    results: (showAll ? slideResults : filtered).map(r => ({
      position: r.position,
      decrypted: r.decrypted,
      matches_charset: showAll ? matchesCharset(r.decrypted, charset) : true,
    })),
    matching_results: filtered.map(r => ({
      position: r.position,
      decrypted: r.decrypted,
    })),
    iteration: {
      cached: true,
      next_url: `${baseUrl}?crib=NEW_CRIB`,
      description: `Ciphertexts cached in browser. Next round: only change crib= parameter. To accept position N: add accepted=N,crib,decrypted. Show all positions: &show_all=1. Clear cache: ?clear=1`
    }
  };

  return output;
}

function showError(msg) {
  const output = {
    tool: 'crib-drag-calculator',
    status: 'error',
    error: msg,
  };
  app.innerHTML = `<pre class="error">${escapeHtml(JSON.stringify(output, null, 2))}</pre>`;
}

function showCleared() {
  app.innerHTML = `<pre>Cleared. Ready for new ciphertexts.\nUsage: ?ct1=...&amp;ct2=...&amp;crib=WORD</pre>`;
}

// ============================================
// Documentation Mode (no params)
// ============================================

function showDocumentation(hasCache) {
  const cache = loadCache();
  const hasCt = cache.ct1 && cache.ct2;
  const cacheInfo = hasCt ? `<pre class="code-block">Cached: ct1=${escapeHtml(cache.ct1)}  ct2=${escapeHtml(cache.ct2)}\nNext: just add &amp;crib=WORD to try a guess.\nClear: ?clear=1</pre>` : '';

  app.innerHTML = `<div class="doc">
<h1>Crib Drag Calculator — Agent Interface</h1>
<p>Solve OTP (One-Time Pad) crib drag attacks via URL parameters. Outputs JSON for agent consumption.</p>
<p><a href="SKILL.md">SKILL.md</a> — Agent usage guide (copy to your skill folder)</p>

${cacheInfo}

<h2>Prerequisites</h2>
<p><b>Required Tooling</b> — use a browser-based tool like agent-browser or a headless engine (Playwright/Puppeteer) that executes JavaScript.</p>

<h2>Usage</h2>
<pre class="code-block"># First call: set up ciphertexts + try a crib (auto-caches in localStorage)
agent.html?ct1=&lt;ciphertext1&gt;&amp;ct2=&lt;ciphertext2&gt;&amp;crib=&lt;guess&gt;

# Next calls: only crib needed (ct1/ct2 cached in browser)
agent.html?crib=&lt;new_guess&gt;

# Clear cached state
agent.html?clear=1</pre>

<h2>Parameters</h2>
<table>
<tr><th>Param</th><th>Required</th><th>Description</th></tr>
<tr><td><code>ct1</code></td><td>Yes</td><td>First ciphertext</td></tr>
<tr><td><code>ct2</code></td><td>Yes</td><td>Second ciphertext</td></tr>
<tr><td><code>crib</code></td><td>Yes</td><td>Guessed plaintext word to slide (ASCII)</td></tr>
<tr><td><code>c1type</code></td><td>No</td><td>Format of ct1: <code>hex</code> (default), <code>ascii</code>, <code>bin</code></td></tr>
<tr><td><code>c2type</code></td><td>No</td><td>Format of ct2: <code>hex</code> (default), <code>ascii</code>, <code>bin</code></td></tr>
<tr><td><code>charset</code></td><td>No</td><td>Allowed characters for filtering. Default: <code>a-zA-Z0-9.,?! :;'</code></td></tr>
<tr><td><code>show_all</code></td><td>No</td><td><code>?show_all=1</code> to show ALL positions (default: only matching results)</td></tr>
<tr><td><code>accepted</code></td><td>No</td><td>Accepted cribs for output1: <code>index,crib,decrypted</code> (use <code>;</code> to separate multiple)</td></tr>
<tr><td><code>accepted2</code></td><td>No</td><td>Accepted cribs for output2: same format as <code>accepted</code></td></tr>
</table>

<h2>Workflow (Iterative)</h2>
<ol>
<li><b>Step 1:</b> Navigate with ct1, ct2, and a crib guess. Read the JSON output.</li>
<li><b>Step 2:</b> Find a result where <code>matches_charset: true</code> and the <code>decrypted</code> text looks like valid plaintext.</li>
<li><b>Step 3:</b> Accept that result by adding <code>accepted=index,crib,decrypted</code> to the URL and try a new crib.</li>
<li><b>Step 4:</b> Repeat until both outputs are fully decrypted.</li>
</ol>

<h2>Output JSON Fields</h2>
<table>
<tr><th>Field</th><th>Description</th></tr>
<tr><td><code>status</code></td><td><code>"success"</code> or <code>"error"</code></td></tr>
<tr><td><code>xor_hex</code></td><td>XOR of the two ciphertexts (hex string)</td></tr>
<tr><td><code>results[]</code></td><td>All positions: <code>{position, decrypted, matches_charset}</code></td></tr>
<tr><td><code>matching_results[]</code></td><td>Only positions where decrypted text matches the charset</td></tr>
<tr><td><code>current_state.output1</code></td><td>Partially decrypted output 1 (<code>.</code> = unknown)</td></tr>
<tr><td><code>current_state.output2</code></td><td>Partially decrypted output 2 (<code>.</code> = unknown)</td></tr>
<tr><td><code>iteration.next_url_template</code></td><td>URL template for the next iteration with state preserved</td></tr>
</table>

<h2>Example</h2>
<pre class="code-block"># Step 1: Set up ciphertexts + try a crib (cached automatically)
?ct1=00736332696b&ct2=0f0f08474a5d&crib=hello

# Step 2: Only crib needed — ct1/ct2 cached in localStorage
?crib=world

# Step 3: Accept a result, try another crib
?crib=secret&accepted=0,hello,The%20p

# Clear cached state when done
?clear=1</pre>

<h2>Notes</h2>
<ul>
<li>This tool solves "reuse two" OTP attacks where the same pad encrypts two messages.</li>
<li>The crib is slid across every position of CT1 XOR CT2.</li>
<li><code>matches_charset: true</code> indicates the decrypted text contains only printable characters from the charset.</li>
<li>Use <code>accepted</code> and <code>accepted2</code> to track known plaintext across iterations.</li>
</ul>
</div>`;
}
