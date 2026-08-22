# Wedding seating plan

Password-protected seating planner, hosted on GitHub Pages from `docs/`.

`docs/index.html` is a password gate: the app itself is AES-256-GCM encrypted
(key derived from the password via PBKDF2) and only decrypts in the browser
with the right password. The unencrypted app (`index.html`, which contains the
guest list) is deliberately gitignored and never committed.

Two passwords unlock two variants: the edit password opens the full planner;
the optional planner password opens a locked, view-only version for the venue
team.

Editors have a "Publish to planner" button that commits the current plan —
AES-encrypted with `app.key` — to `docs/plan.enc.json` via the GitHub API
(needs a fine-grained PAT with Contents read/write on this repo, pasted into
the app once). The planner view fetches and decrypts that file on every load,
so published changes appear there automatically. `app.key` is generated once
by the build and gitignored; losing it just means republishing the plan after
a rebuild.

If a `plan.json` ("Save plan" download from the app) sits in the repo root, it
is baked in as the fallback arrangement — it contains guest names, so it is
gitignored too.

To rebuild after editing the app locally:

```sh
node build.js <editPassword> [plannerPassword]
git add docs/index.html && git commit -m "Rebuild" && git push
```
