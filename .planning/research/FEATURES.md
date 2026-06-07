# Feature Research

**Domain:** Personal dev machine inventory / rebuild awareness tool
**Researched:** 2026-06-07
**Confidence:** HIGH (core categories), MEDIUM (AI-augmented features, MCP-specific patterns)

---

## Ecosystem Reference Points

Tools surveyed to derive this feature landscape:

| Tool | Type | Key trait |
|------|------|-----------|
| chezmoi | Dotfiles manager | Templates, encryption, password manager integration, single binary |
| yadm | Dotfiles manager | Git-native, encrypted archive, alternate files per host |
| dotbot | Dotfiles bootstrapper | YAML symlink manifest, no discovery |
| mackup | App-settings sync | Auto-detects known app configs, syncs to cloud |
| Homebrew Bundle | Package snapshotting | `brew dump` produces declarative Brewfile; `brew bundle check` diffs |
| Ansible playbooks | Full machine bootstrap | Idempotent roles for packages, users, SSH, services |
| Nix home-manager | Declarative env | Generations/rollback, fully reproducible, steep learning curve |

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that are assumed to exist. Missing = product feels broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Scan and list installed dev tools | Core value of the product — without this there is nothing to show | MEDIUM | Fixed allowlist of relevant tools (IDEs, CLIs, package managers). Tools like mackup auto-detect; we use an explicit allowlist for safety. |
| Group results by category | Every comparable tool (Ansible, Homebrew Bundle, Mackup) uses categories. Raw list is unusable | LOW | Categories: IDEs, Package Managers, Shell, Git, SSH, AI/MCP, Project Folders, Secrets Checklist |
| Show file/config paths alongside each tool | Users need to know WHERE things live to rebuild. This is the minimum useful data | LOW | e.g. `/home/martin/.config/claude/` alongside "Claude Code" |
| Distinguish presence from configuration | Telling users "git is installed" is useless without "here is your .gitconfig path" | LOW | Presence + path is the baseline; content is out of scope |
| Export to a portable file | Homebrew Bundle's core feature is `brew dump`. Ansible playbooks ARE the export. Users expect a file they can paste into a new machine rebuild doc | LOW | Export to `machine-inventory.md` and `machine-inventory.json` |
| Never store secret values | This is a non-negotiable security baseline, established by community consensus across all comparable tools. Storing creds = immediate trust failure | LOW | .env variable NAMES only. SSH key paths, not contents. |
| Manual trigger only | All comparable personal tools are run manually. Scheduled scanning in MVP creates false sense of currency and is not expected for a personal tool | LOW | `python -m scanner scan` run by user |

### Differentiators (Competitive Advantage)

Features that make this genuinely useful rather than just a glorified `dpkg --list`.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Restore importance triage (Essential / Useful / Optional / Ignore) | No comparable tool does this. Homebrew Bundle lists everything flatly. Ansible roles encode importance implicitly in play order. Making importance explicit and human-readable is the key insight of this tool | MEDIUM | AI-assisted initial triage + user override. Four tiers map directly to rebuild decision urgency. |
| AI-assisted classification and notes | chezmoi, yadm, Ansible all require the user to manually annotate their manifests. OpenAI analysis means the initial inventory is annotated automatically, not just listed | HIGH | Manually triggered from dashboard. OpenAI suggests category, importance, restore commands, notes. User reviews. |
| AI-suggested discovery commands (with approval gate) | No comparable tool does progressive discovery. The scanner starts minimal; AI identifies gaps (e.g. "you have pyenv, should I check for .python-version files?") and proposes safe read-only commands. User approves per command | HIGH | Strict allowlist validation before execution. Addresses the fundamental problem: you don't know what you don't know. |
| Review queue for unknown/low-confidence findings | Most tools give you an all-or-nothing manifest. A review queue for uncertain detections means the inventory is trusted, not just comprehensive | MEDIUM | Items the scanner couldn't confidently classify go to a "Review" state in the dashboard |
| Secrets checklist (names + reminders, never values) | Comparable tools either ignore secrets (Homebrew Bundle) or encrypt them (chezmoi/yadm). A named checklist — "you have OPENAI_API_KEY, SUPABASE_SERVICE_ROLE" — gives rebuild awareness without creating a credential-exposure risk | LOW | .env variable names only. SSH key NAMES + fingerprints, not contents. This is a unique positioning: awareness without storage. |
| MCP server and Claude skills inventory | Completely absent from all existing tools. Claude Code, chezmoi, Ansible have no concept of MCP server configs or Claude skill directories. This is a 2025+ AI-dev-specific gap the tool fills | MEDIUM | Read `~/.claude/`, `claude_desktop_config.json`, VS Code MCP config. List server names, types, config paths. |
| Web dashboard with structured view | Homebrew Bundle outputs a text file. chezmoi is a CLI. Having a structured, browsable dashboard is a UX differentiator for personal tools, especially for non-CLI review moments | MEDIUM | Next.js on Vercel. Magic-link login. Grouped view with importance colour coding. |
| Token-scoped upload (no credentials on scanner machine) | Comparable tools either write to local files (Homebrew) or require cloud credentials on the source machine (Ansible, Mackup with Dropbox). The scanner needs only an app URL + short-lived token | MEDIUM | Vercel API route validates token server-side. Scanner is credential-free except for this token. |

