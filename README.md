# Interactive Labs

Playable 3D explainers by Marinov. Each lab takes one thing people tend to assume and makes the real mechanism visible. This repository is the hub: a small React page that indexes the labs. Every lab is its own app, served at its own path.

## Run locally

Requires Node **22.12.0 or newer** (the floor in `package.json` `engines`; `.nvmrc` pins the same version) and npm.

```sh
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
```

The build writes static files to `dist/`. No account, API key, database, remote font, or runtime service is required.

GitHub Actions (`.github/workflows/ci.yml`) runs `npm ci`, `npm run typecheck`, and `npm run build` on every push to `main` and on every pull request, using the Node version in `.nvmrc`. A type or build error fails the job.

## How the page is built

Every lab is always on screen as a card. Nothing is hidden behind a selection, so the page reads the same with two labs or twenty.

**Desktop (960px and wider)**

- **Rail (left, sticky).** The Marinov lockup, the X link, the sound control, the title **Interactive Labs by Marinov**, a one-line lede, and the stats.
- **Index (right).** A header that sticks to the top of the screen, with a lab count and status chips (All / Live / Soon), above a grid of cards. A chip with nothing to show is disabled rather than hidden, so “Live 00” stays visible. Filtering only narrows the grid; the default is All.

**Narrower screens**

- The rail becomes the page header, and the stats become a ledger on phones.
- The index header sticks to the top while the cards scroll: two columns on tablets, one on phones.

**A card** is a mounted print: the poster framed by viewfinder brackets on a mount in the lab's swatch colour, a caption saying what the image is, the title, and the one-breath hook: the misconception struck through in blue pencil with the correction underneath. A quiet foot shows the status.

**Linking.** Each card has its lab's id, so `/#coin-table` scrolls straight to it.

**Stats** (in the rail) are counted from `src/data/labs.ts` at render time: labs in the index, misconceptions (labs with an assumption and a reveal), and paths live out of the total. Nothing is typed in by hand, so the numbers cannot drift from the data.

