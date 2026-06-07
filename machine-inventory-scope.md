# Machine Inventory Scope

## Project Name

**Working title:** Rebuild Ledger  
**Scope filename:** `machine-inventory-scope.md`  
**Status:** Working title, likely to change later.

## Purpose

Rebuild Ledger is a personal AI/dev environment inventory tool.

Its purpose is to scan a development machine, detect what AI/dev-related tools, settings, libraries, skills, editors, package managers, project folders, and configuration artefacts are installed, and present them in a clean dashboard so the machine can be rebuilt more easily later.

The MVP is not a full system backup tool. It is a rebuild awareness tool.

The core question it should answer is:

> What AI/dev-related things are installed or configured on this machine, where are they, how important are they, and what would I need to remember during a rebuild?

## Primary User

The initial user is Martin.

The MVP is for personal use, primarily for a Zorin 18 Pro / Ubuntu-like Linux laptop.

The system should be designed in a way that does not block later support for Windows or multiple machines, but those are not MVP requirements.

## Core MVP Direction

The MVP will be:

- A local Python scanner run manually from the machine.
- A Vercel-hosted dashboard.
- Supabase for data, authentication, scanner token handling, and storage.
- Supabase magic-link login for the dashboard.
- OpenAI analysis triggered manually from the dashboard.
- Latest scan only.
- One machine in MVP.
- Linux/Zorin first, Windows later.
- Markdown and JSON export.

## Preferred Tech Stack

The preferred stack is:

- **Frontend/dashboard:** Vercel-hosted web app.
- **Backend/data/auth:** Supabase.
- **Dashboard authentication:** Supabase magic link.
- **Local scanner:** Python CLI, run from repo in MVP.
- **AI analysis:** OpenAI.
- **Exports:** Markdown and JSON.

This stack is preferred, not religious. Cursor, Codex, Claude, or another build tool may suggest substitutions only if there is a strong practical reason.

## MVP Architecture

### 1. Local Scanner

The local scanner runs on the Zorin/Linux machine.

It gathers AI/dev-related inventory data, redacts anything sensitive, and uploads the latest scan to Supabase using a dashboard-issued scanner token.

The scanner is not packaged properly in MVP. It runs from the project repo.

Example MVP run approach:

```bash
git clone <repo>
cd <repo>
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m scanner scan
```

Later this may become:

```bash
zorin-restore scan
```

### 2. Web Dashboard

The dashboard is the control centre.

It provides:

- Magic-link login.
- Scanner setup/onboarding.
- Scanner token creation and revocation.
- User-defined scan folder management.
- Inventory view.
- Review Queue.
- Secrets Checklist.
- OpenAI analysis trigger.
- Export controls.
- Basic settings.

### 3. Supabase

Supabase stores the current machine inventory and related data.

The MVP should include a light schema, but avoid overdesigned migrations, policies, indexes, or unnecessary cleverness at this stage.

### 4. OpenAI Analysis

OpenAI is used only when manually triggered from the dashboard.

The scanner first uploads redacted findings. The dashboard then allows the user to click an analysis action.

OpenAI may:

- Classify detected items.
- Suggest purpose/general notes.
- Suggest restore notes.
- Suggest restore importance.
- Suggest extra safe read-only scan commands.
- Assign Low / Medium / High confidence.

OpenAI does not run silently in the background.

## Key Product Decisions

## Main Output

The MVP output is an **inventory view**, not a full restore wizard.

The inventory should show:

- What was detected.
- Where it lives.
- What category it belongs to.
- How important it is.
- What it is probably used for.
- What needs to be remembered when rebuilding.

A restore checklist may come later.

## Grouping

Inventory should be grouped by:

1. **Category**
2. **Restore importance**

Example categories:

- AI tools
- IDEs/editors
- Package managers/dev tools
- Git/SSH
- Projects
- Shell metadata
- Secrets
- Other/review items

Restore importance labels:

- Essential
- Useful
- Optional
- Ignore

