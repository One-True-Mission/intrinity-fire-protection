/* Intrinity Fire Protection LLC. OTM Web Design. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Active nav ---------- */
  var page = document.body.getAttribute('data-page');
  document.querySelectorAll('.nav-links a[data-nav]').forEach(function (a) {
    if (a.getAttribute('data-nav').split(' ').indexOf(page) !== -1) {
      a.classList.add('is-active');
      a.setAttribute('aria-current', 'page');
    }
  });

  /* ---------- Mobile drawer ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  function closeNav() {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    links.classList.remove('is-open');
  }
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      links.classList.toggle('is-open', !open);
    });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 900) closeNav(); }, { passive: true });
  }

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Carousels (gallery coverflow + reviews) ---------- */
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var type = root.getAttribute('data-carousel');
    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-slide]'));
    var dotsWrap = root.querySelector('.carousel-dots');
    var track = root.querySelector('.reviews-track');
    var delay = parseInt(root.getAttribute('data-interval'), 10) || 5000;
    var count = slides.length;
    var index = 0;
    var timer = null;
    if (!count) return;

    // Dots are built from the slide count so they can never drift out of sync.
    var dots = slides.map(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'carousel-dot';
      b.setAttribute('aria-label', 'Show slide ' + (i + 1) + ' of ' + count);
      b.addEventListener('click', function () { go(i); restart(); });
      dotsWrap.appendChild(b);
      return b;
    });

    function render() {
      if (type === 'gallery') {
        slides.forEach(function (s, i) {
          s.classList.remove('is-active', 'is-prev', 'is-next');
          var prev = (index - 1 + count) % count;
          var next = (index + 1) % count;
          if (i === index) s.classList.add('is-active');
          else if (i === prev) s.classList.add('is-prev');
          else if (i === next) s.classList.add('is-next');
          s.setAttribute('aria-hidden', i === index ? 'false' : 'true');
        });
      } else if (track) {
        track.style.transform = 'translateX(' + (-100 * index) + '%)';
        slides.forEach(function (s, i) { s.setAttribute('aria-hidden', i === index ? 'false' : 'true'); });
      }
      dots.forEach(function (d, i) { d.setAttribute('aria-current', i === index ? 'true' : 'false'); });
    }
    function go(i) { index = (i + count) % count; render(); }
    function start() { if (reduceMotion || timer) return; timer = setInterval(function () { go(index + 1); }, delay); }
    function stop() { clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }

    var prevBtn = root.querySelector('[data-prev]');
    var nextBtn = root.querySelector('[data-next]');
    if (prevBtn) prevBtn.addEventListener('click', function () { go(index - 1); restart(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { go(index + 1); restart(); });

    // Clicking a side image in the gallery brings it to center.
    if (type === 'gallery') {
      slides.forEach(function (s, i) {
        s.addEventListener('click', function () { if (i !== index) { go(i); restart(); } });
      });
    }

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) start(); });

    render();
    start();
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', String(!open));
      if (panel) panel.classList.toggle('open', !open);
    });
  });

  /* ---------- Forms ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
  var MAX_FILE = 25 * 1024 * 1024;
  var FILE_EXT = /\.(pdf|doc|docx)$/i;

  function formatPhone(value) {
    var d = value.replace(/\D/g, '').slice(0, 10);
    if (d.length > 6) return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
    if (d.length > 3) return '(' + d.slice(0, 3) + ') ' + d.slice(3);
    if (d.length > 0) return '(' + d;
    return '';
  }

  function fieldWrap(el) { return el.closest('.field'); }
  function setError(el, msg) {
    var wrap = fieldWrap(el);
    if (!wrap) return;
    wrap.classList.add('has-error');
    var err = wrap.querySelector('.field-error');
    if (err) err.textContent = msg;
  }
  function clearError(el) {
    var wrap = fieldWrap(el);
    if (!wrap) return;
    wrap.classList.remove('has-error');
    var err = wrap.querySelector('.field-error');
    if (err) err.textContent = '';
  }

  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    var banner = form.querySelector('.form-banner');
    var submit = form.querySelector('[type="submit"]');
    var submitLabel = submit ? submit.innerHTML : '';

    // Phone auto-format
    form.querySelectorAll('input[type="tel"]').forEach(function (input) {
      input.addEventListener('input', function () { input.value = formatPhone(input.value); });
    });

    // Clear a field's error the moment it changes
    form.addEventListener('input', function (e) { if (e.target.name) clearError(e.target); });
    form.addEventListener('change', function (e) { if (e.target.name) clearError(e.target); });

    // Resume attach button
    var fileInput = form.querySelector('.file-input');
    if (fileInput) {
      var nameOut = form.querySelector('.file-name');
      var clearBtn = form.querySelector('.file-clear');
      var emptyText = nameOut.textContent;
      var showFile = function () {
        var f = fileInput.files && fileInput.files[0];
        nameOut.textContent = f ? f.name : emptyText;
        nameOut.classList.toggle('has-file', !!f);
        clearBtn.hidden = !f;
      };
      fileInput.addEventListener('change', showFile);
      clearBtn.addEventListener('click', function () { fileInput.value = ''; showFile(); clearError(fileInput); fileInput.focus(); });
    }

    // Emergency request callout on the contact form
    var requestType = form.querySelector('[name="request_type"]');
    var callout = form.querySelector('.emergency-callout');
    if (requestType && callout) {
      requestType.addEventListener('change', function () {
        callout.classList.toggle('is-visible', requestType.value === 'Emergency');
      });
    }

    function validate() {
      var firstBad = null;
      function bad(el, msg) { setError(el, msg); if (!firstBad) firstBad = el; }

      form.querySelectorAll('[data-rule]').forEach(function (el) {
        var rule = el.getAttribute('data-rule');
        var v = (el.value || '').trim();
        if (rule === 'name') {
          if (v.length < 2) bad(el, 'Please enter at least 2 characters.');
        } else if (rule === 'phone') {
          if (v.replace(/\D/g, '').length !== 10) bad(el, 'Please enter a 10 digit phone number.');
        } else if (rule === 'email') {
          if (!EMAIL_RE.test(v)) bad(el, 'Please enter a valid email address.');
        } else if (rule === 'select') {
          if (!v) bad(el, 'Please choose an option.');
        } else if (rule === 'text') {
          if (v.length < 2) bad(el, 'Please fill this in.');
        } else if (rule === 'radio') {
          var group = form.querySelectorAll('input[name="' + el.getAttribute('data-group') + '"]');
          var picked = Array.prototype.some.call(group, function (r) { return r.checked; });
          if (!picked) bad(group[0], 'Please choose one.');
        } else if (rule === 'file') {
          var f = el.files && el.files[0];
          if (f && !FILE_EXT.test(f.name)) bad(el, 'Please attach a PDF or Word document.');
          else if (f && f.size > MAX_FILE) bad(el, 'That file is over 25 MB. Please attach a smaller file or email it instead.');
        }
      });

      if (firstBad) {
        firstBad.focus({ preventScroll: true });
        firstBad.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        return false;
      }
      return true;
    }

    function showBanner(kind, html) {
      if (!banner) return;
      banner.className = 'form-banner is-visible ' + (kind === 'info' ? 'is-info' : 'is-error');
      banner.innerHTML = html;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (banner) banner.className = 'form-banner';
      if (!validate()) return;

      // Demo guard: the client's Formspree form does not exist yet.
      if (form.action.indexOf('FORM_ID_PENDING') !== -1) {
        showBanner('info', 'Demo preview: this form is not connected yet, so nothing was sent. Validation passed, and once the Formspree form is set up this will deliver straight to Intrinity’s inbox.');
        return;
      }

      if (submit) { submit.disabled = true; submit.textContent = 'Sending...'; }
      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (!res.ok) throw new Error('bad-response');
        window.location.href = new URL('thank-you.html', window.location.href).href;
      }).catch(function () {
        if (submit) { submit.disabled = false; submit.innerHTML = submitLabel; }
        showBanner('error', 'Something went wrong and your message did not send. Please try again, or call us at <a href="tel:+12546134231">(254) 613-4231</a>.');
      });
    });
  });
})();
