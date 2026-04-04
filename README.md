# Stem

The web app for [stem.md](https://stem.md) -- a social discovery platform for intellectual curiosity.

Create stems (topic collections), save finds (links and resources), follow other people's explorations. What Goodreads did for books and Letterboxd did for movies, Stem does for niche interests.

## Stack

- [Remix v2](https://remix.run) + [Vite](https://vitejs.dev)
- [Cloudflare Pages](https://pages.cloudflare.com) (hosting)
- [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite database)
- [Cloudflare R2](https://developers.cloudflare.com/r2/) (avatar storage)
- CSS custom properties + inline styles (no Tailwind)

## Development

```bash
npm install
npm run dev
```

You'll need a `wrangler.toml` with your own D1 database binding and a `.dev.vars` file with:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
TURNSTILE_SECRET=...
ADMIN_SECRET=...
```

## Deploy

Push to `main`. GitHub Actions builds and deploys to Cloudflare Pages automatically.

## License

[MIT](LICENSE)