Ignored items should be hidden by default, but available through a **Show ignored** filter.

## Scan History

MVP keeps **latest scan only**.

Each new scan updates/replaces the current inventory.

No scan history, timeline, diffing, or change tracking in MVP.

## Machine Support

MVP supports one machine.

The data model should not make future multi-machine support awkward.

Machine record should include:

- User-facing machine name.
- Hostname.
- OS name/version.
- Kernel version.
- Architecture.
- Scanner version.
- Python version used by scanner.
- Last scan time.

Example user-facing machine name:

> Zorin 18 Pro Laptop

## Scanner Token Flow

Scanner authentication should use a dashboard-issued token.

Flow:

1. User logs into dashboard via magic link.
2. User creates/registers the current machine.
3. Dashboard generates a scanner token.
4. User copies setup/run command from dashboard.
5. Scanner uses token to upload inventory to Supabase.
6. Token can be revoked/regenerated later.

No powerful Supabase service key should be hardcoded into the scanner config.

## Scanner Behaviour

## Scanner Depth

Scanner should use a cautious mix of:

- Metadata-only scanning by default.
- Safe config reading where useful.

It may capture:

- Names.
- Versions.
- Paths.
- Config file locations.
- Install method hints.
- Extension lists where simple/safe.
- Package manifests.
- `.env` variable names only.
- Timestamps.
- Restore importance guesses.

It must not store secret values.

## AI-Assisted Discovery

The scanner should use AI-assisted discovery, but safely.

It should:

1. Run known safe scan modules.
2. Upload redacted findings.
3. Let OpenAI suggest extra read-only discovery commands.
4. Show those command suggestions in the dashboard.
5. Let the user approve or reject them.
6. Store approved commands for the next scanner run.
7. Run approved commands only if they match the scanner allowlist.

No live remote command execution from the dashboard.

## Command Execution

OpenAI may suggest commands, but only approved, allowlisted, read-only commands may run.

Allowed examples:

```bash
which node
node --version
npm list -g --depth=0
pnpm --version
git config --list
code --list-extensions
cursor --list-extensions
```

Commands must be:

- Read-only.
- Allowlisted.
- Logged.
- Redacted before storage if output contains sensitive-looking values.

Commands must not:

- Install packages.
- Modify files.
- Delete files.
- Change system settings.
- Read private key contents.
- Upload secrets.
- Run arbitrary shell pipelines without explicit allowlist support.

## Scanner Modules

Use a light module structure.

MVP scanner sections/modules:

- AI tools.
- IDEs/editors.
- Package managers/dev tools.
- Git/SSH safe metadata.
- User-defined project folders.
- `.env` variable names.
- Shell metadata.
- Scanner/system metadata.
- Supabase sync/upload.

Each module should return a consistent structure so the dashboard does not need to care whether the item came from Cursor, Claude, Git, Python, Node, or another source.

## Scanner Output

Terminal output should be dashboard-first and minimal.

It should show only:

- Scan started.
- Scan completed or failed.
- Upload successful or failed.
- Dashboard URL, if useful.

No detailed terminal report in MVP.

## Dry Run

No dry-run mode in MVP.

## Scan Folders

Project folders are user-defined only.

The scanner should not rummage through the whole home directory trying to guess what counts as a project.

Dashboard should allow the user to add/edit/remove approved project root folders.

Scanner fetches those folders before scanning.

Examples:

- `~/Projects`
- `~/Dev`
- mounted NAS/project folders, only if explicitly added

## Project Folder Scanning

For MVP, project folders are **detected only**.

The scanner should capture:

- Project name.
- Path.
- Git repo status.
- Remote URL presence, without secrets.
- Package type, for example Node, Python, mixed.
- Key files present, for example:
  - `package.json`
  - `pyproject.toml`
  - `requirements.txt`
  - `scope.md`
  - `.nvmrc`
- Last modified date.
- Basic restore importance guess.

It should not deeply read project files or summarise project purpose in MVP.

## AI Tools

