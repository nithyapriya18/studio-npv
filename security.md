# Plan: Refactoring + Architect + Security Engineer Skills, Auto-Hooked at Edit Time and Merge Time

> **Dual purpose:** this file is the implementation plan AND the shareable spec. A teammate, or a fresh Claude Code instance on another machine, should be able to read this top-to-bottom and end up with an identical setup.

---

## 1. Context

**Why this is being introduced.** Manager asked us to shift code-quality, architecture, and security review *left* — to the moment code first lands in `dev`, instead of accumulating debt that gets fixed in big-bang remediation passes later. The mechanism is three Claude Code "expert" personas that always run when code is being written and again as a final gate before any merge to `dev` or `main`:

- **Refactoring engineer** — catches code smells, deduplication opportunities, dead code, and over-engineering before they enter `dev`.
- **Software architect** — reviews module boundaries, layering, coupling, and design decisions on the same merge.
- **Security engineer** — runs an OWASP / authn-authz / secrets / dependency-CVE pass.

**Outcome.** Every meaningful change to code triggers a lightweight nudge; every merge into `dev` or `main` triggers a full three-role review. No human discipline required — Claude Code's hook system runs this deterministically.

**Constraint observed during planning.** The user's `~/.claude/` is heavily customized: 28 skills, 15 agents, an `~/.ai_configs/` symlinked layout `~/.claude/skills` → `~/.ai_configs/skills`, `~/.claude/agents` → `~/.ai_configs/agents`), and an existing `settings.json` with 7 hooks already wired (path-traversal-guard, auto-format, lint-check, run-tests-async, audit-log, require-tests-pass, desktop-notify). The plan **adds** to that — it does not rewrite the existing hook block.

---

## 2. What we're installing (decisions, locked)

| Role                 | Install as                                                                                                               | Source                                                                                                                                                                 | Replaces                                                                   |

| -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |

