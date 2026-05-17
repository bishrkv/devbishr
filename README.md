# Bishr KV Portfolio

This portfolio now persists admin edits to JSON files on a small Node server.

## Run

```powershell
npm start
```

Open `http://localhost:3000` in your browser.

## Persistence

- `data/site-data.json` stores About, Skills, Services, Timeline, Projects, and Testimonials.
- `data/messages.json` stores contact form messages.
- Admin edits save through the `/api/site-data` endpoint instead of browser storage.

## Notes

If you open `index.html` directly from disk, JSON persistence will not work because the API server is required.