AI tools should be a top-level category with subcategories.

Subcategories:

- Claude Desktop / Claude Code.
- Claude skills.
- Codex.
- OpenAI CLI/config/tooling.
- MCP servers.
- AI-related local scripts/repos.
- Other detected AI developer tools.

## Claude Skills

Claude skills should be first-class inventory items.

Each detected skill should have its own entry with:

- Skill name.
- Path/location.
- Source folder.
- Basic description, if safely detectable.
- Restore importance.
- Confidence.
- Manual general note.
- Manual restore note.
- Whether it appears custom, downloaded, bundled, or unknown.
- Safe dependency/config hints, if detectable.

## MCP Servers

MCP servers should be first-class inventory items.

Each detected MCP server should have its own entry with:

- Server name.
- Launch command.
- Package/path/repo if detectable.
- Config file source.
- Restore importance.
- Confidence.
- Manual general note.
- Manual restore note.
- Whether it is local, npm-based, Python-based, Docker-based later, or unknown.
- Whether it depends on secrets/env vars.

Command/config structure may be stored, but token values, API keys, and credentials must be redacted.

## IDEs and Editors

MVP should scan recognised IDEs/code editors, including:

- Cursor.
- Zed.
- VS Code.
- Antigravity.
- Any other detected IDE/editor.

IDE/editor scanning should be basic for MVP.

Capture:

- Installed/not installed.
- Version, where easily available.
- Executable path.
- Config/settings path.
- Extension/plugin/theme list only where a simple safe command or obvious config file exists.
- Basic restore importance guess.
- Manual notes.

Do not build a full editor restore profile in MVP.

Do not deeply capture:

- Keybindings.
- Snippets.
- Profiles.
- AI rules.
- Full settings.
- Deep theme configuration.
- Editor-specific restore automation.

## Package Managers and Dev Tools

MVP should scan:

### Node tooling

- `node`
- `npm`
- `pnpm`
- `yarn`, if present
- global packages where available

### Python tooling

- Python versions.
- `pipx`.
- global CLI-style packages where safe/practical.

### Selected system dev tools

Use a fixed allowlist plus OpenAI suggestions.

Potential allowlist examples:

- `git`
- `gh`
- `curl`
- `wget`
- `jq`
- `ripgrep`
- `fzf`
- `build-essential`
- `python3`
- `pipx`
- `node`
- `npm`
- `pnpm`
- `yarn`
- `cursor`
- `code`
- `zed`

Docker is excluded from MVP.

This is not a full Linux package inventory. It only tracks dev/AI-relevant system tools.

## Git and SSH

MVP should include safe Git/SSH metadata and restore notes.

Capture:

- Git username/email from config.
- Git default branch setting.
- Git editor setting.
- Git signing preference, if present.
- Whether SSH keys exist.
- Public key filenames only.
- Remote host types used by approved projects, for example GitHub/GitLab.
- Whether project remotes are SSH or HTTPS.
- Restore reminders for:
  - SSH keys.
  - GitHub auth.
  - Git signing keys, if used.
  - Credential manager/login state.

Never read, upload, or store private SSH key contents.

## Shell Metadata

MVP should capture basic shell metadata only.

Capture:

- Detected shell, for example bash, zsh, fish.
- Shell config files present, for example `.bashrc`, `.profile`, `.zshrc`.
- Whether PATH customisation appears to exist.
- Rough count of PATH entries.
- Config file paths.
- Last modified dates.
- Restore note such as “review shell config manually”.

Do not read shell config contents in MVP.

No aliases, functions, exports, or shell file parsing yet.

## Secrets Handling

Security and restore usefulness both matter.

The system should store:

- Secret names.
- Secret variable names.
- Secret reminders.
- Whether an item depends on secrets.

The system must never store secret values.

## `.env` Files

`.env` files may be read for variable names only.

Rules:

