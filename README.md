# Interactive Labs

Playable 3D explainers by Marinov. Each lab takes one thing people tend to assume and makes the real mechanism visible. This repository is the hub: a small React page that indexes the labs. Every lab is its own app, served at its own path.

## Run locally

Requires Node **22.12.0 or newer** (the floor in `package.json` `engines`; `.nvmrc` pins the same version) and npm.

```sh
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
npm run preview
npm test
```

The build writes static files to `dist/`. No account, API key, database, remote font, or runtime service is required.

`npm test` builds the site, serves it with `npm run preview`, and runs the Playwright suite in `tests/` against the installed Google Chrome. The page tests cover desktop and phone: every lab is a visible card, stats, filters, keyboard movement, root-only 404s with their headers, automatic accessibility checks, reduced motion, High Contrast and print. The build tests check the `SITE_URL` rules. Every page test also fails on any Content-Security-Policy violation.

GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, build and the tests on every push to `main` and every pull request, using the Node version in `.nvmrc`. The actions are pinned to commit SHAs, the checkout token is not kept on disk, and dependencies install with `--ignore-scripts`. Dependabot (`.github/dependabot.yml`) proposes npm and action updates weekly.

Linting uses oxlint (`.oxlintrc.json`), including the React hooks and JSX accessibility rules. ESLint's TypeScript parser does not support TypeScript 7, which this project uses.

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

The Marinov mark is a white **M** on a blue square. `src/assets/mark.svg` is the only source. The favicon link, the header and footer marks, and the 404 page all reference it, and the build emits it once with a content hash in its name, so a changed mark reaches every browser without any manual cache-busting.

`public/favicon.ico` is the same artwork rasterized at 16, 32 and 48 px for browsers that do not use SVG icons. It keeps a fixed name because browsers request `/favicon.ico` directly. Regenerate it whenever the mark changes.

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

