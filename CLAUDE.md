# CLAUDE.md

Guidance for Claude Code and other AI agents working in this repository.

## Project overview

This repository is a Docker-based GitHub Action that uploads files or directories to any S3-compatible cloud storage bucket (AWS S3, Cloudflare R2, etc.). It is consumed by other repositories' CI/CD workflows via `uses: axazara/easy-s3-upload-github-action@main`. The action is written in Node.js and runs inside a Docker container built from the included `Dockerfile`.

## Tech stack

- Node.js 20 (Alpine-based Docker image)
- `@aws-sdk/client-s3` v3.1054.0 — S3 API client
- Docker — action runtime (type: `docker` in `action.yml`)
- GitHub Actions — distribution and execution platform

## Getting started

```bash
npm install
```

To build and test the Docker image locally:

```bash
docker build -t easy-s3-upload-github-action .
docker run --rm \
  -e FILE=./path/to/file \
  -e S3_BUCKET=my-bucket \
  -e S3_ACCESS_KEY_ID=xxx \
  -e S3_SECRET_ACCESS_KEY=xxx \
  -e S3_ENDPOINT=xxxx.r2.cloudflarestorage.com/xxxx \
  easy-s3-upload-github-action
```

## Common commands

| Task | Command |
|---|---|
| Install dependencies | `npm install` |
| Run action locally | `node index.js` (requires env vars set) |

## Architecture

- `action.yml` — GitHub Action metadata; declares the action uses Docker with `Dockerfile` as the image.
- `Dockerfile` — Builds a `node:20-alpine` image, copies source files into `/app`, runs `npm install`, and sets `entrypoint.sh` as the container entry point.
- `entrypoint.sh` — Minimal shell wrapper that executes `node /app/index.js`.
- `index.js` — Core logic: reads environment variables (`FILE`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT`, `S3_REGION`, `S3_PREFIX`, `S3_ACL`), initializes an `S3Client` with optional custom endpoint and `forcePathStyle: true`, then recursively walks `FILE` (file or directory) and uploads each item via `PutObjectCommand`.

## Conventions

- All configuration is passed exclusively through environment variables — no input declarations in `action.yml` beyond `runs.using: docker`.
- When uploading a directory, all files are uploaded concurrently via `Promise.all`; subdirectory recursion is supported.
- `S3_ACL` is optional; omit it for buckets (e.g. Cloudflare R2) that do not support ACLs.
- `S3_ENDPOINT` should be provided for non-AWS providers; `S3_REGION` defaults to `us-east-1` if omitted.
- There are no automated tests (`npm test` exits with an error); test changes by building the Docker image and running it locally with real or mock credentials.
- Dependabot is configured to keep npm dependencies and GitHub Actions references up to date weekly.

## Git Conventions

### 1. Branch names

Enforced regex (`branch_name_pattern`):
```
^(feature|fix|hotfix|chore|docs|refactor|test|ci|perf|build|style)/[a-z0-9._-]+$
```

- Lowercase only, kebab-case after the prefix, **max 50 characters** total.
- Use the full word `feature/` — **never** `feat/` (the short `feat` form is only for commit message types).
- Include the ticket id when relevant: `feature/AXA-123-add-stripe` (the ticket id is lowercased to satisfy the pattern — e.g. `feature/axa-123-add-stripe`).
- **Never** use a `claude/` prefix or any prefix outside the allowed set.
- `main`, `release`, `staging` are permanent protected branches — never push to them directly.
- If a branch is misnamed, rename it before pushing: `git branch -m <old> <new>`.

### 2. Commit messages
Enforced regex (`commit_message_pattern`), applied to **every** commit:
```
^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]+\))?!?: .+
```
- Lowercase type, optional scope in parens, optional `!` for breaking changes, subject after `: `.
- Subject starts with a lowercase letter and has no trailing period.
- Examples: `feat(checkout): add Apple Pay support`, `fix(api): handle expired tokens`, `chore(deps): bump axios from 1.7.2 to 1.15.2`, `refactor!: drop Node 18 support`.
- Do not rewrite Dependabot commits — `chore(deps): bump X from a to b` is already enforced via `.github/dependabot.yml`.

### 3. Files that are always rejected
Never stage or commit:
- `.env`, `.env.*` (only `.env.example` and `.env.sample` are allowed), `**/.env`, `**/.env.*`
- Private keys: `**/id_rsa{,.pub}`, `**/id_dsa`, `**/id_ecdsa`, `**/id_ed25519`, `**/.ssh/id_*`
- Credentials: `**/.aws/credentials`, `**/credentials.json`, `**/service-account.json`, `**/firebase-adminsdk-*.json`, `**/secrets.{yml,yaml}`
- Extensions: `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.jks`, `*.keystore`, `*.ppk`, `*.asc`, `*.gpg`
- Any file larger than 100 MB (use git LFS)
If a secret is needed, use `.env.example` for env vars and an external secret manager for credentials.

### Pull requests targeting `main`, `release`, `staging`
All three are protected — a PR is required (direct push blocked):
- 1 approval, all conversations resolved, **squash or rebase merge only** (linear history enforced — no merge commits).
- Commits must be GPG- or SSH-signed. Signing is required for `main` (`required-signatures-main` ruleset).
- The PR **title** becomes the squash commit message and must match the commit-message regex above (enforced on all three branches).

**Required workflows run on PRs whose base is `main` only** (not `release`/`staging`): `Branch naming convention`, `PR title — Conventional Commits`, and `PR size labeler`.
If a check shows `Waiting for workflow to run` for over a minute, the third-party action is likely missing from the enterprise allowlist.

When the branch-naming or PR-title check fails, the baseline bot auto-posts rename/title suggestions, following the enforced regex patterns.
If the bot's suggestions are incorrect, edit the PR title or branch name to match the required format.

### Pre-push checklist
Before running `git push`:
1. Branch name matches the regex.
2. Every commit in `origin/main..HEAD` matches the commit pattern (`git log --format=%s origin/main..HEAD`).
3. No staged file is in the blocked paths/extensions list.
4. Commits are signed if the target is `main`.

If any check fails, fix it locally rather than letting the server reject the push.
