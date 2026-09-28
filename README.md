# Word Faker – deploy to wordfaker.com (GitHub Pages)

1. Create a public repository on GitHub (e.g. `wordfaker`) and upload everything in this folder
   to the repository root (index.html, icons, site.webmanifest, robots.txt, sitemap.xml, 404.html, CNAME).
2. Repository → Settings → Pages → Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
3. Under "Custom domain" enter `wordfaker.com` (the CNAME file already contains it) and tick "Enforce HTTPS"
   once the certificate is ready (can take up to an hour).
4. At your domain registrar, set DNS:
   - `A`     @    185.199.108.153
   - `A`     @    185.199.109.153
   - `A`     @    185.199.110.153
   - `A`     @    185.199.111.153
   - `CNAME` www  <your-github-username>.github.io
5. After the site is live: add the domain in Google Search Console and submit
   https://wordfaker.com/sitemap.xml.

Cloudflare Pages or Netlify work the same way: drag the folder in, point the domain at them.