The dev server and the build both check the list first and refuse to start, with a clear list of problems, if any entry is wrong:
- ids are lowercase-with-dashes, unique, and not `index` or `index-label` (the page's own ids);
- paths look like `/lab-name/` and are unique, so the no-JS page can never carry a `javascript:` or off-site link;
- title, tagline, assumption, reveal, category and alt text are not empty;
- the swatch is a `#rrggbb` colour;
- every poster and loop file exists under `public/media/labs/<id>/`.

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
- The first poster loads eagerly with high priority; the rest load as they approach the screen, so a long index stays light.
- **Loops are opt-in and must be real.** Add `media.loop` only for a capture that loops without a visible seam. It then autoplays muted while the card is on screen, pauses when off screen or when the tab is hidden, and the caption changes to “Muted loop, captured from the lab.” It is only downloaded when it is about to play, and any failure leaves the poster in place.
- **There are no loops yet.** The earlier four-second camera clips drifted and jumped back at the loop point, so they were removed rather than shown. They remain in history at commit `70f7b37` if they are useful as reference for new captures.
- **Motion without video** is limited to CSS on the real still: the print wipes up out of its mount when a card first comes into view, a live card lifts on hover, and the image eases by a percent or two.

Keep posters at 16:10 and export them from the original render, aiming for about 80 KB. Re-compressing an existing WebP stacks artifacts, so re-export instead. To replace media without code changes, overwrite the same filenames.

`public/media/share.jpg` is the 1200 × 630 sharing image. It is composed from the two posters in the site's own type and colours; rebuild it when the lab line-up changes.

## Motion, sound, and access

- **Reduced motion** turns every animation and transition off and shows the final state (struck assumption, visible correction). No video element is created.
- **Sound** is on by default: quiet synthesized ticks, a detent tick for each keyboard step between cards, a click for choices, and a soft landing when sound is switched back on. Browsers only allow audio after the visitor interacts, so nothing plays on load; the first click or key press unlocks audio and makes its own tick. Switching sound off in the header is remembered on this device. Ticks only ever answer the visitor's own actions. There are no sound files, and audio failures never block navigation.
- **Keyboard:** skip link → lockup → X → sound → status chips → each card in order → footer. Tab visits every card. Inside the grid, the arrow keys move by column and row, Page Up / Page Down step one card, and Home / End jump to the ends. A coming-soon card takes focus itself; a live card's focus lands on its Open lab link, so Enter opens it. Focus rings are signal blue and always land below the sticky header.
- **Screen readers:** the grid is a feed of articles. Each card is named by its title and described by its hook (“You'd think: … The lab shows: …”), with its position in the set. The struck assumption is a real `<s>` element. Stats read as “Paths live: 0 of 2.”
- **High Contrast:** in Windows forced-colours mode the assumption keeps a real line-through, and the selected filter uses the system highlight.
- **Print:** every card prints in its final state, even ones never scrolled into view. Screen-only controls are hidden and the footer prints in ink.
- **No-JS:** the HTML includes a crawlable index generated from `labs.ts` at build time.

## Sharing and SITE_URL

`SITE_URL` is the public origin, read at **build time**. It must be an absolute HTTP(S) origin with no credentials, query, fragment, or subpath, for example `https://your-domain.com/`. An invalid value fails the build.

**With `SITE_URL` set**, the build adds:
- canonical URL;
- `og:url`;
- `og:image` with its size and alt text;
- `twitter:image`, with `twitter:card` set to `summary_large_image`.

The sharing image is `public/media/share.jpg` (1200 × 630 JPEG). The build also writes `sitemap.xml`, listing `/` plus any lab that is `live`, and points `robots.txt` at it.

**Without `SITE_URL`**, no absolute URL is emitted at all, `twitter:card` is a plain `summary`, there is no sitemap, and nothing claims a domain. Title, description, theme colour, `robots.txt`, and CollectionPage structured data are always included. CI builds without it on purpose. A Cloudflare Pages build of `main` without `SITE_URL` prints a warning in the build log.

Set it where the production build runs:

- **Cloudflare Pages:** Project → Settings → Variables and Secrets → add `SITE_URL` = `https://your-domain.com/` for the **Production** environment, then redeploy. Leaving it unset for Preview deployments keeps preview builds from claiming the production canonical.
- **Local production build:** put `SITE_URL=https://your-domain.com/` in an untracked `.env.local` (see `.env.example`).

With a custom domain, the project's `*.pages.dev` address serves the same site. The canonical tag points search engines at the custom domain; a Bulk Redirect from `*.pages.dev` to the domain removes the duplicate entirely. Cloudflare marks preview deployments `noindex`; check the response headers on a preview URL to confirm.

## Security

`public/_headers` sets these on every response the hub serves, including its 404s:

| Header | Why |
| --- | --- |
| `Content-Security-Policy` | Only same-origin scripts, images, media and fonts; no plugins, no framing, no form posts; Trusted Types enforced so no code can write HTML strings into the page. Inline styles are allowed for the small `<style>` blocks and the no-JS fallback. |
| `Strict-Transport-Security` | Browsers stay on HTTPS for a year. `includeSubDomains` is left off because it is a decision for the whole domain. |
| `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` | No MIME sniffing, no framing in older browsers, no full URLs leaked to other sites, no camera or location access, and no cross-window handles. |

`npm run preview` sends the same headers, and the tests fail on any policy violation, so a change that breaks the policy shows up before it ships. Asset inlining is turned off because inlined `data:` URLs would break the policy.

The dev server only listens on `127.0.0.1`, rejects foreign `Host` headers, and refuses dotfiles.

**When labs share the domain:** the hub's headers only cover the hub. The routing layer should send equivalent headers for each lab path. Never let a lab register a service worker with scope `/` (do not send `Service-Worker-Allowed: /`), because it could then control the hub. The router should normalise paths (missing trailing slash, letter case, `//`, `%2F`), redirect only to same-site paths, and keep unknown paths 404.

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
- There is no SPA catch-all and no `_redirects` rewrite. `404.html` is built into `dist/404.html`, which makes Pages answer every unknown path, including the lab paths, with a real 404 until those apps are mounted.
- The dev and preview servers do the same (`appType: 'mpa'` plus a small 404 middleware), so local checks match production.
- See [Cloudflare's static serving behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/).

Separate Pages projects do not automatically become paths on one domain. Mounting the labs needs either a combined publishing output or a routing layer, such as a Cloudflare Worker reverse proxy that picks the lab build by path and serves its HTML, assets, and fallbacks under its own base. That wiring is deliberately out of scope here. This repository only links to the lab paths; it contains no lab bundles, iframes, proxy, or account configuration. Do not mark a lab live before its mount is tested.

## Checking a change

`npm run lint`, `npm run typecheck` and `npm test` cover most of it, and CI runs all three. By eye, also check:

- the home at desktop, short-laptop (1280 × 720), tablet, and phone widths, with no horizontal scroll down to 320px;
- a long index: temporarily add mock entries and confirm every card stays visible, the header stays pinned, and long titles wrap cleanly;
- sound on a real device, including its volume against other tabs;
- after deployment: both real lab URLs, and the response headers on `/` and on an unknown path.

## License

All rights reserved; see `LICENSE`. The code, the mark and the lab media are not licensed for reuse.

Commits and pushes are applied by Marinov through GitHub Desktop.
