# API Solomon Dugout ⚾

**A pocket dugout board for Vic's API 11U Solomon baseball** (branding only — no invented schedule, roster, scores, or coaches). Interactive diamond with fielders, throw/run/cutoff arrows, multi-frame defensive playback, blank lineup card, empty scorebook grid, and practice crib templates. Navy · red · dirt chrome. One offline HTML file — no account, no network, no ads.

* **Open it:** double-click `dist/api-dugout.html` (works from file://, USB, or AirDrop), or run `./run.sh` and go to http://127.0.0.1:4283/
* **Best screenshot:** `screenshots/00-best-home.png`

## What it does

* **◆ Diamond board:** place P, C, 1B, 2B, 3B, SS, LF, CF, RF on a youth diamond. Draw Throw (solid navy), Coverage run (dashed red), Cutoff/relay (dirt double). Build frames and press ▶.
* **Defensive presets (8, all generic):** Steal coverage — 2nd, Bunt defense, Cutoff to 2nd, First-and-third look, Relay — LF to home, Rundown 1st–2nd, Double-play feed, Passed ball — cover home. Labelled “example” — teaching only.
* **📋 Lineup card:** blank 1–9 + EH; editable names (start as Player 1…); localStorage only.
* **📊 Scorebook lite:** empty inning × batter grid; tap to cycle marks. No pre-filled scores.
* **📝 Practice crib:** empty note-card templates for whatever the family wants to jot down — **not a schedule**.
* **Save & share:** named plays in localStorage, Export/Import JSON, Save PNG (title band).

## Run

```
./run.sh            # build dist/ snapshot, serve on 127.0.0.1:4283
./run.sh --shots    # build + re-shoot screenshots + serve
```

## Files

```
web/index.html, web/app.css, web/app.js   source
build.py                                  inlines web/ into dist/api-dugout.html
dist/api-dugout.html                      offline snapshot
server.py                                 stdlib dev server on 127.0.0.1:4283
run.sh                                    build → (shots) → serve
screenshots/                              00-best-home.png
```

## Rules

* Every preset and practice card is a **generic teaching template**. No real rosters, scores, opponents, practice times, or coaches invented.
* Private: server binds to **127.0.0.1** only. Snapshot has no CDN, analytics, or network APIs.


---
## Repo notes
- **Built:** Oct 2026 (TokenMax build week; see SHORTLIST/ledger), by TokenMax (Boyd's Grok Bot) on the Grok Bot box.
- **Run:** `./run.sh` (then open the localhost URL it prints).
- Imported from `/workspace/tokenmax/api-dugout` on Oct 23, 2026. node_modules, virtualenvs, logs and files over 20 MB were left out.