### Anti-Features (Deliberately Not Built)

Features that seem natural extensions but create real problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Storing .env values (not just names) | "It's convenient to have all my keys in one place" | This is the canonical secret-storage mistake. Leaked dotfiles repos, compromised Supabase instances, or intercepted uploads expose all credentials at once. Community consensus across chezmoi, dotdrop, and the secrets management literature is unanimous: never store values | Store names only. User's existing secret manager (1Password, Keychain, Bitwarden) holds values. Rebuild checklist names what needs to be retrieved. |
| Automatic sync on schedule | "Keep it current automatically" | Scheduled scans silently capture a machine state the user hasn't reviewed. On a personal machine this creates a false sense of currency and runs shell commands without user awareness. All comparable personal tools are manual | Manual scan command. Make it fast and easy to run when needed. |
| Full backup / file contents upload | "Back up everything" | This is a different product (Mackup, Time Machine, Borg). A rebuild awareness tool that stores file contents expands scope dramatically, increases attack surface, and duplicates mature solutions | Paths and presence only. For actual backup, document which backup tool the user has installed. |
| Automatic restore / re-install | "One-command rebuild" | Ansible and Nix home-manager have spent years solving idempotent system bootstrap. Attempting this in MVP creates a dangerous half-baked restore path. A partial restore that fails halfway is worse than a manual checklist | Export to .md checklist that a human executes. Provides rebuild commands as informational text, not automation. |
| Multi-machine support | "Centralise my whole fleet" | Multi-machine transforms a personal tool into a SaaS product. Schema complexity, identity management, per-machine auth, and diffing between machines are all separate substantial features | Single machine in MVP. Architecture decision: one scan slot per account rather than a machines table. |
| Scan history / diffing | "Show me what changed since last month" | Requires either multi-row storage (complicating schema) or a dedicated diff engine. The signal-to-noise ratio on a personal dev machine is low — tools are rarely removed. Value doesn't justify MVP complexity | Latest scan only. History deferred. Export gives the user a point-in-time snapshot they can keep manually. |
| Reading shell config content (aliases, functions) | "Capture my aliases too" | Shell configs contain complex, multi-line heredocs, sourced files, and conditional logic. Parsing them reliably is a significant engineering effort; getting it wrong produces garbage inventory entries | Path and presence only. The user knows their aliases are in `~/.zshrc`; the inventory tells them the path exists and where it is. |
| Reading .env file values | As above — secret exposure | Same as storing values. Even reading them temporarily to "analyse" creates a brief exposure window in transit | File existence + variable names from `grep -E "^[A-Z_]+="`  (key names only, no values). |
| Full Linux package inventory (dpkg/apt list) | "Show me everything" | apt list on a dev machine returns thousands of packages. Signal is buried. The user cannot triage "what do I need to reinstall" from 4,000 entries | Fixed allowlist of ~100 known dev/AI tools. Scan breadth is a config file, not unbounded system enumeration. |
| Browser extensions, desktop themes, VPN settings | "My full environment" | Scope creep. Browser extensions change constantly, themes are cosmetic, VPN settings are sensitive. None of these are dev rebuild priorities | Document as explicit out-of-scope in the UI. Keeps the tool focused. |

---

## Feature Dependencies

```
Scanner (Python CLI)
    └──requires──> Token (issued by dashboard before first scan)
                       └──requires──> Dashboard deployed + Supabase connected

Inventory dashboard view
    └──requires──> At least one completed scan upload

AI Classification
    └──requires──> Inventory exists (scan complete)
    └──enhances──> Review Queue (AI generates initial triage; user refines in queue)

AI-suggested discovery commands
    └──requires──> AI Classification (discovery gaps identified from initial scan)
    └──requires──> Allowlist system (commands must pass validation before execution)

Secrets Checklist
    └──requires──> Scanner reads .env key names (no values)
    └──enhances──> Restore export (checklist items appear in export)

Export (machine-inventory.md / .json)
    └──requires──> Inventory exists
    └──enhances──> AI Classification (richer export when notes + importance populated)

Scan folder management
    └──requires──> Dashboard (user defines approved roots in UI)
    └──requires──> Scanner fetches approved roots before scanning
```

### Dependency Notes

- **Token requires dashboard first:** The scanner cannot be run before the dashboard is deployed and a token issued. This makes dashboard deployment Phase 1.
- **AI Classification enhances Review Queue:** The queue is most valuable after AI runs — AI produces initial triage, user corrects misclassifications in the queue.
- **Export is a downstream consumer:** Export quality scales with how much metadata (importance, notes, commands) has been added via AI and manual review. Basic export works without AI; rich export requires it.
- **Allowlist gates AI-suggested commands:** The AI can suggest commands, but the execution path must verify against a hardcoded allowlist. These are separate concerns — allowlist is a scanner concern, suggestion is a dashboard/AI concern.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed for the tool to be useful at all.

