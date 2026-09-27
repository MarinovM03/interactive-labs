# Interactive Labs

Playable 3D explainers by Marinov. Each lab takes one thing people tend to assume and makes the real mechanism visible. This repository is the hub: a small React page that indexes the labs. Every lab is its own app, served at its own path.

## Run locally

Requires Node **22.12 or newer** and npm.

```sh
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
```

The build writes static files to `dist/`. No account, API key, database, remote font, or runtime service is required.

## How the page is built

The home is a split index rather than a grid of cards.

- **Rail (left, sticky on desktop).** The Marinov lockup, the sound control, the display title, a one-line lede, and a numbered index of labs. A signal-blue marker travels to whichever lab is crossing the middle of the screen. Hovering a row previews that lab in a small loupe that crosses the column rule. Clicking a row scrolls to its plate.
- **Plates (right).** Each lab is a mounted print: a poster framed by viewfinder brackets, sitting on a mount in the lab's own swatch colour. Below it are the title, the misconception and its correction, and a quiet status line.
- **Misconception pair.** "You'd think" is struck through in blue pencil when the plate first comes into view, then "The lab shows" lands underneath.
- **Colophon.** A dark band that closes the page.

On screens narrower than 960px the rail becomes the page header, the index gains poster thumbnails, and plates stack underneath.

### Palette and type

| Token | Value | Use |
| --- | --- | --- |
| Paper | `#ece8df` | Page background |
| Ink | `#141310` | Text, rules, colophon |
| Muted | `#66625a` | Meta and secondary text (4.6:1 on paper) |
| Signal | `#2b3be6` | Only for interactive and active states: marker, focus, Open lab, strike-through |
| Lab swatch | per lab, in `labs.ts` | Mount colour sampled from the poster; decorative only |

Type uses system fonts only: Segoe UI Variable (Display and Text) or the platform sans for headings and body, Sitka or the platform serif for the misconception lines, and Cascadia Mono or the platform mono for meta.

## Lab data and status

Labs are listed in `src/data/labs.ts`. Each entry holds the title, category, one-line tagline, the `assumption` / `reveal` pair, path, status, media, swatch, and glyph (`wave` or `coins`).

Both labs are currently `soon` because the same-domain path mounts have not been deployed or verified. Change a lab's `status` to `live` only once its path works. That single change updates everything:

| | `soon` | `live` |
| --- | --- | --- |
| Plate | Not a link. A preview button plays the camera move; mouse clicks only confirm it isn't open yet. | The whole plate is one link (a stretched **Open lab** anchor). One click opens the lab. |
| Foot | "Coming soon" and the path as plain text, "not open yet" | "Live" and a signal-blue **Open lab ↗** button |
| Index row | `Soon` | `Live` |
| Colophon | "None are open yet." | "1 of 2 open now." |
| No-JS fallback and JSON-LD | Title and path as text only | Title links to the path (with `SITE_URL`, the JSON-LD part gets a URL) |

Coming-soon labs never link to a destination that isn't there. The local dev and preview servers intentionally answer the lab paths with the hub's “Not here yet” page. They do not serve or simulate the lab apps.

## Media

```text
public/media/labs/
  standing-wave/
    poster.webp
    preview.mp4
    preview.webm
  coin-table/
    poster.webp
    preview.mp4
    preview.webm
```

These are real captures of the local lab builds, with their interface hidden. **No placeholder media is shipped.** Refresh them when the underlying labs change.

- **Posters are the default everywhere.** 1200 × 750 WebP (16:10). They load first and are all that reduced-motion and data-saver visitors ever see.
- **Clips are a camera, not a loop.** Each clip is a short, silent camera move (about four seconds, 1200 × 750). It never autoplays or loops. Instead, it is scrubbed:
  - **Desktop:** moving across a plate maps pointer position to clip time. A playhead, a detent timeline, and a time readout appear. Leaving the plate eases the camera back home.
  - **Keyboard:** focusing a plate's control plays the move once, then returns.
  - **Touch:** dragging sideways scrubs; vertical swipes still scroll the page. Tapping a coming-soon plate plays the move once; tapping a live plate opens it.
