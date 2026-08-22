# Wedding seating plan

Password-protected seating planner, hosted on GitHub Pages from `docs/`.

`docs/index.html` is a password gate: the app itself is AES-256-GCM encrypted
(key derived from the password via PBKDF2) and only decrypts in the browser
with the right password. The unencrypted app (`index.html`, which contains the
guest list) is deliberately gitignored and never committed.

To rebuild after editing the app locally:

```sh
node build.js <password>
git add docs/index.html && git commit -m "Rebuild" && git push
```