| Refactoring engineer | Subagent `refactoring-specialist` in `~/.ai_configs/agents/refactoring-specialist.md`                                    | [VoltAgent/awesome-claude-code-subagents]([https://github.com/VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)) — `categories/06-developer-experience/refactoring-specialist.md` | Nothing — this was the actual gap                                          |

| Software architect   | Subagent `architect-reviewer` in `~/.ai_configs/agents/architect-reviewer.md`                                            | [VoltAgent/awesome-claude-code-subagents]([https://github.com/VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)) — `categories/04-quality-security/architect-reviewer.md`         | Existing `architect` agent → archived                                      |

| Security engineer    | Skill collection under `~/.ai_configs/skills/security-engineer/` (one parent [SKILL.md](http://SKILL.md) plus the Trail of Bits sub-skills) | [trailofbits/skills]([https://github.com/trailofbits/skills](https://github.com/trailofbits/skills))                                                                                                            | Existing `security-expert` agent + `security-review` skill → both archived |

All three are **free, MIT-licensed** markdown files.

**Kept untouched** (complementary, not duplicates): the existing `code-review` skill, all 15 other agents, all other skills, and every existing hook.

---

## 3. Layout after install

```

~/.ai_configs/

├── _archive/2026-04-13-prereplace/

│   ├── [architect.md](http://architect.md)                 # archived old agent

│   ├── [security-expert.md](http://security-expert.md)           # archived old agent

│   └── security-review/             # archived old skill dir

├── agents/

│   ├── [refactoring-specialist.md](http://refactoring-specialist.md)    # NEW (VoltAgent)

│   ├── [architect-reviewer.md](http://architect-reviewer.md)        # NEW (VoltAgent)

│   └── ...15 other agents unchanged

└── skills/

    ├── security-engineer/           # NEW (Trail of Bits)

    │   ├── [SKILL.md](http://SKILL.md)

    │   └── ...sub-skill files

    └── ...27 other skills unchanged

~/.claude/hooks/

├── [merge-review-nudge.sh](http://merge-review-nudge.sh)            # NEW

├── [edit-refactor-nudge.sh](http://edit-refactor-nudge.sh)           # NEW

└── ...existing hook scripts unchanged

```

---

## 4. Hook design

Two new hooks added to `~/.claude/settings.json`. Both are **non-blocking** — they exit 0 and inject `additionalContext` so Claude is nudged to invoke the right skill/agent. Neither hook spawns subagents itself; Claude decides whether to invoke `refactoring-specialist`, `architect-reviewer`, and `security-engineer` based on the injected reminder.

### 4a. `PreToolUse` on `Bash` — full three-role review on merge to dev/main

- **Event:** `PreToolUse`
- **Matcher:** `Bash`
- *`if`:** `Bash(git merge )` *OR* `Bash(git push )` (two entries — Claude Code's `if` field, v2.1.85+, takes a single permission-rule pattern per entry)
- **Script:** `~/.claude/hooks/merge-review-nudge.sh`
- **What the script does:** reads stdin JSON, parses `tool_input.command`, checks whether the target branch is `dev` or `main` (or `master`). If yes, prints the JSON below and exits 0. If no (e.g., `git merge feature/foo`), prints `{}` and exits 0 (no-op).

```json

{

  "hookSpecificOutput": {

    "hookEventName": "PreToolUse",

    "permissionDecision": "allow",

    "additionalContext": "MERGE GATE: this is a merge into dev/main. Before proceeding, invoke these three reviewers in parallel via Task: (1) refactoring-specialist agent — find dead code, smells, simplification opportunities; (2) architect-reviewer agent — assess module boundaries, layering, coupling; (3) security-engineer skill (Trail of Bits) — OWASP, secrets, authn/authz, dependency CVEs. Report findings, apply non-trivial fixes, then re-run the merge."

  }

}

```

### 4b. `PostToolUse` on `Edit|Write|MultiEdit` — lightweight per-edit nudge

- **Event:** `PostToolUse`
- **Matcher:** `Edit|Write|MultiEdit`
- **Script:** `~/.claude/hooks/edit-refactor-nudge.sh`
- **What the script does:** uses a per-session marker file `/tmp/claude-refactor-nudge-${session_id}`) to ensure the nudge fires **at most once per N edits** (default: every 10th edit), not after every single keystroke. Keeps context-window pressure low. On firing, prints:

```json

{

  "hookSpecificOutput": {

    "hookEventName": "PostToolUse",

    "additionalContext": "Several files have been edited this session. Quick check: are you trending toward something the refactoring-specialist agent would simplify? If you've added duplication, dead branches, or premature abstraction, fix it now — the merge-to-dev gate will block on it."

  }

}

```

### 4c. Why nudge-only and not block

User picked "Nudge only" in plan questions. Rationale: blocking hooks become friction quickly; an injected system reminder is enough — Claude is highly compliant with `additionalContext` in practice and the merge gate is reinforced by the second hook firing every time the user retries.

---

## 5. Files to create — full contents

### 5a. `~/.claude/hooks/merge-review-nudge.sh`

```bash

#!/usr/bin/env bash

# [merge-review-nudge.sh](http://merge-review-nudge.sh) — PreToolUse(Bash) hook

# Fires when Claude is about to run `git merge` or `git push`. If the target

# branch is dev/main/master, injects an additionalContext reminder telling

# Claude to invoke refactoring-specialist + architect-reviewer + security-engineer

# before completing the merge. Otherwise no-op.

#

# Always exits 0 (non-blocking).

set -euo pipefail

input="$(cat)"

command="$(printf '%s' "$input" | jq -r '.tool_input.command // ""')"

# Match: `git merge <branch>` or `git push [origin] <branch>` where branch is dev|main|master

target=""

if [[ "$command" =~ git[[:space:]]+merge[[:space:]]+([^[:space:]]+) ]]; then

  target="${BASH_REMATCH[1]}"

elif [[ "$command" =~ git[[:space:]]+push[[:space:]]+(--[a-z-]+[[:space:]]+)*([^[:space:]]+[[:space:]]+)?([^[:space:]:]+)(:[^[:space:]]+)? ]]; then

  # crude: take the last bare token as the branch

  target="${BASH_REMATCH[3]}"

fi

case "$target" in

  dev|main|master|origin/dev|origin/main|origin/master)

    cat <<'JSON'

{

  "hookSpecificOutput": {

    "hookEventName": "PreToolUse",

    "permissionDecision": "allow",

    "additionalContext": "MERGE GATE (dev/main): before this merge completes, run all three reviewers in parallel via the Task tool — (1) refactoring-specialist agent: dead code, smells, dedup, premature abstraction; (2) architect-reviewer agent: module boundaries, layering, coupling, design patterns; (3) security-engineer skill: OWASP top 10, secrets, authn/authz, dependency CVEs, supply chain. Apply non-trivial fixes BEFORE re-running the merge. Do not skip — this is the only gate."

  }

}

JSON

    ;;

  *)

    echo "{}"

    ;;

esac

exit 0

```

### 5b. `~/.claude/hooks/edit-refactor-nudge.sh`

```bash

#!/usr/bin/env bash

# [edit-refactor-nudge.sh](http://edit-refactor-nudge.sh) — PostToolUse(Edit|Write|MultiEdit) hook

# Fires after every code edit. Uses a per-session counter to nudge at most

# once every 10 edits, so the context window does not get spammed.

#

# Always exits 0 (non-blocking).

set -euo pipefail

input="$(cat)"

session_id="$(printf '%s' "$input" | jq -r '.session_id // "unknown"')"

counter_file="/tmp/claude-refactor-nudge-${session_id}.count"

count=0

[[ -f "$counter_file" ]] && count="$(cat "$counter_file")"

count=$((count + 1))

echo "$count" > "$counter_file"

if (( count % 10 == 1 )); then

  cat <<'JSON'

{

  "hookSpecificOutput": {

    "hookEventName": "PostToolUse",

    "additionalContext": "Refactor checkpoint: you've made several edits this session. Quick self-check — duplication, dead branches, premature abstraction, over-long functions? If yes, fix now. The merge-to-dev/main gate will catch it later, but cheaper to fix in flight. (refactoring-specialist agent is available.)"

  }

}

JSON

else

  echo "{}"

fi

exit 0

```

### 5c. `settings.json` patch (additive — do not overwrite existing hooks)

The existing `~/.claude/settings.json` `hooks` block stays untouched. We append two entries:

```jsonc

{

  "hooks": {

    "PreToolUse": [

      // ...existing path-traversal-guard entry stays here...

      {

        "matcher": "Bash",

        "if": "Bash(git merge *)",

        "hooks": [

          {

            "type": "command",

            "command": "$HOME/.claude/hooks/[merge-review-nudge.sh](http://merge-review-nudge.sh)",

          },

        ],

      },

      {

        "matcher": "Bash",

        "if": "Bash(git push *)",

        "hooks": [

          {

            "type": "command",

            "command": "$HOME/.claude/hooks/[merge-review-nudge.sh](http://merge-review-nudge.sh)",

          },

        ],

      },

    ],

    "PostToolUse": [

      // ...existing auto-format, lint-check, run-tests-async, audit-log entries stay here...

      {

        "matcher": "Edit|Write|MultiEdit",

        "hooks": [

          {

            "type": "command",

            "command": "$HOME/.claude/hooks/[edit-refactor-nudge.sh](http://edit-refactor-nudge.sh)",

          },

        ],

      },

    ],

  },

}

```

---

## 6. Step-by-step execution (when the plan is approved)

Steps 1–4 are reproducible on any machine — copy them to a teammate or a new Claude session.

### Step 1: Archive existing tools we're replacing

```bash

mkdir -p ~/.ai_configs/_archive/2026-04-13-prereplace

mv ~/.ai_configs/agents/[architect.md](http://architect.md)         ~/.ai_configs/_archive/2026-04-13-prereplace/

mv ~/.ai_configs/agents/[security-expert.md](http://security-expert.md)   ~/.ai_configs/_archive/2026-04-13-prereplace/

mv ~/.ai_configs/skills/security-review      ~/.ai_configs/_archive/2026-04-13-prereplace/

```

`code-review` skill is NOT archived — it remains as a complementary skill.

### Step 2: Install VoltAgent agents (refactoring + architect)

```bash

TMP=$(mktemp -d)

git clone --depth 1 [https://github.com/VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) "$TMP/voltagent"

cp "$TMP/voltagent/categories/06-developer-experience/[refactoring-specialist.md](http://refactoring-specialist.md)" \

   ~/.ai_configs/agents/[refactoring-specialist.md](http://refactoring-specialist.md)

cp "$TMP/voltagent/categories/04-quality-security/[architect-reviewer.md](http://architect-reviewer.md)" \

   ~/.ai_configs/agents/[architect-reviewer.md](http://architect-reviewer.md)

rm -rf "$TMP/voltagent"

```

### Step 3: Install Trail of Bits security skill

```bash

TMP=$(mktemp -d)

git clone --depth 1 [https://github.com/trailofbits/skills](https://github.com/trailofbits/skills) "$TMP/tob"

mkdir -p ~/.ai_configs/skills/security-engineer

# Copy the skill files Trail of Bits ships. Exact subdirectory may evolve;

# inspect $TMP/tob and copy the security-review / SAST / audit-context skills.

cp -r "$TMP/tob"/* ~/.ai_configs/skills/security-engineer/

rm -rf "$TMP/tob"

```

> Note for the executor: when you actually run this, `ls $TMP/tob` first and copy only the relevant skill folders (Trail of Bits' repo organizes by audit phase). If the [SKILL.md](http://SKILL.md) at the repo root isn't present, write a small parent [SKILL.md](http://SKILL.md) that points to the sub-skills with the trigger conditions: `auth`, `payment`, `secret`, `merge to dev`, `merge to main`, `security review`, `OWASP`, `dependency`, `CVE`.

### Step 4: Create hook scripts and patch settings.json

```bash

mkdir -p ~/.claude/hooks

# write [merge-review-nudge.sh](http://merge-review-nudge.sh) and [edit-refactor-nudge.sh](http://edit-refactor-nudge.sh) from §5a and §5b

chmod +x ~/.claude/hooks/[merge-review-nudge.sh](http://merge-review-nudge.sh) ~/.claude/hooks/[edit-refactor-nudge.sh](http://edit-refactor-nudge.sh)

```

Then edit `~/.claude/settings.json` and append the entries from §5c into the existing `hooks.PreToolUse` and `hooks.PostToolUse` arrays. Do **not** overwrite the file.

### Step 5: Restart the Claude Code session

Hooks are re-read on session start. After installation, `claude` (new session) — the new hooks are now live.

---

## 7. Verification

| What to verify                              | How                                                                                                                                                                                                                                    |

| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| Agents loaded                               | New session → ask Claude "list available agents". `refactoring-specialist` and `architect-reviewer` should appear; `architect` and `security-expert` should NOT.                                                                       |

| Skill loaded                                | Same session → ask "list available skills". `security-engineer` (or its sub-skill names from Trail of Bits) should appear; `security-review` should NOT.                                                                               |

| Edit-nudge fires                            | Make 10 edits in a session. On the 1st and 11th, the next Claude response should mention the refactor checkpoint reminder. Confirm via `audit.log` (existing audit-log hook records all hook firings).                                 |

| Merge-nudge fires on dev/main               | Run `git merge dev` (or `git push origin main`). The next assistant message should reference the three-reviewer system reminder and Claude should spawn three Task subagents.                                                          |

| Merge-nudge does NOT fire on feature branch | Run `git merge feature/x`. No reviewer reminder should appear.                                                                                                                                                                         |

| Existing hooks untouched                    | `path-traversal-guard.sh`, `auto-format.sh`, `lint-check.sh`, `run-tests-async.sh`, `audit-log.sh`, `require-tests-pass.sh`, `desktop-notify.sh` all still fire. Quick test: edit a file with a path-traversal pattern → guard blocks. |

| jq is installed                             | The hook scripts depend on `jq`. `which jq` → must return a path. If missing: `sudo apt install -y jq` (Ubuntu) or `brew install jq` (mac).                                                                                            |

---

## 8. Reproducing on another machine (TL;DR for the team)

1. Install Claude Code v2.1.85+ (the `if` hook field is required).
2. Have an `~/.ai_configs/` layout symlinked into `~/.claude/skills` and `~/.claude/agents` (or just put files directly under `~/.claude/skills` and `~/.claude/agents`).
3. Run sections §6 step 1 → step 5 verbatim.
4. Run the §7 verification checklist.
5. The three new tools and two hooks are now active.

That is the entire delta.

---

## 9. Files to be modified / created (path index)

**Created:**

- `~/.ai_configs/agents/refactoring-specialist.md`
- `~/.ai_configs/agents/architect-reviewer.md`
- `~/.ai_configs/skills/security-engineer/SKILL.md` (and Trail of Bits sub-skill files)
- `~/.claude/hooks/merge-review-nudge.sh`
- `~/.claude/hooks/edit-refactor-nudge.sh`
- `~/.ai_configs/_archive/2026-04-13-prereplace/` (archive directory)

**Modified (additive only):**

- `~/.claude/settings.json` — append two PreToolUse entries and one PostToolUse entry

**Moved (not deleted):**

- `~/.ai_configs/agents/architect.md` → `_archive/2026-04-13-prereplace/`
- `~/.ai_configs/agents/security-expert.md` → `_archive/2026-04-13-prereplace/`
- `~/.ai_configs/skills/security-review/` → `_archive/2026-04-13-prereplace/`

**Untouched:**

- All other 27 skills and 13 agents
- All 7 existing hooks
- `~/.claude/CLAUDE.md` symlink and `~/.ai_configs/rules/AGENTS.md`
- `~/.claude/plugins/` (Vercel plugin stays)

---

## 10. Project Secure Coding Baseline (Studio NPV GST Mobile)

This section defines repository-level secure coding practices for the GST mobile app and related services.

### 10.1 Security Objectives

- Protect user data stored on device and in transit.
- Prevent injection and malformed-input bugs in calculator and invoice flows.
- Avoid accidental secret exposure in source control, logs, and build artifacts.
- Keep third-party dependencies auditable and up to date.
- Make store submissions pass privacy and security review checks consistently.

### 10.2 Threat Model (Minimum)

- **Input abuse:** invalid or oversized numeric values causing crashes or logic errors.
- **Sensitive data leakage:** storing secrets, auth tokens, or PII in plaintext logs/files.
- **Supply-chain risk:** vulnerable npm packages or transitive dependencies.
- **Misconfiguration:** debug builds, verbose logs, or placeholder URLs shipped to production.
- **Social engineering/review risk:** inaccurate privacy declarations versus actual SDK behavior.

### 10.3 Mandatory Coding Rules

1. **Validate all user input at boundary**
  - Sanitize text and numeric fields before computation.
  - Clamp numeric ranges (`GST rate 0..100`, amount upper bounds).
  - Reject/normalize malformed state codes.
2. **No secrets in repo**
  - Never commit API keys, tokens, signing files, passwords, or private certs.
  - Use environment variables and CI secret stores only.
3. **Safe logging**
  - No logging of invoice/customer PII in production.
  - Remove debug-only console statements before release builds.
4. **Least privilege**
  - Request only required mobile permissions.
  - Do not include ad/analytics SDKs without explicit privacy form updates.
5. **Secure external linking**
  - Allowlist legal/support URLs.
  - Use HTTPS URLs for external web pages.
6. **Dependency hygiene**
  - Run `npm audit` on release branches.
  - Patch critical/high vulnerabilities before store submission.
  - Pin and review new dependencies with purpose and risk note.

### 10.4 Mobile-Specific Controls

- Use `AsyncStorage` only for non-sensitive app data (calculator/invoice history).
- If authentication is added later:
  - store tokens in secure storage (`expo-secure-store`) instead of AsyncStorage;
  - implement in-app account deletion;
  - include session expiry and logout controls.
- Ensure app works safely offline (no crashes, clear user messaging).

### 10.5 Release Security Checklist

Before each production build:

- Replace placeholder privacy/support URLs with live endpoints.
- Verify no secrets in staged diff (`.env`, keys, keystores).
- Run typecheck and lint clean.
- Run dependency vulnerability check and document results.
- Confirm data collection declarations match enabled SDKs.
- Confirm no debug logs and no test endpoints in production.

### 10.6 Secure Code Review Gate (PR/Merge)

Every release PR should include:

- Security-impact summary (`none` or explicit change list).
- Input validation coverage for new fields or APIs.
- Dependency additions and risk rationale.
- Privacy declaration impact statement.

If any high-risk item is touched (auth, payments, external APIs, file uploads), perform dedicated security review before merge.