**X.** The header and the footer link to [@marinovm10](https://x.com/marinovm10) in a new tab (`rel="noopener noreferrer"`).

### Mark

The Marinov mark is a white **M** on a blue square. `public/favicon.svg` is the source, and the header and footer render that same file.

- `public/favicon.ico` is the same artwork rasterized at 16, 32 and 48 px, for browsers that do not use SVG icons. Regenerate it whenever the SVG changes.
- The icon links and the marks use `?v=2`. Bump it when the mark changes, so browsers holding an old cached icon fetch the new one.

### Palette and type

| Token | Value | Use |
| --- | --- | --- |
| Paper | `#f0ebdf` | Page background (warm cream) |
| Ink | `#141310` | Text, rules, colophon |
| Muted | `#66625a` | Meta and secondary text (4.8:1 on paper) |
| Signal | `#2b3be6` | Only for interactive and active states, and the mark |
| Lab swatch | per lab, in `labs.ts` | Mount colour sampled from the poster; decorative only |

Type uses system fonts only: Segoe UI Variable (Display and Text) or the platform sans for headings and body, Sitka or the platform serif for the misconception lines, and Cascadia Mono or the platform mono for meta.

## Lab data and status

Labs are listed in `src/data/labs.ts`, in index order. Each entry holds the title, field, tagline, the `assumption` / `reveal` pair, path, status, media, swatch, and an optional glyph for the card header. Adding a lab is adding an entry and its media folder.

Both labs are `soon`. They stay `soon` until `/standing-wave/` and `/coin-table/` are actually mounted and tested on the shared domain. Changing a lab to `live` updates every surface at once:

| | `soon` | `live` |
| --- | --- | --- |
| Card | Not a link. Hovering only brings the print into focus. The foot says “Coming soon” and shows the path as plain text: “not mounted yet”. | The whole card is one link (a stretched **Open lab ↗** anchor), so one click opens the lab. It lifts on hover and shows an “Open lab” chip at the pointer. |
| Chips | Counted under Soon | Counted under Live |
| Stats | Paths live `00/02` | Paths live counts it |
| Colophon | “None are open yet” | “1 of 2 open now” |
| No-JS fallback and JSON-LD | Title and path as text only | Title links to the path (with `SITE_URL`, the JSON-LD part gets a URL) |

A coming-soon lab never links to a destination that isn't there.

## Media

```text
public/media/labs/<lab-id>/
  poster.webp   required, 1200 × 750 still captured from the lab build
  loop.mp4      optional, only a real seamless loop (see below)
  loop.webm     optional, same loop in VP9
```

- **Posters are the honest default.** Every card shows its poster, with alt text describing the scene and a caption that says what it is: “Still, captured from the lab.” Reduced-motion and data-saver visitors only ever get stills.
- The first two posters load eagerly; the rest load as they approach the screen, so a long index stays light.
- **Loops are opt-in and must be real.** Add `media.loop` only for a capture that loops without a visible seam. It then autoplays muted while the card is on screen, pauses when off screen or when the tab is hidden, and the caption changes to “Muted loop, captured from the lab.” It is only downloaded when it is about to play, and any failure leaves the poster in place.
- **There are no loops yet.** The earlier four-second camera clips drifted and jumped back at the loop point, so they were removed rather than shown. They remain in history at commit `70f7b37` if they are useful as reference for new captures.
- **Motion without video** is limited to CSS on the real still: the print wipes up out of its mount when a card first comes into view, a live card lifts on hover, and the image eases by a percent or two.

Keep posters at 16:10. To replace media without code changes, overwrite the same filenames.

## Motion, sound, and access

- **Reduced motion** turns every animation and transition off and shows the final state (struck assumption, visible correction). No video element is created.
- **Sound** is off by default. The header control enables quiet synthesized ticks: a detent tick for each keyboard step between cards, a click for choices, and a soft landing when sound is switched on. The preference is stored locally, and even a remembered “on” waits for a user gesture. There are no sound files, and audio failures never block navigation.
- **Keyboard:** skip link → lockup → X → sound → status chips → each card in order → footer. Tab visits every card. Inside the grid, the arrow keys move by column and row, Page Up / Page Down step one card, and Home / End jump to the ends. A coming-soon card takes focus itself; a live card's focus lands on its Open lab link, so Enter opens it. Focus rings are signal blue and always land below the sticky header.
- **Screen readers:** the grid is a feed of articles. Each card is named by its title and described by its hook (“You'd think: … The lab shows: …”), with its position in the set. The struck assumption is a real `<s>` element. Stats read as “Paths live: 0 of 2.”
- **No-JS:** the HTML includes a crawlable index generated from `labs.ts` at build time.

## Sharing and SITE_URL

`SITE_URL` is the public origin, read at **build time**. It must be an absolute HTTP(S) origin with no credentials, query, fragment, or subpath, for example `https://your-domain.com/`. An invalid value fails the build.

**With `SITE_URL` set**, the build adds:
- canonical URL;
- `og:url`;
- `og:image` with its size and alt text;
- `twitter:image`, with `twitter:card` set to `summary_large_image`.

The Standing Wave poster is the sharing image until a dedicated one exists.

**Without `SITE_URL`**, no absolute URL is emitted at all, `twitter:card` is a plain `summary`, and nothing claims a domain. Title, description, theme colour, robots, and CollectionPage structured data are always included. CI builds without it on purpose.

Set it where the production build runs:

- **Cloudflare Pages:** Project → Settings → Variables and Secrets → add `SITE_URL` = `https://your-domain.com/` for the **Production** environment, then redeploy. Leaving it unset for Preview deployments keeps preview builds from claiming the production canonical.
- **Local production build:** put `SITE_URL=https://your-domain.com/` in an untracked `.env.local` (see `.env.example`).

## Deploy and the path contract

Publish the hub's `dist/` as a static Cloudflare Pages project:

- Build command: `npm run build`
- Output directory: `dist`
- Node version: `22.12.0` (matches `.nvmrc`; set `NODE_VERSION` in Pages if its default differs)
- Production variable: `SITE_URL=https://your-domain.com/`

The intended final URLs are:

| App | Public path | Vite base in that app |
| --- | --- | --- |
| Interactive Labs | `/` | `/` |
| Standing Wave | `/standing-wave/` | `/standing-wave/` |
| The Coin Table | `/coin-table/` | `/coin-table/` |

**The hub is root-only.**
- It serves one page, `/`, and makes no claim to any other path.
- There is no SPA catch-all and no `_redirects` rewrite. `dist/404.html` makes Pages answer every unknown path, including the lab paths, with a real 404 until those apps are mounted.
- The dev and preview servers do the same (`appType: 'mpa'` plus a small 404 middleware), so local checks match production.
- See [Cloudflare's static serving behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/).

Separate Pages projects do not automatically become paths on one domain. Mounting the labs needs either a combined publishing output or a routing layer, such as a Cloudflare Worker reverse proxy that picks the lab build by path and serves its HTML, assets, and fallbacks under its own base. That wiring is deliberately out of scope here. This repository only links to the lab paths; it contains no lab bundles, iframes, proxy, or account configuration. Do not mark a lab live before its mount is tested.

## Checking a change

CI covers typecheck and build. Also check:

- the home at desktop, short-laptop (1280 × 720), tablet, and phone widths, with no horizontal scroll down to 320px;
- the grid with Tab and arrow keys, the chips, and a deep link such as `/#coin-table`;
- a long index: temporarily add mock entries and confirm every card stays visible, the header stays pinned, and long titles wrap cleanly;
- reduced motion (stills only, no video requests) and sound on/off;
- that `/standing-wave/`, `/coin-table/`, and any unknown path return the 404 page from `npm run preview`;
- after deployment, both real lab URLs.

Commits and pushes are applied by Marinov through GitHub Desktop.