- **Frame 0 must match the poster.** The clip fades in over the still at time 0, so a mismatched first frame would show as a jump. Export clips starting from the poster's camera.
- **Loading.** A clip is fetched only on the first interaction with its plate. MP4 (H.264) is listed first because it seeks faster; WebM (VP9) is the fallback. If both fail, the poster and link keep working.

To replace media without code changes, overwrite the same filenames. Keep posters at 16:10 and clips at 2–6 seconds with no audio track. Other paths can be set per lab in `labs.ts`. To ship a lab with a still only, remove both video fields; the timeline and scrub hints then disappear for that plate.

## Motion, sound, and access

- **Motion** is tied to structure. The title rises on load. A plate wipes up out of its mount the first time it is seen, then the mount slides out. The misconception is struck through, then corrected. The index marker travels. Brackets close in and turn blue while a plate is in hand. Glyphs animate only while their lab is engaged: the standing wave oscillates between fixed nodes, and coins are selected in turn.
- **Reduced motion** shows stills only. No video element is created and no clip is requested. Text appears in its final struck and corrected state, and the rail says so.
- **Sound** is off by default. The header control enables quiet synthesized ticks: a hover tick when a plate is picked up, a detent tick at each of the eight timeline marks while scrubbing, and a click on open or preview. The preference is stored locally, and even a remembered “on” waits for a user gesture. Audio failures never block navigation. There are no sound files.
- **Keyboard:** Skip link → lockup → sound → index rows → each plate's control. Focus rings are signal blue; on plates, the ring hugs the print.
- **Accessible names:** live plates read “Open lab: Standing Wave” and are described by the lab's correction line; coming-soon previews read “Preview a camera move through …” and are described by the status. The struck assumption uses a real `<s>` element.
- **No-JS:** the HTML includes a crawlable index generated from `labs.ts` at build time.
- System fonts avoid font downloads and layout shifts. Posters reserve their aspect ratio.

## Sharing and SITE_URL

Set the public root URL at **build time**, either in the hosting environment or an untracked `.env.local`:

```dotenv
SITE_URL=https://your-domain.com/
```

The value must be an absolute HTTP(S) origin with no credentials, query, fragment, or subpath. The hub runs at `/`.

With `SITE_URL` set, the build adds an absolute canonical URL, Open Graph URL, Open Graph image, and Twitter image. The Standing Wave poster is the collection's sharing image. Title, description, theme colour, robots, and CollectionPage structured data (listing each lab) are always included.

Without `SITE_URL`, absolute URLs are omitted rather than publishing a made-up domain. Set it and rebuild before launch. A dedicated share image can replace the poster later in `vite.config.ts`.

## Deploy and the path contract

Publish the hub's `dist/` as a static Cloudflare Pages project:

- Build command: `npm run build`
- Output directory: `dist`
- Node version: 22.12 or newer
- Build environment: `SITE_URL=https://your-domain.com/`

The intended final URLs are:

| App | Public path | Vite base in that app |
| --- | --- | --- |
| Interactive Labs | `/` | `/` |
| Standing Wave | `/standing-wave/` | `/standing-wave/` |
| The Coin Table | `/coin-table/` | `/coin-table/` |

Separate Pages projects do not automatically become paths on one domain. Future deployment wiring needs either a combined publishing output or a routing layer, such as a Cloudflare Worker reverse proxy that selects the correct lab build by path. That layer must route each lab's HTML, nested assets, and fallback responses consistently with its own Vite base.

The lab repositories own their build and base settings. This repository only links to their public paths; it contains no lab bundles, live scenes, iframes, proxy implementation, or account configuration.

The included `404.html` stops Pages from treating unknown lab paths as hub routes. Keep true missing-page responses until the lab mounts exist. See [Cloudflare's static serving behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/). Full multi-project routing and domain setup are intentionally deferred. Do not mark a lab live before testing its mount.

## Checking a change

Production build and TypeScript checks are the baseline. Also check:

- the home at desktop, short-laptop, tablet, and phone widths (no horizontal scroll down to 320px);
- hover scrubbing and return, index marker and loupe;
- keyboard order and focus rings;
- touch drag vs. tap;
- reduced motion (stills only, no clip requests);
- sound on/off and persistence;
- a missing clip (the poster must remain);
- after deployment, both real lab URLs.

Commits and pushes are applied by Marinov through GitHub Desktop.
