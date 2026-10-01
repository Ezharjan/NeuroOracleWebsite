# Neuro-Oracle: Project Page

Project page for **Neuro-Oracle: A Trajectory-Aware Agentic RAG Framework for Interpretable Epilepsy Surgical Prognosis** by Aizierjiang Aiersilan and Mohamad Koubeissi (The George Washington University), AAAI 2026 Fall Symposium Series.

## Links

- arXiv: https://arxiv.org/abs/2604.14216
- Confab: https://cal.com/ezhar/30min
- Slides: `NeuroOracle_AizierjiangAiersilan_silides4AAAI2026FSS.pdf`, also shown in a scrollable viewer above the BibTeX section
- Paper: currently the AAAI 2026 Fall Symposium Series page, https://aaai.org/conference/fall-symposia/2026-fall-symposium-series-2/; replace it with the paper's own URL once available
- Code: hidden until its `REPLACE_ME` URL in `config.json` is filled in and `enabled` is set to `true`

## Editing the page

All page content lives in `config.json`, validated by `config.schema.json` and rendered at runtime by `static/js/render.js`. Figures are stored in `static/images/`; clicking a figure on the page opens it at full resolution. The header title breaks where `site.titleLines` says. The slide viewer reads the PDF named in `slides.file`, so replacing that file updates the viewer. To show a poster, place it in the root as `paper_poster.pdf`, set `poster.enabled` to `true`, and add a Poster entry to `links`.

## Local preview

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` directly from disk does not work, because browsers block loading `config.json` over `file://`.

## Deployment

The site is static and needs no build step. Push this folder to a GitHub repository and enable GitHub Pages (Settings → Pages → deploy from a branch, root folder), or upload it to any static host. After deployment, set `site.url` in `config.json` to the page's public address.

Delete the `__reference_materials/` folder before publishing: it holds the unpublished paper source, and the page does not depend on it.
