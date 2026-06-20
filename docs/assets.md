# Assets

This page lists every image bundled with the app, where it is used, and the license for each third-party photo.

## App Icons & Splash

| File | Used by | Notes |
| --- | --- | --- |
| `assets/icon.png` | `app.json.icon` (iOS, Android, web) | 1024×1024 master icon. |
| `assets/splash-icon.png` | Splash | Same artwork, splash crop. |
| `assets/favicon.png` | `app.json.web.favicon` | Web tab icon. |
| `assets/android-icon-background.png` | `app.json.android.adaptiveIcon.backgroundImage` | Light teal background. |
| `assets/android-icon-foreground.png` | `app.json.android.adaptiveIcon.foregroundImage` | Foreground. |
| `assets/android-icon-monochrome.png` | `app.json.android.adaptiveIcon.monochromeImage` | Themed icon. |

The splash background color is implicit (the platform default) and the adaptive-icon background color is `#EAF6F2`.

## Photos

Eleven CC-licensed photos live in `assets/photos/`. The canonical credit list is in `ASSET_CREDITS.md` at the repo root. They are referenced from the `places` and `foods` catalogs in `App.tsx`.

| File | License | Author | Used by |
| --- | --- | --- | --- |
| `ben-thanh-market.jpg` | CC BY 2.0 | Riza | `places[ben_thanh_market]` |
| `my-khe-beach.jpg` | CC BY 2.0 | Ray in Manila | Beach-themed fallback |
| `hoi-an-ancient-town.jpg` | CC BY-SA 4.0 | Steffen Schmitz | Central Vietnam fallback |
| `hoan-kiem-lake.jpg` | CC BY-SA 2.0 | Brian Johnson & Dane Kantner | Default for many Hanoi/Hoi An entries |
| `pho.jpg` | CC BY 3.0 | Kham Tran | `foods[pho]`, `foods[bun_bo_hue]` |
| `banh-mi.jpg` | CC BY-SA 2.0 | Stu Spivack | `foods[banh_mi]`, `foods[ca_phe_sua_da]` |
| `ha-long-bay.jpg` | CC BY 2.0 | Richard Mortel | Many Ha Long / Ninh Binh / Sa Pa / Ha Giang entries |
| `hue-imperial-city.jpg` | CC BY 2.0 | shankar s. | All Hue / imperial entries |
| `phong-nha-cave.jpg` | CC BY-SA 3.0 | Bui Thuy Dao Nguyen | (Reserved) |
| `phu-quoc-beach.jpg` | CC BY-SA 4.0 | Ralph Martin / Jerez blau | (Reserved) |
| `cai-rang-floating-market.jpg` | CC BY-SA 4.0 | Christophe95 | (Reserved) |

> The full attribution, including Wikimedia source URLs, lives in [`ASSET_CREDITS.md`](../ASSET_CREDITS.md) at the repo root. That file is the canonical legal record; this table is a content map.

## Asset Pipeline

There is no image processing step in the current build. The PNGs are committed as-is and used by `require('./assets/icon.png')` (Metro resolves them at build time) and `require('./assets/photos/*.jpg')` from inside the data catalogs.

## Adding a New Photo

1. Drop the file into `assets/photos/`.
2. Add a row to `ASSET_CREDITS.md` with the license, author, and source URL.
3. Reference it from the appropriate `Place` or `Food` entry with `require('./assets/photos/your-file.jpg')`.

If you want a smaller bundle, run a build step like `npx expo optimize` to re-encode JPEGs and PNGs at reasonable sizes.
