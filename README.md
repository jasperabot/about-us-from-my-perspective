# Relationship Reflections

A simple static webpage that presents relationship reflections in two sections:

- Negative points
- Positive points

## Project Structure

- `index.html` - Main page markup
- `styles.css` - Page styles
- `negative.md` - Source notes for negative reflections
- `positive.md` - Source notes for positive reflections

## Getting Started

No build tools or dependencies are required.

1. Open `index.html` directly in your browser, or
2. Serve the folder with any local static server.

Example using Python:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Notes

This project is intentionally lightweight and uses plain HTML and CSS.

## GitHub Pages + Serverless Repo Writes

GitHub Pages cannot safely write files into the repository directly from browser code.
This project includes a secure pattern:

- The page sends form data from `submit.js` to a serverless endpoint.
- The endpoint uses a server-side GitHub token to commit a new markdown file.
- The token is never exposed to the browser.

### Files Added

- `submit.js` - Frontend form submit logic
- `serverless/cloudflare-worker.js` - Example serverless endpoint (Cloudflare Worker)

### Setup Steps

1. Create a fine-grained personal access token with repository contents write access.
2. Deploy `serverless/cloudflare-worker.js` as a Cloudflare Worker.
3. Set Worker secrets/variables:
	- `GITHUB_TOKEN`
	- `GITHUB_OWNER` (your GitHub username or org)
	- `GITHUB_REPO` (this repository name)
	- `GITHUB_BRANCH` (optional, default: `main`)
	- `ALLOWED_ORIGIN` (your GitHub Pages URL)
4. Copy your Worker URL and set `ENDPOINT_URL` in `submit.js`.
5. Push to GitHub Pages and test a submission.

Each successful submission is committed under `submissions/YYYY-MM-DD/*.md`.

### Cloudflare Worker Commands

From the repository root:

1. Install Wrangler globally:
	npm install -g wrangler
2. Authenticate with Cloudflare:
	wrangler login
3. Move to the serverless folder:
	cd serverless
4. Edit `wrangler.toml` and replace placeholder values for:
	- `GITHUB_OWNER`
	- `GITHUB_REPO`
	- `ALLOWED_ORIGIN`
5. Set the GitHub token as a Worker secret:
	wrangler secret put GITHUB_TOKEN
6. Deploy:
	wrangler deploy

After deploy, Wrangler prints the Worker URL.
Set that URL in `submit.js` as `ENDPOINT_URL`.