- [ ] Python scanner: detect tools from fixed allowlist, read paths, read .env key names, read git config, read SSH key metadata, read shell config paths, read project folder names — MEDIUM complexity
- [ ] Scanner upload via Vercel API route with dashboard-issued token — MEDIUM
- [ ] Dashboard: login (magic-link), inventory view grouped by category and importance — MEDIUM
- [ ] Dashboard: issue/revoke scanner tokens — LOW
- [ ] Restore importance tiers on each item (Essential / Useful / Optional / Ignore), editable — LOW
- [ ] Secrets Checklist view: .env key names + SSH key names only — LOW
- [ ] Export to machine-inventory.md and machine-inventory.json — LOW
- [ ] Scan folder management: user defines approved project roots in dashboard, scanner reads them — LOW

### Add After Validation (v1.x)

- [ ] OpenAI classification pass: triggered manually from dashboard, classifies + annotates items — add when manual triage feels tedious (validation signal: user has >50 inventory items to classify)
- [ ] Review Queue: surface low-confidence scanner findings for manual classification — add when scanner produces uncertain results in practice
- [ ] MCP server and Claude skills inventory: read `~/.claude/`, claude_desktop_config.json — add when AI tooling coverage gap feels jarring

### Future Consideration (v2+)

- [ ] AI-suggested discovery commands with approval gate — defer until v1.x AI features are validated and trusted
- [ ] Docker / Docker Compose scanning — deferred: scope is large, adds complexity to allowlist
- [ ] Multi-machine support — defer: different product, different schema
- [ ] Scan history / diffing — defer: latest scan is sufficient until user asks "what changed?"
- [ ] Scheduled scans — defer: manual is sufficient for personal use

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Scanner: tool detection (allowlist) | HIGH | MEDIUM | P1 |
| Scanner: upload via token | HIGH | MEDIUM | P1 |
| Dashboard: inventory view grouped + importance | HIGH | MEDIUM | P1 |
| Token issuance / revocation | HIGH | LOW | P1 |
| Secrets Checklist (names only) | HIGH | LOW | P1 |
| Export to .md / .json | HIGH | LOW | P1 |
| Scan folder management | MEDIUM | LOW | P1 |
| AI classification (OpenAI) | HIGH | HIGH | P2 |
| Review Queue | MEDIUM | MEDIUM | P2 |
| MCP / Claude skills inventory | MEDIUM | MEDIUM | P2 |
| AI-suggested discovery commands | MEDIUM | HIGH | P3 |
| Scan history / diffing | LOW | HIGH | P3 |
| Multi-machine | LOW | HIGH | P3 |

**Priority key:** P1 = MVP launch, P2 = post-validation, P3 = v2+

---

## Competitor Feature Analysis

| Feature | chezmoi | Homebrew Bundle | Mackup | Ansible | This tool |
|---------|---------|----------------|--------|---------|-----------|
| Discovery method | Manual `add` | `brew dump` auto-list | Auto-detect known apps | Explicit task list | Fixed allowlist + AI discovery |
| Importance triage | None | None | None | Implicit in play order | Explicit 4-tier + AI assist |
| Secret handling | Encrypt values (age/gpg) | Ignores | Ignores | Vault integration | Names only, never values |
| AI-assisted annotation | None | None | None | None | OpenAI classification |
| MCP / Claude skills | None | None | None | None | First-class scan target |
| Web dashboard | CLI only | CLI only | CLI only | CLI only | Next.js dashboard |
| Export format | Git repo | Brewfile (text) | Symlinks | Playbook YAML | .md + .json |
| Restore automation | `chezmoi apply` | `brew bundle install` | `mackup restore` | `ansible-playbook` | Checklist only (by design) |
| Multi-machine | Core feature | macOS only | macOS/Linux | Core feature | Out of scope (MVP) |
| Linux support | Full | Limited | Partial | Full | Full (Zorin/Ubuntu) |

---

## Sources

- chezmoi comparison table: https://www.chezmoi.io/comparison-table/
- chezmoi why use: https://www.chezmoi.io/why-use-chezmoi/
- yadm overview: https://yadm.io/
- Mackup GitHub: https://github.com/lra/mackup
- Homebrew Bundle docs: https://docs.brew.sh/Brew-Bundle-and-Brewfile
- Nix home-manager: https://nix-community.github.io/home-manager/
- Ansible bootstrap patterns: https://fullmetalbrackets.com/blog/bootstrapping-fresh-install-with-ansible/
- Secrets management anti-patterns: https://dotfiles.io/en/guides/secret-management/
- MCP server discovery: https://modelcontextprotocol.io/specification/2025-06-18/server/tools

---

*Feature research for: personal dev machine inventory / rebuild awareness tool*
*Researched: 2026-06-07*
