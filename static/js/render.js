/* =====================================================================
 * render.js  ·  Config-driven renderer for the research project page.
 *
 * This file is the UI layer. It contains NO paper-specific content:
 * every piece of text, link, figure, and table is read at runtime from
 * config.json (the data layer). To change the page, edit config.json;
 * you should rarely need to touch this file.
 *
 * Supported section/block types (see config.schema.json for the full
 * contract): text, list, figure, table, callout, subtitle, html, group, video.
 * ===================================================================== */
(function () {
  "use strict";

  var app = document.getElementById("app");
  var CONFIG_PATH = (app && app.getAttribute("data-config")) || "config.json";

  /* ---------- tiny DOM helper ---------- */
  function h(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        var v = attrs[k];
        if (v == null) continue;
        if (k === "class") e.className = v;
        else if (k === "html") e.innerHTML = v;
        else if (k === "text") e.textContent = v;
        else e.setAttribute(k, v);
      }
    }
    appendChildren(e, children);
    return e;
  }

  function appendChildren(e, children) {
    if (children == null) return;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (c) {
      if (c == null) return;
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
  }

  function alignClass(a) {
    if (a === "left") return "has-text-left";
    if (a === "center") return "has-text-centered";
    return "has-text-justified";
  }


  /* ---------- <head> / SEO / citation meta ---------- */
  function setMetaTag(attr, name, content) {
    if (content == null || content === "") return;
    var sel = "meta[" + attr + '="' + name + '"]';
    var m = document.head.querySelector(sel);
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute(attr, name);
      document.head.appendChild(m);
    }
    m.setAttribute("content", content);
  }

  function addMetaTag(attr, name, content) {
    if (content == null || content === "") return;
    var m = document.createElement("meta");
    m.setAttribute(attr, name);
    m.setAttribute("content", content);
    document.head.appendChild(m);
  }

  function setFavicon(href) {
    var l = document.head.querySelector('link[rel="icon"]');
    if (!l) {
      l = document.createElement("link");
      l.setAttribute("rel", "icon");
      document.head.appendChild(l);
    }
    l.setAttribute("href", href);
  }

  function applyHead(cfg) {
    var site = cfg.site || {};
    if (site.title) document.title = site.title;
    if (site.lang) document.documentElement.setAttribute("lang", site.lang);
    setMetaTag("name", "description", site.description);
    setMetaTag("name", "keywords", site.keywords);
    if (site.favicon) setFavicon(site.favicon);
    // Google Scholar / citation meta
    setMetaTag("name", "citation_title", site.title);
    (cfg.authors || []).forEach(function (a) {
      addMetaTag("name", "citation_author", a.name);
    });
    if (site.publicationDate) setMetaTag("name", "citation_publication_date", site.publicationDate);
    if (site.venue) setMetaTag("name", "citation_conference_title", site.venue);
  }

  /* ---------- hero ---------- */
  function buildHero(cfg) {
    var site = cfg.site || {};
    var col = h("div", { "class": "column has-text-centered" });

    // site.titleLines (optional) sets explicit line breaks for the displayed title;
    // site.title stays the single-string title used for the tab and citation meta.
    var titleLines = Array.isArray(site.titleLines) && site.titleLines.length ? site.titleLines : null;
    var h1 = h("h1", { "class": "title is-2 publication-title" + (titleLines ? " has-title-lines" : "") });
    if (titleLines) {
      titleLines.forEach(function (ln, i) {
        if (i) h1.appendChild(document.createTextNode(" "));
        h1.appendChild(h("span", { "class": "title-line", html: ln }));
      });
    } else {
      h1.innerHTML = site.title || "";
    }
    col.appendChild(h1);
    if (site.venue) col.appendChild(h("h2", { "class": "publication-venue-line", html: site.venue }));

    var affs = cfg.affiliations || [];
    var multiAff = affs.length > 1;

    var authors = cfg.authors || [];
    if (authors.length) {
      var aDiv = h("div", { "class": "is-size-5 publication-authors" });
      authors.forEach(function (a, i) {
        var block = h("span", { "class": "author-block" });
        if (a.url) block.appendChild(h("a", { href: a.url, target: "_blank", rel: "noopener" }, a.name));
        else block.appendChild(document.createTextNode(a.name));
        if (multiAff && a.affiliations && a.affiliations.length)
          block.appendChild(h("sup", { html: a.affiliations.join(",") }));
        if (a.note) block.appendChild(h("sup", { html: a.note }));
        aDiv.appendChild(block);
        // Exactly two authors are joined with "and"; three or more use commas.
        if (i < authors.length - 1)
          aDiv.appendChild(document.createTextNode(authors.length === 2 ? " and " : ", "));
      });
      col.appendChild(aDiv);
    }

    if (affs.length) {
      var afDiv = h("div", { "class": "is-size-5 publication-affiliations" });
      affs.forEach(function (af, i) {
        var span = h("span", { "class": "affiliation-block" });
        if (multiAff) span.appendChild(h("sup", { html: String(af.id) + " " }));
        span.appendChild(document.createTextNode(af.name));
        afDiv.appendChild(span);
        if (i < affs.length - 1) afDiv.appendChild(document.createTextNode("   "));
      });
      col.appendChild(afDiv);
    }

    var links = (cfg.links || []).filter(function (l) { return l.enabled !== false && l.url; });
    if (links.length) {
      var lc = h("div", { "class": "publication-links" });
      links.forEach(function (l) {
        var a = h("a", {
          href: l.url,
          "class": "external-link button is-normal is-rounded is-dark",
          target: "_blank",
          rel: "noopener"
        }, [
          h("span", { "class": "icon" }, h("i", { "class": l.icon || "fas fa-link" })),
          h("span", null, l.label || l.type || "Link")
        ]);
        lc.appendChild(h("span", { "class": "link-block" }, a));
      });
      col.appendChild(lc);
    }

    return h("section", { "class": "hero" },
      h("div", { "class": "hero-body" },
        h("div", { "class": "container is-max-desktop" },
          h("div", { "class": "columns is-centered" }, col))));
  }

  /* ---------- generic section wrapper ---------- */
  function sectionWrap(col, opts) {
    opts = opts || {};
    var attrs = { "class": "section" };
    if (opts.tightTop) attrs.style = "padding-top:0";
    if (opts.id) attrs.id = opts.id;
    return h("section", attrs,
      h("div", { "class": "container is-max-desktop" },
        h("div", { "class": "columns is-centered" }, col)));
  }

  /* ---------- block renderers (append into a column) ---------- */
  function appendBody(col, node) {
    switch (node.type) {
      case "text":
        col.appendChild(h("div", { "class": "content " + alignClass(node.align), html: "<p>" + (node.body || "") + "</p>" }));
        break;
      case "list":
        var listTag = node.ordered === false ? "ul" : "ol";
        var list = h(listTag, { "class": "contrib-list " + alignClass(node.align || "left") });
        (node.items || []).forEach(function (it) { list.appendChild(h("li", { html: it })); });
        col.appendChild(list);
        break;
      case "figure":
        col.appendChild(buildFigure(node));
        break;
      case "table":
        col.appendChild(buildTable(node));
        break;
      case "callout":
        var cls = "callout" + (node.variant ? " callout-" + node.variant : "");
        col.appendChild(h("div", { "class": cls, html: node.body || "" }));
        break;
      case "subtitle":
        col.appendChild(h("h3", { "class": "title is-4 has-text-left", html: node.text || node.title || "" }));
        break;
      case "video":
        (Array.isArray(node.videos) ? node.videos : (node.url ? [{ url: node.url, caption: node.caption }] : []))
          .forEach(function (v) {
            if (!v || v.enabled === false || !v.url) return;
            if (v.title) col.appendChild(h("h3", { "class": "title is-4 has-text-centered", html: v.title }));
            col.appendChild(buildVideoEmbed(v.url));
            if (v.caption) col.appendChild(h("p", { "class": "fig-caption has-text-centered", html: v.caption }));
          });
        break;
      case "html":
        col.appendChild(h("div", { "class": "content " + alignClass(node.align), html: node.body || "" }));
        break;
      case "group":
        (node.blocks || []).forEach(function (b) { if (b && b.enabled !== false) appendBody(col, b); });
        break;
      default:
        if (node.body) col.appendChild(h("div", { "class": "content", html: node.body }));
    }
  }

  function buildSection(section, opts) {
    if (section.enabled === false) return null;
    var col = h("div", { "class": "column is-four-fifths" });
    if (section.title && section.type !== "subtitle")
      col.appendChild(h("h2", { "class": "title is-3 has-text-centered", html: section.title }));
    appendBody(col, section);
    return sectionWrap(col, opts);
  }

  /* ---------- video embed (YouTube / Vimeo / mp4) ---------- */
  function toYouTubeEmbed(url) {
    if (!url) return url;
    var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{6,})/);
    return m ? "https://www.youtube.com/embed/" + m[1] : url;
  }

  function buildVideoEmbed(url) {
    var wrap = h("div", { "class": "publication-video" });
    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
      var v = h("video", { controls: "", playsinline: "", preload: "metadata" });
      v.appendChild(h("source", { src: url }));
      wrap.appendChild(v);
    } else {
      wrap.appendChild(h("iframe", {
        src: toYouTubeEmbed(url),
        title: "Embedded video",
        frameborder: "0",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        referrerpolicy: "strict-origin-when-cross-origin",
        allowfullscreen: ""
      }));
    }
    return wrap;
  }

  /* ---------- figure with graceful placeholder ---------- */
  function buildFigure(node) {
    var frag = document.createDocumentFragment();
    var width = node.width || "100%";
    var img = h("img", {
      src: node.image,
      alt: node.alt || "",
      "class": "publication-figure",
      style: "width:" + width + ";display:block;margin:0 auto;"
    });
    // Clicking a figure opens the full-resolution image in a new tab.
    var link = h("a", { href: node.image, target: "_blank", rel: "noopener", "class": "figure-link", title: "Open full-size figure" }, img);
    img.addEventListener("error", function () {
      var ph = h("div", { "class": "figure-placeholder", style: "max-width:" + width },
        [
          h("div", { "class": "figure-placeholder-icon", html: "&#x1F5BC;" }),
          h("div", { "class": "figure-placeholder-title", text: node.alt || "Figure" }),
          h("div", { "class": "figure-placeholder-note", text: "Missing image: " + node.image })
        ]);
      if (link.parentNode) link.parentNode.replaceChild(ph, link);
    });
    frag.appendChild(link);
    if (node.caption) frag.appendChild(h("p", { "class": "fig-caption", html: node.caption }));
    return frag;
  }

  /* ---------- table ---------- */
  var tableCount = 0;
  function buildTable(t) {
    var frag = document.createDocumentFragment();
    var wrap = h("div", { "class": "table-wrap" });
    var table = h("table", { "class": "results-table" });
    // The caption sits outside the horizontal-scroll wrapper so it stays fully visible on narrow screens.
    if (t.caption) {
      var capId = "table-caption-" + (++tableCount);
      frag.appendChild(h("p", { "class": "table-caption", id: capId, html: t.caption }));
      table.setAttribute("aria-describedby", capId);
    }

    var cols = t.columns || [];
    var thead = h("thead");
    var trh = h("tr");
    cols.forEach(function (c) {
      trh.appendChild(h("th", { "class": c.align === "left" ? "t-left" : null, html: c.header || "" }));
    });
    thead.appendChild(trh);
    table.appendChild(thead);

    var tbody = h("tbody");
    (t.rows || []).forEach(function (r) {
      var tr = h("tr", { "class": r["class"] || null });
      (r.cells || []).forEach(function (cell, idx) {
        var val, cellClass = null;
        if (cell && typeof cell === "object") { val = cell.v; cellClass = cell["class"] || null; }
        else { val = (cell == null ? "" : String(cell)); }
        var colAlign = (cols[idx] && cols[idx].align === "left") ? "t-left" : null;
        var klass = [colAlign, cellClass].filter(Boolean).join(" ") || null;
        tr.appendChild(h("td", { "class": klass, html: val }));
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    frag.appendChild(wrap);
    if (t.legend) frag.appendChild(h("p", { "class": "table-legend", html: t.legend }));
    return frag;
  }

  /* ---------- abstract ---------- */
  function buildAbstract(cfg) {
    var ab = cfg.abstract;
    if (!ab || !ab.body) return null;
    var col = h("div", { "class": "column is-four-fifths" });
    col.appendChild(h("h2", { "class": "title is-3 has-text-centered", html: ab.title || "Abstract" }));
    col.appendChild(h("div", { "class": "content has-text-justified", html: "<p>" + ab.body + "</p>" }));
    return sectionWrap(col, {});
  }

  /* ---------- poster ---------- */
  function buildPoster(cfg) {
    var p = cfg.poster || {};
    if (!p.enabled || !p.file) return null;
    var col = h("div", { "class": "column is-four-fifths has-text-centered" });
    col.appendChild(h("hr"));
    col.appendChild(h("h2", { "class": "title is-3", html: p.title || "Poster" }));
    var pdf = h("div", { "class": "publication-pdf" });
    pdf.appendChild(h("iframe", { src: p.file, frameborder: "0", loading: "lazy" }));
    col.appendChild(pdf);
    col.appendChild(h("p", { "class": "fig-caption has-text-centered",
      html: 'If the poster does not display, <a href="' + p.file + '" target="_blank" rel="noopener">open it directly</a>.' }));
    return sectionWrap(col, {});
  }

  /* ---------- slides (scrollable in-page viewer, rendered with PDF.js) ---------- */
  var PDFJS_SRC = "static/js/pdf.min.js";
  var PDFJS_WORKER = "static/js/pdf.worker.min.js";

  function buildSlides(cfg) {
    var s = cfg.slides || {};
    if (!s.enabled || !s.file) return null;
    var title = s.title || "Slides";
    var col = h("div", { "class": "column is-four-fifths has-text-centered" });
    col.appendChild(h("h2", { "class": "title is-3", html: title }));
    col.appendChild(h("div", {
      "class": "slides-viewer", tabindex: "0", role: "region",
      "aria-label": title + " (scroll to browse)", "data-file": s.file
    }, h("div", { "class": "slides-status", text: "Loading slides…" })));
    col.appendChild(h("div", { "class": "slides-bar" }, [
      h("button", { "class": "slides-nav", type: "button", "data-step": "-1", "aria-label": "Previous slide", title: "Previous slide", disabled: "" },
        h("i", { "class": "fas fa-chevron-up" })),
      h("span", { "class": "slides-counter", "aria-live": "polite" }),
      h("button", { "class": "slides-nav", type: "button", "data-step": "1", "aria-label": "Next slide", title: "Next slide", disabled: "" },
        h("i", { "class": "fas fa-chevron-down" })),
      h("a", { "class": "slides-open", href: s.file, target: "_blank", rel: "noopener" },
        [h("i", { "class": "fas fa-external-link-alt" }), " Open PDF"])
    ]));
    return sectionWrap(col, { id: "Slides" });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("Could not load " + src)); };
      document.head.appendChild(s);
    });
  }

  // Renders the PDF one slide per "page" inside a frame exactly one slide tall.
  // Slides are drawn lazily as they approach the frame and released when far away,
  // so memory stays low even for long decks.
  function startSlides(viewer) {
    var file = viewer.getAttribute("data-file");
    var bar = viewer.parentNode.querySelector(".slides-bar");
    var counter = bar.querySelector(".slides-counter");
    var navs = bar.querySelectorAll(".slides-nav");

    function fallback() {
      // No PDF.js (blocked script, very old browser): use the browser's own PDF viewer.
      viewer.innerHTML = "";
      viewer.className += " is-fallback";
      viewer.appendChild(h("iframe", { src: file, title: "Slides", frameborder: "0" }));
      counter.textContent = "";
      for (var i = 0; i < navs.length; i++) navs[i].style.display = "none";
    }

    loadScript(PDFJS_SRC).then(function () {
      var lib = window.pdfjsLib;
      if (!lib) throw new Error("PDF.js unavailable");
      lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      return lib.getDocument(file).promise;
    }).then(function (pdf) {
      return pdf.getPage(1).then(function (first) {
        var base = first.getViewport({ scale: 1 });
        var pages = [];
        viewer.innerHTML = "";
        for (var n = 1; n <= pdf.numPages; n++) {
          var holder = h("div", { "class": "slide-page", "data-index": String(n - 1) });
          viewer.appendChild(holder);
          pages.push({ n: n, el: holder, canvas: null, pending: false, task: null });
        }

        function draw(p) {
          if (p.canvas || p.pending) return;
          p.pending = true;
          pdf.getPage(p.n).then(function (page) {
            if (!p.pending) return null;
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            var vp = page.getViewport({ scale: (p.el.clientWidth * dpr) / page.getViewport({ scale: 1 }).width });
            var canvas = document.createElement("canvas");
            canvas.width = Math.round(vp.width);
            canvas.height = Math.round(vp.height);
            p.task = page.render({ canvasContext: canvas.getContext("2d"), viewport: vp });
            return p.task.promise.then(function () {
              if (!p.pending) return;
              p.el.innerHTML = "";
              p.el.appendChild(canvas);
              p.canvas = canvas; p.pending = false; p.task = null;
            });
          }).catch(function () { p.pending = false; p.task = null; });
        }

        function release(p) {
          if (p.task) { try { p.task.cancel(); } catch (e) { /* already finished */ } p.task = null; }
          p.pending = false;
          if (p.canvas) { p.canvas.width = p.canvas.height = 0; p.el.innerHTML = ""; p.canvas = null; }
        }

        var step = 1;      // height of one slide in px (integer, so slides align exactly)
        var anchor = 0;    // index of the slide the frame is aligned to
        var holding = false, settleTimer = null, lastWidth = 0;
        var smooth = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

        function clamp(i) { return Math.max(0, Math.min(pages.length - 1, i)); }
        function current() { return clamp(Math.round(viewer.scrollTop / step)); }

        function sync() {
          var i = current();
          counter.textContent = (i + 1) + " / " + pages.length;
          navs[0].disabled = i === 0;
          navs[1].disabled = i === pages.length - 1;
        }

        function goTo(i, behavior) {
          anchor = clamp(i);
          viewer.scrollTo({ top: anchor * step, behavior: behavior || smooth });
        }

        // The frame is exactly one slide tall, whatever the scrollbar width.
        function layout() {
          var w = viewer.clientWidth;
          step = Math.max(1, Math.round(w * base.height / base.width));
          pages.forEach(function (p) { p.el.style.height = step + "px"; });
          viewer.style.aspectRatio = "auto";
          viewer.style.height = step + "px";
          viewer.scrollTop = anchor * step;
          if (lastWidth && Math.abs(w - lastWidth) / lastWidth > 0.15) {
            pages.forEach(function (p) { if (p.canvas || p.pending) { release(p); draw(p); } });
          }
          lastWidth = w;
          sync();
        }

        // When scrolling stops, glide to a whole slide: the next one in the direction of travel,
        // so a single wheel notch, key press or short swipe advances exactly one slide.
        function settle() {
          if (holding) return;
          var pos = viewer.scrollTop, delta = pos - anchor * step, i = anchor;
          if (Math.abs(delta) >= 0.06 * step) i = delta > 0 ? Math.ceil(pos / step - 0.02) : Math.floor(pos / step + 0.02);
          anchor = clamp(i);
          if (Math.abs(pos - anchor * step) > 1) viewer.scrollTo({ top: anchor * step, behavior: smooth });
        }
        function scheduleSettle() { clearTimeout(settleTimer); settleTimer = setTimeout(settle, 140); }

        if ("IntersectionObserver" in window) {
          var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
              var p = pages[+e.target.getAttribute("data-index")];
              if (e.isIntersecting) draw(p); else release(p);
            });
          }, { root: viewer, rootMargin: "300% 0px" });
          pages.forEach(function (p) { io.observe(p.el); });
        } else {
          pages.forEach(draw);
        }

        viewer.addEventListener("scroll", function () { sync(); scheduleSettle(); }, { passive: true });
        // Do not realign while a finger or the scrollbar thumb is still held.
        function hold() { holding = true; }
        function unhold() { if (holding) { holding = false; scheduleSettle(); } }
        viewer.addEventListener("touchstart", hold, { passive: true });
        viewer.addEventListener("mousedown", hold);
        ["touchend", "touchcancel", "mouseup"].forEach(function (ev) { window.addEventListener(ev, unhold, { passive: true }); });

        for (var k = 0; k < navs.length; k++) {
          navs[k].addEventListener("click", function () { goTo(anchor + (+this.getAttribute("data-step"))); });
        }
        var timer = null;
        window.addEventListener("resize", function () { clearTimeout(timer); timer = setTimeout(layout, 150); });
        layout();
      });
    }).catch(fallback);
  }

  function initSlides() {
    var viewer = document.querySelector(".slides-viewer");
    if (!viewer) return;
    // Load PDF.js and the deck only when the viewer is about to scroll into view.
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); startSlides(viewer); }
      }, { rootMargin: "800px 0px" });
      io.observe(viewer);
    } else {
      startSlides(viewer);
    }
  }

  /* ---------- hero title: keep each configured line on one row ---------- */
  function fitTitle() {
    var h1 = document.querySelector(".publication-title.has-title-lines");
    if (!h1) return;
    var lines = h1.querySelectorAll(".title-line");
    h1.classList.remove("is-wrapping");
    h1.style.fontSize = "";
    var size = parseFloat(window.getComputedStyle(h1).fontSize);
    var min = 22; // px; below this the lines are allowed to wrap (narrow screens)
    var range = document.createRange();
    function tooWide() {
      for (var i = 0; i < lines.length; i++) {
        range.selectNodeContents(lines[i]);
        if (range.getBoundingClientRect().width > h1.clientWidth + 0.5) return true;
      }
      return false;
    }
    while (size > min && tooWide()) { size -= 1; h1.style.fontSize = size + "px"; }
    if (tooWide()) { h1.style.fontSize = ""; h1.classList.add("is-wrapping"); }
  }

  /* ---------- bibtex ---------- */
  var COPY_SVG =
    '<svg height="100%" viewBox="0 0 36 36" width="100%">' +
    '<path d="M21.9,8.3H11.3c-0.9,0-1.7,.8-1.7,1.7v12.3h1.7V10h10.6V8.3z M24.6,11.8h-9.7c-1,0-1.8,.8-1.8,1.8v12.3' +
    'c0,1,.8,1.8,1.8,1.8h9.7c1,0,1.8-0.8,1.8-1.8V13.5C26.3,12.6,25.5,11.8,24.6,11.8z M24.6,25.9h-9.7V13.5h9.7V25.9z"></path>' +
    '</svg>';

  function showToast(msg) {
    var t = h("div", { "class": "copy-toast", text: msg });
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 1500);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { showToast("BibTeX copied to clipboard!"); })
        .catch(function () { showToast("Copy failed. Select the text manually."); });
    } else {
      showToast("Copy not supported. Select the text manually.");
    }
  }

  function buildBibtex(cfg) {
    var b = cfg.bibtex;
    if (!b || !b.entry || b.enabled === false) return null;
    var col = h("div", { "class": "column is-four-fifths", style: "position:relative" });
    col.appendChild(h("h2", { "class": "title is-3", html: b.title || "BibTeX" }));
    var content = h("div", { "class": "content has-text-justified", style: "position:relative" });
    var pre = h("pre");
    var code = h("code", { id: "bibtexContent" });
    code.textContent = b.entry;
    pre.appendChild(code);
    content.appendChild(pre);
    var copy = h("div", { "class": "copy-icon", title: "Copy to clipboard", html: COPY_SVG });
    copy.addEventListener("click", function () { copyText(b.entry); });
    content.appendChild(copy);
    col.appendChild(content);
    return h("section", { "class": "section", id: "BibTeX" },
      h("div", { "class": "container is-max-desktop" },
        h("div", { "class": "columns is-centered has-text-centered" }, col)));
  }

  /* ---------- footer ---------- */
  function buildFooter(cfg) {
    var f = cfg.footer || {};
    var content = h("div", { "class": "content has-text-centered" });
    var any = false;
    if (f.showLinks) {
      var links = (cfg.links || []).filter(function (l) { return l.enabled !== false && l.url; });
      if (links.length) {
        var p = h("p", { "class": "footer-icons" });
        links.forEach(function (l) {
          p.appendChild(h("a", { href: l.url, "class": "icon-link", target: "_blank", rel: "noopener", title: l.label || l.type },
            h("i", { "class": l.icon || "fas fa-link" })));
        });
        content.appendChild(p);
        any = true;
      }
    }
    if (f.text) { content.appendChild(h("p", { "class": "footer-note", html: f.text })); any = true; }
    if (!any) return null;
    return h("footer", { "class": "footer" },
      h("div", { "class": "container" },
        h("div", { "class": "columns is-centered" },
          h("div", { "class": "column is-8" }, content))));
  }

  /* ---------- orchestration ---------- */
  function render(cfg) {
    applyHead(cfg);
    var frag = document.createDocumentFragment();
    frag.appendChild(buildHero(cfg));
    var abs = buildAbstract(cfg);
    if (abs) frag.appendChild(abs);
    (cfg.sections || []).forEach(function (s) {
      var sec = buildSection(s, {});
      if (sec) frag.appendChild(sec);
    });
    var poster = buildPoster(cfg);
    if (poster) frag.appendChild(poster);
    var slides = buildSlides(cfg);
    if (slides) frag.appendChild(slides);
    var bib = buildBibtex(cfg);
    if (bib) frag.appendChild(bib);
    var foot = buildFooter(cfg);
    if (foot) frag.appendChild(foot);
    app.innerHTML = "";
    app.appendChild(frag);

    initSlides();
    fitTitle();
    var fitTimer = null;
    window.addEventListener("resize", function () { clearTimeout(fitTimer); fitTimer = setTimeout(fitTitle, 100); });
    window.addEventListener("load", fitTitle);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);
  }

  function showError(err) {
    var isFile = location.protocol === "file:";
    var box = h("section", { "class": "section" },
      h("div", { "class": "container is-max-desktop" },
        h("div", { "class": "notification config-error" }, [
          h("h2", { "class": "title is-4", text: "Could not load config.json" }),
          isFile
            ? h("div", null, [
                h("p", { html: "The page was opened directly from the file system, so the browser blocked loading <code>config.json</code> (CORS on the <code>file://</code> protocol)." }),
                h("p", { html: "Start a tiny local server from the project folder, then reload:" }),
                h("pre", { text: "python -m http.server 8000" }),
                h("p", { html: "and open <a href=\"http://localhost:8000\">http://localhost:8000</a>. Deploying to GitHub Pages works without this step." })
              ])
            : h("p", { text: "Details: " + (err && err.message ? err.message : String(err)) })
        ])));
    app.innerHTML = "";
    app.appendChild(box);
  }

  function init() {
    if (!app) return;
    fetch(CONFIG_PATH, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status + " for " + CONFIG_PATH); return r.json(); })
      .then(render)
      .catch(showError);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