- Detect `.env` files in approved scan areas/config locations.
- Read only the left-hand side of assignments.
- Store names such as:
  - `OPENAI_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `DATABASE_URL`
- Immediately discard values.
- Never upload raw `.env` contents.
- Mark sensitive-looking names as Secret / restore manually.
- Link them into the central Secrets Checklist.

Example stored record:

```md
.env found: ~/Projects/example-app/.env
Variables detected:
- OPENAI_API_KEY
- SUPABASE_URL
- SUPABASE_ANON_KEY
Values stored: No
```

## Secrets Checklist

Manual secret reminders should work both:

1. Per inventory item.
2. In a central Secrets Checklist.

Examples:

- OpenAI API key.
- Supabase keys.
- Vercel env vars.
- GitHub token.
- SSH key reminder.
- Cursor/GitHub auth reminder.
- Detected `.env` variable names.
- Manual restore reminders added by the user.

Values are never stored.

## Dashboard Pages

Keep UI plain and functional in MVP.

Do not overbuild the interface.

MVP pages:

### 1. Setup / Onboarding

Purpose:

- Create scanner token.
- Register/name the machine.
- Show setup/install commands.
- Show scan command to copy/paste.
- Explain what the scanner reads.
- Explain what is never stored.
- Basic troubleshooting for failed token/upload/path issues.
- Link to latest inventory after successful scan.

### 2. Inventory

Purpose:

- Main inventory view.
- Group by category.
- Show restore importance.
- Hide ignored items by default.
- Filter by category/importance.
- View item details.
- Edit importance.
- Edit general note.
- Edit restore note.

### 3. Review Queue

Purpose:

- Show unknown or low-confidence findings.
- Allow classification as:
  - Essential
  - Useful
  - Optional
  - Ignore
- Move classified items into main inventory.

### 4. Secrets Checklist

Purpose:

- Central list of secret names and restore reminders.
- Values are never stored.
- Allow manual reminders to be added.
- Allow links back to related inventory items.

### 5. Export

Purpose:

- Export `machine-inventory.md`.
- Export `machine-inventory.json`.
- Include optional checkbox: Include ignored items.
- Default export excludes ignored items.
- Ignored items, when included, go into a separate section.

### 6. Settings

Purpose:

- Auth status/logged-in email.
- Scanner token management.
- Scan folder management.
- Export defaults.
- OpenAI analysis settings/status.
- Machine name.

## Inventory Item Fields

Each inventory item should include:

- Detected name.
- Category.
- Subcategory, if relevant.
- Path/location.
- Version, where available.
- Detection source.
- Restore importance:
  - Essential
  - Useful
  - Optional
  - Ignore
- Confidence:
  - Low
  - Medium
  - High
- General note.
- Restore note.
- Secret dependency flag.
- Last seen date.
- Advanced/debug evidence, hidden by default.

Manual editing in MVP should cover:

- Importance.
- General note.
- Restore note.

Do not require full manual editing of name/path/category/version in MVP.

## Importance Assignment

Restore importance should be assigned using:

1. Scanner rules.
2. OpenAI refinement.
3. User override.

Scanner examples:

- Claude/Cursor/MCP configs: likely Essential.
- Old global packages: maybe Optional.
- Unknown config files: Review Queue.

OpenAI examples:

- Suggest importance.
- Give confidence.
- Explain why it matters.
- Draft notes.

User override always wins.

## Confidence Display

Use simple confidence labels:

- Low
- Medium
- High

Avoid percentage scores.

## Notes

Each item should have two separate note fields:

### General note

What this item is or why it is used.

Example:

> Used for Claude MCP testing.

### Restore note

What needs to happen during a rebuild.

Example:

> Reinstall package, copy config, recreate token manually.

OpenAI may suggest both general notes and restore notes, but the user can edit them.

AI suggestions are not gospel.

## Advanced/Debug Evidence

Raw scan evidence should be available only in an advanced/debug view.

Normal inventory should stay clean.

Advanced/debug evidence may show:

- Detection source.
- Command used.
- Config file path.
- Redacted command output.
- Scanner rule that matched.
- OpenAI reasoning summary.

Do not show hidden chain-of-thought style content. Store/use only concise reasoning summaries.

## Scan Warnings

MVP should show critical scan warnings only.

Examples:

- Scanner token invalid.
- Supabase sync failed.
- Approved scan folder inaccessible.
- OpenAI analysis failed.
- Secret-like value was redacted.
- Command blocked because it was not allowlisted.
- Expected config folder missing for a detected tool.

Minor scan noise can live in advanced/debug only.

## Exports

MVP must support both Markdown and JSON export.

Default export filenames:

- `machine-inventory.md`
- `machine-inventory.json`

Markdown export is for humans during rebuild.

JSON export is for backup, future import, migration, or later restore automation.

Export should have an option:

- Include ignored items: yes/no.

Default:

- Exclude ignored items.

If ignored items are included, put them in a separate section.

## Light Supabase Data Areas

Use a light schema. Do not overdesign.

Likely data areas/tables:

- `profiles` or equivalent user account data.
- `machines`.
- `scanner_tokens`.
- `scan_folders`.
- `inventory_items`.
- `review_queue`.
- `secret_checklist`.
- `scan_warnings`.
- `exports`.
- `analysis_runs`.

Avoid detailed schema design in the scope.

Implementation should define actual table names, relationships, RLS policies, and migrations during build.

## Security Non-Negotiables

These are firm MVP rules:

- Never store secret values.
- Store `.env` variable names only.
- Never read private SSH key contents.
- Never upload private SSH key contents.
- Never upload raw `.env` files.
- Use read-only command allowlist only.
- Redact before upload.
- OpenAI analysis is dashboard-triggered only.
- No live remote command execution.
- Scanner tokens must be revocable.
- Store secret reminders, not credentials.
- Ignored items are hidden, not deleted.
- Approved extra commands run only on the next manual scanner run.
- No destructive commands.
- No package installs.
- No file edits.

## Example Scan Categories

Brief examples only.

### Claude Skill

- Name: `ui-ux-pro-max-skill`
- Path: detected skill folder
- Category: AI tools → Claude skills
- Importance: Useful or Essential
- Note: Used as design-quality skill in AI coding workflow
- Restore note: Reinstall/copy skill folder during rebuild

### MCP Server

- Name: `n8n-mcp`
- Command: redacted safe launch command
- Category: AI tools → MCP servers
- Importance: Essential/Useful
- Secret dependency: yes/no
- Restore note: Reinstall package/repo and recreate required env vars manually

### IDE

- Name: Cursor
- Category: IDEs/editors
- Version: detected if available
- Config path: detected if available
- Extensions/themes: simple list if safely available
- Restore note: Reinstall editor, check settings, reinstall important extensions/themes

### Package Tool

- Name: `pnpm`
- Category: Package managers/dev tools
- Version: detected
- Restore note: Reinstall globally or through preferred Node setup

### Project Folder

- Name: detected folder/repo name
- Path: approved scan folder child path
- Git status: repo/non-repo
- Package type: Node/Python/mixed/unknown
- Key files: `package.json`, `scope.md`, etc.
- Restore note: Ensure project folder exists/restored from Git or backup

### Secret Checklist Item

- Name: `OPENAI_API_KEY`
- Source: detected from `.env` variable name
- Value stored: no
- Restore note: Recreate/regenerate key and add it manually where needed

## User Flows

## Flow 1: First Setup

1. User opens dashboard.
2. User signs in with magic link.
3. User creates/registers machine.
4. Dashboard creates scanner token.
5. Dashboard shows scanner setup commands.
6. User runs scanner locally.
7. Scanner uploads redacted results.
8. Dashboard shows latest inventory.

## Flow 2: Add Scan Folders

1. User opens Settings.
2. User adds approved project root folders.
3. Scanner fetches these folders on next run.
4. Scanner detects projects under those roots.
5. Dashboard shows project metadata in inventory.

## Flow 3: Review Unknown Findings

1. Scanner uploads findings.
2. Unknown/low-confidence items appear in Review Queue.
3. User marks each as Essential, Useful, Optional, or Ignore.
4. Classified items move into the main inventory.
5. Ignored items are hidden by default.

## Flow 4: OpenAI Analysis

1. User opens dashboard.
2. User clicks Analyse with OpenAI.
3. OpenAI reviews redacted findings.
4. OpenAI suggests category, importance, confidence, general notes, restore notes.
5. User accepts, edits, or ignores suggestions.
6. OpenAI may suggest extra safe scan commands.
7. User approves/rejects extra commands.
8. Approved commands are run by the scanner on the next manual scan.

## Flow 5: Export

1. User opens Export page.
2. User chooses Markdown or JSON.
3. User chooses whether to include ignored items.
4. Dashboard generates:
   - `machine-inventory.md`
   - `machine-inventory.json`
5. User downloads export for rebuild/backup use.

## MVP Acceptance Criteria

MVP is done when:

- Scanner runs on Zorin/Linux.
- Scanner uploads redacted scan data to Supabase.
- Dashboard uses magic-link login.
- Dashboard can create/revoke scanner token.
- Dashboard can manage approved scan folders.
- Dashboard shows inventory by category and importance.
- Ignored items are hidden by default and can be shown.
- Review Queue works for unknown/low-confidence items.
- Importance and notes can be edited manually.
- Separate general notes and restore notes exist.
- OpenAI analysis can be triggered manually.
- OpenAI can suggest notes, restore notes, importance, and extra safe commands.
- Extra commands require dashboard approval and run only on the next scanner run.
- Secrets Checklist stores names/reminders only, never values.
- `.env` variable names can be detected without storing values.
- Export produces `machine-inventory.md`.
- Export produces `machine-inventory.json`.
- Critical scan warnings are shown.

## Out of Scope for MVP

The following are deliberately excluded from MVP:

- Docker scanning.
- Docker Compose scanning.
- Browser extensions.
- Browser profiles.
- Bookmarks.
- Cookies.
- Passwords.
- Desktop themes.
- Icons.
- Fonts.
- Wallpapers.
- Zorin/GNOME appearance.
- VPN settings.
- Startup apps.
- Windows scanner.
- Multiple machines.
- Scan history.
- Diffing/change tracking.
- Scheduled scans.
- Full restore wizard/checklist.
- Direct Synology/NAS/Portainer support.
- Deep project summarisation.
- Full IDE restore profiles.
- Shell config content reading.
- Aliases/functions/PATH export parsing.
- Full Linux package inventory.
- Productisation/subscriptions.
- Public multi-user SaaS behaviour.

## Phase 2

Potential Phase 2 features:

- Restore checklist generation.
- Scan history.
- Change tracking/diffing.
- Windows 11 scanner support.
- Multiple machine support.
- Machine switcher.
- Deeper editor restore profiles.
- Deeper Cursor/VS Code/Zed/Antigravity settings capture.
- Docker and Docker Compose module.
- NAS/Synology/Portainer module.
- Better project restore metadata.
- Scheduled local scans.
- Dry-run mode.
- Import from previous `machine-inventory.json`.
- Comparison between current machine and exported inventory.

## Later Ideas

Possible later ideas:

- Full laptop rebuild inventory.
- Browser extension inventory.
- Shell config safe parsing.
- Desktop appearance snapshot.
- Driver/hardware notes.
- Automated restore scripts.
- Guided rebuild mode.
- Multiple OS support.
- Sharing/export packs.
- Product version if the personal tool proves useful enough.

## UI Restraint Note

Build a plain, functional MVP first.

Do not overbuild the UI.

Prioritise:

- Accurate scanning.
- Safe storage.
- Clear inventory.
- Reliable export.
- Manual correction.
- Security boundaries.

A design-quality pass can come later.

Later design polish may use `https://github.com/pbakaus/impeccable` as a quality reference, but it should not distract from MVP implementation.
