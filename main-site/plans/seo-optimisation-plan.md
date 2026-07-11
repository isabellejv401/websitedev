# SEO Optimisation Plan

## Audit Summary

| Factor                        | Status                                        |
| ----------------------------- | --------------------------------------------- |
| Meta descriptions             | ✅ Present on all pages                       |
| `<title>` tags                | ✅ Present but could be stronger              |
| `<h1>` headings               | ✅ Present                                    |
| Heading hierarchy             | ✅ Semantic (h1 → h2 → h3)                    |
| `lang="en"` attribute         | ✅ Set                                        |
| Mobile viewport               | ✅ Set                                        |
| Image `alt` attributes        | ✅ N/A (no `<img>` tags — uses SVGs + canvas) |
| Open Graph / Twitter Card     | ❌ Missing on all pages                       |
| Canonical URLs                | ❌ Missing                                    |
| JSON-LD structured data       | ❌ Missing                                    |
| `robots.txt`                  | ❌ Missing                                    |
| `sitemap.xml`                 | ❌ Missing                                    |
| Favicon / touch icons         | ❌ Not found                                  |
| Performance (CSP, preconnect) | ✅ Good                                       |

---

## Pages to Update

### Public pages (indexable by search engines)

1. `index.html` — Homepage
2. `accessibility-statement.html` — Legal
3. `privacy-policy.html` — Legal
4. `terms-and-conditions.html` — Legal
5. `login.html` — Client login (set `noindex`)

### Non-public pages (should be excluded from search)

6. `dashboard.html` — Client dashboard (set `noindex`)
7. `reset-password.html` — Auth flow (set `noindex`)

---

## Action Items

### 1. Open Graph & Twitter Card Tags

Add to `<head>` of all 5 public pages:

```html
<!-- Primary Meta -->
<meta property="og:type" content="website" />
<meta property="og:site_name" content="nuvisco" />
<meta property="og:title" content="[page-specific title]" />
<meta property="og:description" content="[page-specific description]" />
<meta property="og:url" content="[canonical URL]" />
<meta property="og:locale" content="en_GB" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="[page-specific title]" />
<meta name="twitter:description" content="[page-specific description]" />

<!-- Optional: OG Image (if available) -->
<meta property="og:image" content="[URL to social share image]" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

### 2. Canonical URLs

Add to all 7 pages (public + non-public):

```html
<link rel="canonical" href="[page-specific URL]" />
```

### 3. Robots Meta Tags

- Public pages: no tag needed (indexable by default) or explicit `<meta name="robots" content="index, follow" />`
- Login page: `<meta name="robots" content="noindex, nofollow" />`
- Dashboard: `<meta name="robots" content="noindex, nofollow" />`
- Reset password: `<meta name="robots" content="noindex, nofollow" />`

### 4. JSON-LD Structured Data

Add to `index.html` homepage:

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Nuvisco",
    "url": "[site URL]",
    "description": "nuvisco is a digital craft studio building visually unreal websites, immersive 3D experiences, and SEO-driven growth for ambitious brands.",
    "email": "hello@nuvisco.com",
    "telephone": "+44 7504 541615",
    "foundingDate": "2026",
    "founders": [
      { "@type": "Person", "name": "Jacob Williams" },
      { "@type": "Person", "name": "Josh Geo" },
      { "@type": "Person", "name": "Isabelle Viles" }
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "GB"
    }
  }
</script>
```

Also add `WebSite` schema to homepage:

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "nuvisco",
    "url": "[site URL]",
    "description": "Digital craft studio — web design, 3D development, SEO engineering and brand art direction.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "[site URL]/?s={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }
</script>
```

### 5. `robots.txt`

Create at `/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /dashboard.html
Disallow: /login.html
Disallow: /reset-password.html

Sitemap: [site URL]/sitemap.xml
```

### 6. `sitemap.xml`

Create at `/sitemap.xml` listing all public pages with their priority/frequency.

### 7. Homepage `<title>` Improvement

Current: `nuvisco`
Improved: `nuvisco — Digital Craft Studio | Web Design, 3D & SEO`

### 8. Favicon / Touch Icons

If favicon assets exist, add:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

---

## Implementation Order

| #   | Task                                                      | Files Affected                                                                     |
| --- | --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | Add OG/Twitter tags + canonical + robots to `index.html`  | `index.html`                                                                       |
| 2   | Add OG/Twitter tags + canonical + robots to 3 legal pages | `accessibility-statement.html`, `privacy-policy.html`, `terms-and-conditions.html` |
| 3   | Add canonical + robots `noindex` to `login.html`          | `login.html`                                                                       |
| 4   | Add canonical + robots `noindex` to `dashboard.html`      | `dashboard.html`                                                                   |
| 5   | Add JSON-LD structured data to homepage                   | `index.html`                                                                       |
| 6   | Create `robots.txt`                                       | `robots.txt`                                                                       |
| 7   | Create `sitemap.xml`                                      | `sitemap.xml`                                                                      |
| 8   | Improve homepage `<title>`                                | `index.html`                                                                       |
| 9   | Add favicon links (if assets exist)                       | All public pages                                                                   |

---

## Questions

1. **Site URL** — What is the production domain (e.g., `https://nuvisco.com`)? This is needed for canonical URLs, sitemap, and OG image paths.
2. **OG Image** — Is there a brand image/logo for social sharing (1200×630px)?
3. **Favicon** — Are there favicon assets already designed, or should we skip this step?
