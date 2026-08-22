# Wedding seating plan

Password-protected seating planner, hosted on GitHub Pages from `docs/`.

`docs/index.html` is a password gate: the app itself is AES-256-GCM encrypted
(key derived from the password via PBKDF2) and only decrypts in the browser
with the right password. The unencrypted app (`index.html`, which contains the
guest list) is deliberately gitignored and never committed.

Two passwords unlock two variants: the edit password opens the full planner;
the optional planner password opens a locked, view-only version for the venue
team. If a `plan.json` ("Save plan" download from the app) sits in the repo
root, it is baked in as the arrangement every fresh visitor sees — it contains
guest names, so it is gitignored too.

To rebuild after editing the app locally:

```sh
node build.js <editPassword> [plannerPassword]
git add docs/index.html && git commit -m "Rebuild" && git push
```
