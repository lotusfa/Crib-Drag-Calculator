---
name: crib-drag-calculator
description: Solve OTP (One-Time Pad) crib drag attacks for "reuse two" scenarios. Use when the user asks to crack OTP, XOR two ciphertexts, do a crib drag attack, or break a reused one-time pad.
---

# Crib Drag Calculator — Agent Interface

Solve OTP (One-Time Pad) crib drag attacks via a web interface. When the same one-time pad key encrypts two messages, XORing the ciphertexts gives PT1 XOR PT2. By guessing words (cribs) in one message, you can decrypt the other.

## IMPORTANT: Use a Browser Tool

This page runs entirely client-side (JavaScript performs all XOR and crib analysis).
**DO NOT** use curl, fetch, or any HTTP tool that doesn't execute JavaScript — you will only get an empty `<div id="app"></div>`.

Use **agent-browser** (open, wait for load, extract text from `pre` element) or a headless browser (Playwright/Puppeteer).

## Prerequisites

**Required Tooling**

To use this, you must use a browser-based tool like [agent-browser](https://github.com/anthropics/claude-code) or a headless engine (Playwright/Puppeteer) that executes JavaScript.

## Base URL

[https://toolbox.lotusfa.com/crib-drag/agent.html](https://toolbox.lotusfa.com/crib-drag/agent.html)

## How the Attack Works

1. Two messages encrypted with the same OTP key: `CT1 = PT1 ⊕ Key`, `CT2 = PT2 ⊕ Key`
2. XOR the ciphertexts: `CT1 ⊕ CT2 = PT1 ⊕ PT2`
3. Guess a word (crib) in PT1, XOR it with `CT1⊕CT2` to reveal PT2 at that position
4. Use revealed PT2 to guess more words, iteratively decrypting both messages

## Iterative Workflow

This is an **iterative** tool — you must loop through crib guesses, building up known plaintext each round.

### Step-by-Step

1. **First request**: Navigate with `ct1`, `ct2`, and a crib guess. Parse the JSON output.
2. **Find a match**: Look for `matching_results` where `decrypted` looks like valid text (English words, readable content).
3. **Accept the result**: Add `accepted=position,crib,decrypted` to preserve state. Try a new crib.
4. **Repeat**: Use `current_state.output1` and `current_state.output2` to see progress. Unknown bytes show as `.`.

### Example Session

```bash
# Round 1: Try common word "the"
agent-browser open "https://toolbox.lotusfa.com/crib-drag/agent.html?ct1=00736332696b&ct2=0f0f08474a5d&crib=the"
agent-browser wait --load networkidle
agent-browser get text pre  # Parse JSON output

# Found match at position 2: decrypted="hello"
# Round 2: Accept that result, try "and"
agent-browser open "https://toolbox.lotusfa.com/crib-drag/agent.html?ct1=00736332696b&ct2=0f0f08474a5d&crib=and&accepted=2,the,hello"
agent-browser wait --load networkidle
agent-browser get text pre

# Round 3: Use revealed plaintext to guide next crib...
```

### Using WebFetch

```
WebFetch url="https://toolbox.lotusfa.com/crib-drag/agent.html?ct1=00736332696b&ct2=0f0f08474a5d&crib=hello" prompt="Extract the JSON output from the page. Focus on matching_results and current_state."
```

## URL Parameters

| Param | Required | Description |
|-------|----------|-------------|
| `ct1` | Yes | First ciphertext |
| `ct2` | Yes | Second ciphertext |
| `crib` | Yes | Guessed plaintext word (ASCII, URL-encoded if needed) |
| `c1type` | No | Format of ct1: `hex` (default), `ascii`, `bin` |
| `c2type` | No | Format of ct2: `hex` (default), `ascii`, `bin` |
| `charset` | No | Allowed chars for filtering. Default: `a-zA-Z0-9.,?! :;'` |
| `accepted` | No | Accepted cribs for output1: `index,crib,decrypted` (use `;` to separate multiple) |
| `accepted2` | No | Accepted cribs for output2: same format as `accepted` |

## Output JSON

The page renders JSON in a `<pre>` element. Key fields:

| Field | Description |
|-------|-------------|
| `status` | `"success"` or `"error"` |
| `xor_hex` | XOR of the two ciphertexts (hex string) |
| `results[]` | All positions: `{position, decrypted, matches_charset}` |
| `matching_results[]` | Positions where decrypted text matches the charset |
| `current_state.output1` | Partially decrypted output 1 (`.` = unknown) |
| `current_state.output2` | Partially decrypted output 2 (`.` = unknown) |
| `iteration.next_url_template` | URL template for next iteration with state preserved |
| `iteration.description` | Instructions for the next step |

## Agent Strategy Tips

1. **Start with common words**: `the`, `and`, `hello`, `password`, `flag`, `secret`
2. **Look at context**: If the task mentions a CTF flag, try `flag{`, `CTF{`, `FLAG{`
3. **Use revealed text**: Once you see partial plaintext, use words from it to guide your next crib
4. **Check both outputs**: A match on output2 might reveal a word you can use as a crib for output1
5. **Adjust charset**: If you expect numbers/special chars, expand the charset parameter
6. **Track state**: Always carry forward `accepted` params to preserve known plaintext

## Examples

- [Basic hex XOR](https://toolbox.lotusfa.com/crib-drag/agent.html?ct1=00736332696b&ct2=0f0f08474a5d&crib=hello)
- [ASCII input](https://toolbox.lotusfa.com/crib-drag/agent.html?ct1=abc&ct2=xyz&c1type=ascii&c2type=ascii&crib=test)
- [With accepted state](https://toolbox.lotusfa.com/crib-drag/agent.html?ct1=00736332696b&ct2=0f0f08474a5d&crib=world&accepted=0,hello,decrypted)
- [Documentation page](https://toolbox.lotusfa.com/crib-drag/agent.html) (no params)

## Notes

- Visit [without parameters](https://toolbox.lotusfa.com/crib-drag/agent.html) to see the full documentation page.
- Non-ASCII crib input must be URL-encoded.
- This solves "reuse two" attacks (two ciphertexts, same key). For three+ ciphertexts, solve pairs independently.
