---
name: crib-drag-calculator
description: Solve OTP (One-Time Pad) crib drag attacks for "reuse two" scenarios. Use when the user asks to crack OTP, XOR two ciphertexts, do a crib drag attack, or break a reused one-time pad.
---

# Crib Drag Calculator — Agent Interface

Solve OTP (One-Time Pad) crib drag attacks via a web interface. When the same one-time pad key encrypts two messages, XORing the ciphertexts gives PT1 XOR PT2. By guessing words (cribs) in one message, you can decrypt the other.

## IMPORTANT: Use a Browser Tool

This page runs entirely client-side (JavaScript performs all XOR and crib analysis).
**DO NOT** use curl, fetch, or any HTTP tool that doesn't execute JavaScript — you will only get an empty `<div id="app"></div>`.

Use **agent-browser** (see commands below). If you don't have it, see https://github.com/vercel-labs/agent-browser.

## Base URL

[https://toolbox.lotusfa.com/crib-drag/agent.html](https://toolbox.lotusfa.com/crib-drag/agent.html)

## Quick Start — Copy These Commands

```bash
# Round 1: Set up ciphertexts + try a crib (one Bash call)
Bash(agent-browser open "URL?ct1=HEX1&ct2=HEX2&crib=hello" && agent-browser wait --load networkidle && agent-browser get text pre)

# Round 2+: Only change crib (ciphertexts are cached in browser localStorage)
Bash(agent-browser open "URL?crib=world" && agent-browser wait --load networkidle && agent-browser get text pre)

# Accept a result at position N and try a new crib
Bash(agent-browser open "URL?crib=newword&accepted=N,hello,decrypted_text" && agent-browser wait --load networkidle && agent-browser get text pre)

# Clear cached ciphertexts when done
Bash(agent-browser open "URL?clear=1" && agent-browser wait --load networkidle && agent-browser get text pre)
```

Replace `URL` with the base URL above. Each Bash call combines open + wait + extract in one command.

## How the Attack Works

1. Two messages encrypted with the same OTP key: `CT1 = PT1 ⊕ Key`, `CT2 = PT2 ⊕ Key`
2. XOR the ciphertexts: `CT1 ⊕ CT2 = PT1 ⊕ PT2`
3. Guess a word (crib) in PT1, XOR it with `CT1⊕CT2` to reveal PT2 at that position
4. Use revealed PT2 to guess more words, iteratively decrypting both messages

## Iterative Workflow

This is an **iterative** tool — loop through crib guesses, building up known plaintext each round. The page caches `ct1`, `ct2`, and `accepted` state in localStorage, so after the first call you only need to pass `crib=WORD`.

### Step-by-Step

1. **First call**: Pass `ct1`, `ct2`, and a crib guess. The ciphertexts are cached automatically.
2. **Read JSON output**: Look for `matching_results` where `decrypted` looks like valid text.
3. **Next crib**: Just open `?crib=NEW_WORD` — no need to repeat ct1/ct2.
4. **Accept a result**: Add `accepted=position,crib,decrypted` to track known plaintext.
5. **Repeat** until `current_state.output1` and `current_state.output2` have no more `.` (unknown) characters.

### Example Session

```bash
URL="https://toolbox.lotusfa.com/crib-drag/agent.html"

# Round 1: Set up + try "hello"
Bash(agent-browser open "$URL?ct1=3b101c091d53320c000910&ct2=071d154502010a04000419&crib=hello" && agent-browser wait --load networkidle && agent-browser get text pre)
# Output: matching_results[0] = {position: 0, decrypted: "The p"}

# Round 2: Just try a new crib — ciphertexts cached
Bash(agent-browser open "$URL?crib=World" && agent-browser wait --load networkidle && agent-browser get text pre)
# Output: current_state shows output1="hello......" output2="The p......"

# Round 3: Try full-length crib to solve
Bash(agent-browser open "$URL?crib=Hello%20World" && agent-browser wait --load networkidle && agent-browser get text pre)
# Output: position 0, decrypted="the program" — SOLVED!

# Clean up
Bash(agent-browser open "$URL?clear=1" && agent-browser wait --load networkidle)
```

## URL Parameters

| Param | Required | Description |
|-------|----------|-------------|
| `ct1` | First call | First ciphertext (cached after first call) |
| `ct2` | First call | Second ciphertext (cached after first call) |
| `crib` | Every call | Guessed plaintext word (ASCII, URL-encoded if needed) |
| `c1type` | No | Format of ct1: `hex` (default), `ascii`, `bin` |
| `c2type` | No | Format of ct2: `hex` (default), `ascii`, `bin` |
| `charset` | No | Allowed chars for filtering. Default: `a-zA-Z0-9.,?! :;'` |
| `accepted` | No | Accepted cribs: `index,crib,decrypted` (use `;` to separate) |
| `accepted2` | No | Same format, for accepting from output2 side |
| `clear` | No | `?clear=1` to wipe cached ciphertexts |

## Output JSON

The page renders JSON in a `<pre>` element. Key fields:

| Field | Description |
|-------|-------------|
| `status` | `"success"` or `"error"` |
| `results[]` | All positions: `{position, decrypted, matches_charset}` |
| `matching_results[]` | Positions where decrypted text is printable |
| `current_state.output1` | Partially decrypted output 1 (`.` = unknown) |
| `current_state.output2` | Partially decrypted output 2 (`.` = unknown) |
| `iteration.next_url` | URL for next round (just change crib= parameter) |

## Agent Strategy Tips

1. **Start with common words**: `the`, `and`, `hello`, `password`, `flag`, `secret`
2. **Look at context**: If the task mentions a CTF flag, try `flag{`, `CTF{`, `FLAG{`
3. **Use revealed text**: Once you see partial plaintext, use words from it to guide your next crib
4. **Try longer cribs**: Once you know parts of both messages, try the full plaintext as a crib
5. **Clear when done**: Use `?clear=1` to reset cached state between different problems

## Notes

- Ciphertexts are cached in browser localStorage — after the first call, only `crib=WORD` is needed.
- This solves "reuse two" attacks (two ciphertexts, same key). For three+ ciphertexts, solve pairs independently.
