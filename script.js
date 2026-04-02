/* ============================================================
   SYSTEMIZE — Blueprint Interface & Page Logic
   ============================================================ */

(function () {
  'use strict';

  // ─── CONFIG ────────────────────────────────────────────────
  const API_ENDPOINT = '/api/send-telegram';

  // ─── DOM REFS ──────────────────────────────────────────────
  const header = document.getElementById('site-header');
  const whatsappFab = document.getElementById('whatsapp-fab');

  // ─── HEADER SCROLL ────────────────────────────────────────
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 80);
    // Show FAB after scrolling past hero
    if (whatsappFab) {
      whatsappFab.style.animationPlayState = y > 300 ? 'running' : 'paused';
    }
  }, { passive: true });

  // ─── SCROLL-ANIMATE ───────────────────────────────────────
  const animateElements = document.querySelectorAll('[data-animate]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  animateElements.forEach((el) => observer.observe(el));

  // ─── SMOOTH SCROLL ANCHORS ────────────────────────────────
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach((a) => {
    a.addEventListener('click', (e) => {
      const targetId = a.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        // If it's the logo pointing to #hero, scroll to top
        if (a.classList.contains('logo')) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          // Normal smooth scroll to section
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // ─── WHATSAPP FAB RATE-LIMIT ──────────────────────────────
  const waFab = document.getElementById('whatsapp-fab');
  if (waFab) {
    let lastWaClick = 0;
    waFab.addEventListener('click', (e) => {
      const now = Date.now();
      if (now - lastWaClick < 30000) { // 30 sec cooldown
        e.preventDefault();
        waFab.style.opacity = '0.5';
        waFab.querySelector('.fab-tooltip').textContent = 'נסו שוב בעוד רגע';
        setTimeout(() => {
          waFab.style.opacity = '1';
          waFab.querySelector('.fab-tooltip').textContent = 'דברו איתי';
        }, 3000);
        return;
      }
      lastWaClick = now;
    });
  }

  // ─── SaaS vs Excel CARD SWAP (mobile) ─────────────────────
  const saasBtn = document.getElementById('saas-toggle-btn');
  const saasCol = document.getElementById('saas-column');
  const excelCol = document.querySelector('.vs-excel');
  let showingSaas = false;

  if (saasBtn && saasCol && excelCol) {
    // Start with SaaS hidden on mobile
    saasCol.classList.add('hidden-mobile');
    saasBtn.addEventListener('click', () => {
      showingSaas = !showingSaas;
      if (showingSaas) {
        // Hide Excel, show SaaS
        excelCol.classList.add('hidden-mobile');
        saasCol.classList.remove('hidden-mobile');
        saasBtn.innerHTML = '← הצג את פתרונות Systemize';
      } else {
        // Show Excel, hide SaaS
        saasCol.classList.add('hidden-mobile');
        excelCol.classList.remove('hidden-mobile');
        saasBtn.innerHTML = 'מתי כן כדאי לבחור ב-SaaS ענן? →';
      }
    });
  }

  // ─── BLUEPRINT FORM LOGIC ───────────────────────────────
  const blueprintContainer = document.getElementById('blueprint-container');
  const blueprintFlow = document.getElementById('blueprint-flow');
  const blueprintSuccess = document.getElementById('blueprint-success');
  const executeBtn = document.getElementById('execute-btn');
  const executeText = document.getElementById('execute-text');
  const nodeInputs = document.querySelectorAll('.node-input');

  // Record page load time for anti-spam timing check
  const formLoadTime = Date.now();

  // ─── Node Focus & Validation ──────────────────────────────
  nodeInputs.forEach(input => {
    const node = input.closest('.blueprint-node');

    input.addEventListener('focus', () => {
      // Remove active from all nodes
      document.querySelectorAll('.blueprint-node.node-active').forEach(n => n.classList.remove('node-active'));
      if (node) node.classList.add('node-active');
    });

    input.addEventListener('blur', () => {
      if (node) {
        node.classList.remove('node-active');
        validateNode(input, node);
      }
    });

    // Connector pulse on input
    input.addEventListener('input', () => {
      triggerConnectorPulse(node);
    });

    input.addEventListener('change', () => {
      if (node) validateNode(input, node);
    });
  });

  function validateNode(input, node) {
    const val = input.value.trim();
    node.classList.remove('node-valid', 'node-error');

    if (val === '') return;

    let isError = false;
    if (input.type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) isError = true;
    } else if (input.type === 'tel') {
      const phone = val.replace(/[-\s]/g, '');
      if (!/^0[0-9]{8,9}$/.test(phone) && !/^\+?972[0-9]{8,9}$/.test(phone)) isError = true;
    }

    node.classList.add(isError ? 'node-error' : 'node-valid');
  }

  // ─── Connector Pulse Logic ────────────────────────────────
  function triggerConnectorPulse(node) {
    if (!node) return;
    const row = node.closest('.blueprint-row');
    if (!row) return;

    // Pulse horizontal connector in the same row
    const hTrack = row.querySelector('.connector-track');
    if (hTrack && !hTrack.classList.contains('pulsing')) {
      hTrack.classList.add('pulsing');
      setTimeout(() => hTrack.classList.remove('pulsing'), 800);
    }

    // Pulse vertical connector after this row
    const nextEl = row.nextElementSibling;
    if (nextEl && nextEl.classList.contains('node-connector-v')) {
      const vTrack = nextEl.querySelector('.connector-track-v');
      if (vTrack && !vTrack.classList.contains('pulsing')) {
        vTrack.classList.add('pulsing');
        setTimeout(() => vTrack.classList.remove('pulsing'), 700);
      }
    }
  }

  // ─── Helpers ──────────────────────────────────────────────
  async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // ─── Submit Flow ──────────────────────────────────────────
  if (executeBtn) {
    executeBtn.addEventListener('click', async () => {
      // ── Anti-spam checks ──
      const honeypot = document.getElementById('hp-field');
      if (honeypot && honeypot.value !== '') {
        executeBtn.disabled = true;
        if (executeText) executeText.textContent = 'DONE';
        return;
      }
      if (Date.now() - formLoadTime < 3000) {
        executeBtn.disabled = true;
        if (executeText) executeText.textContent = 'DONE';
        return;
      }

      // ── Gather values ──
      const nameVal = document.getElementById('ex-name')?.value || '';
      const emailVal = document.getElementById('ex-email')?.value || '';
      const phoneVal = document.getElementById('ex-phone')?.value || '';
      const painVal = document.getElementById('ex-pain')?.value || '';
      const sourceVal = document.getElementById('ex-source')?.value || '';

      // ── Validate all fields filled ──
      if (!nameVal || !emailVal || !phoneVal || !painVal || !sourceVal) {
        nodeInputs.forEach(input => {
          const n = input.closest('.blueprint-node');
          if (n && !input.value.trim()) {
            n.classList.add('node-error');
            setTimeout(() => n.classList.remove('node-error'), 2000);
          }
        });
        return;
      }

      // ── Check for validation errors ──
      const hasError = document.querySelector('.blueprint-node.node-error');
      if (hasError) return;

      // ── Payload (same as before) ──
      const payload = {
        name: nameVal,
        email: emailVal,
        phone: phoneVal,
        pain_point: painVal,
        source: sourceVal,
        origin: 'systemize.co.il (Blueprint)',
        timestamp: new Date().toISOString()
      };

      // ── STEP 1: Compiling animation ──
      executeBtn.disabled = true;
      executeText.textContent = 'COMPILING...';

      // Lock nodes sequentially
      const allNodes = document.querySelectorAll('.blueprint-node');
      for (let i = 0; i < allNodes.length; i++) {
        allNodes[i].classList.add('node-locked');
        await sleep(120);
      }

      // Pulse ALL connectors simultaneously
      document.querySelectorAll('.connector-track, .connector-track-v').forEach(t => {
        t.classList.add('pulsing');
      });

      await sleep(400);
      executeText.textContent = 'TRANSMITTING...';

      // ── STEP 2: Send to API ──
      let sendSuccess = false;
      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));
        if (response.ok && result.ok) sendSuccess = true;
        else console.error('[Systemize] API error:', result);
      } catch (err) {
        console.error('[Systemize] Network error:', err);
      }

      // Clear connector pulses
      document.querySelectorAll('.connector-track, .connector-track-v').forEach(t => {
        t.classList.remove('pulsing');
      });

      // ── STEP 3: Handle result ──
      if (!sendSuccess) {
        executeText.textContent = 'ERROR // RETRY';
        executeBtn.disabled = false;
        allNodes.forEach(n => n.classList.remove('node-locked'));
        return;
      }

      // ── STEP 4: Success — "System Initialized" terminal animation ──
      executeText.textContent = 'SUCCESS';
      await sleep(400);

      if (blueprintSuccess) {
        blueprintSuccess.classList.add('active');
        const terminal = document.getElementById('success-terminal');
        const lines = [
          { text: '> Initializing Systemize engine...', cls: '' },
          { text: '> Validating input parameters... OK', cls: 'line-ok' },
          { text: '> Compiling automation blueprint...', cls: '' },
          { text: '> User: ' + nameVal, cls: 'line-data' },
          { text: '> Contact: ' + emailVal, cls: 'line-data' },
          { text: '> Establishing secure channel...', cls: '' },
          { text: '> Transmitting data payload... OK', cls: 'line-ok' },
          { text: '> Lead registered successfully', cls: 'line-ok' },
          { text: '> Notification dispatched', cls: 'line-ok' },
          { text: '', cls: '' },
          { text: '> SYSTEM_STATUS: ONLINE', cls: 'line-ok' },
        ];

        if (terminal) {
          for (let i = 0; i < lines.length; i++) {
            const div = document.createElement('div');
            div.className = 'term-line' + (lines[i].cls ? ' ' + lines[i].cls : '');
            div.textContent = lines[i].text;
            div.style.animationDelay = (i * 0.12) + 's';
            terminal.appendChild(div);
            await sleep(130);
          }
        }

        await sleep(600);
        const successMsg = document.getElementById('success-msg');
        if (successMsg) successMsg.style.display = 'block';
      }
    });
  }

  // ─── Reset Blueprint Form ─────────────────────────────────
  const resetBlueprintBtn = document.getElementById('reset-blueprint-btn');
  if (resetBlueprintBtn) {
    resetBlueprintBtn.addEventListener('click', () => {
      // Clear all inputs
      nodeInputs.forEach(input => {
        if (input.tagName === 'SELECT') {
          input.selectedIndex = 0;
        } else {
          input.value = '';
        }
        const n = input.closest('.blueprint-node');
        if (n) n.classList.remove('node-valid', 'node-error', 'node-locked', 'node-active');
      });

      // Hide success overlay
      if (blueprintSuccess) {
        blueprintSuccess.classList.remove('active');
        const terminal = document.getElementById('success-terminal');
        if (terminal) terminal.innerHTML = '';
        const successMsg = document.getElementById('success-msg');
        if (successMsg) successMsg.style.display = 'none';
      }

      // Re-enable execute button
      if (executeBtn) {
        executeBtn.disabled = false;
        if (executeText) executeText.textContent = 'RUN_MACRO()';
      }
    });
  }


  // ─── FAQ ACCORDION ─────────────────────────────────────────
  document.querySelectorAll('.faq-question').forEach((question) => {
    question.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent native instant open/close
      const item = question.closest('.faq-item');
      const isClosing = item.classList.contains('active');
      
      // Close all other items cleanly
      document.querySelectorAll('.faq-item').forEach((other) => {
        if (other !== item && other.classList.contains('active')) {
          other.classList.remove('active');
          setTimeout(() => other.removeAttribute('open'), 400); // 400ms CSS var(--ease-spring)
        }
      });
      
      // Toggle current item
      if (isClosing) {
        item.classList.remove('active');
        setTimeout(() => item.removeAttribute('open'), 400);
      } else {
        item.setAttribute('open', '');
        // Force reflow and add active to trigger CSS animation
        requestAnimationFrame(() => requestAnimationFrame(() => {
          item.classList.add('active');
        }));
      }
    });
  });

  // ─── LEGAL MODALS ──────────────────────────────────────────
  const modalLinks = document.querySelectorAll('.legal-link');
  const modals = document.querySelectorAll('.legal-modal');
  const modalOverlay = document.getElementById('modal-overlay');
  const closeBtns = document.querySelectorAll('.modal-close');

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modalOverlay.classList.add('active');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeAllModals() {
    modalOverlay.classList.remove('active');
    modals.forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  }

  modalLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-modal');
      openModal(targetId);
    });
  });

  closeBtns.forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeAllModals);
  }

  // ─── CUSTOM ACCESSIBILITY PANEL ──────────────────────────
  const a11yBtn = document.getElementById('customA11yBtn');
  const a11yPanel = document.getElementById('customA11yPanel');
  const closeA11yBtn = document.getElementById('closeA11yBtn');

  // Accessibility action → body class mapping
  const a11yMap = {
    'contrast':        'a11y-high-contrast',
    'text-size':       'a11y-large-text',
    'font':            'a11y-readable-font',
    'animations':      'a11y-no-animations',
    'highlight-links': 'a11y-highlight-links',
    'big-cursor':      'a11y-big-cursor'
  };

  // Load persisted state from localStorage
  const savedA11y = JSON.parse(localStorage.getItem('systemize_a11y') || '{}');
  Object.entries(savedA11y).forEach(([action, active]) => {
    if (active && a11yMap[action]) {
      document.body.classList.add(a11yMap[action]);
    }
  });

  // Sync toggle button active states on load
  function syncToggleStates() {
    document.querySelectorAll('.a11y-toggle[data-action]').forEach(btn => {
      const action = btn.dataset.action;
      if (action === 'reset') return;
      const current = JSON.parse(localStorage.getItem('systemize_a11y') || '{}');
      btn.classList.toggle('active', !!current[action]);
    });
  }
  syncToggleStates();

  // Open / Close panel
  if (a11yBtn && a11yPanel) {
    a11yBtn.addEventListener('click', () => {
      a11yPanel.classList.toggle('hidden');
    });
  }
  if (closeA11yBtn && a11yPanel) {
    closeA11yBtn.addEventListener('click', () => {
      a11yPanel.classList.add('hidden');
    });
  }

  // Close panel when clicking outside
  document.addEventListener('click', (e) => {
    if (a11yPanel && !a11yPanel.classList.contains('hidden')) {
      if (!a11yPanel.contains(e.target) && e.target !== a11yBtn && !a11yBtn.contains(e.target)) {
        a11yPanel.classList.add('hidden');
      }
    }
  });

  // Accessibility Statement link — opens the legal modal
  const a11yStatementLink = document.querySelector('.a11y-statement-link[data-modal]');
  if (a11yStatementLink) {
    a11yStatementLink.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = a11yStatementLink.getAttribute('data-modal');
      if (typeof openModal === 'function') {
        openModal(targetId);
      } else {
        // Fallback: directly manipulate modal
        const modal = document.getElementById(targetId);
        const overlay = document.getElementById('modal-overlay');
        if (modal) modal.classList.add('active');
        if (overlay) overlay.classList.add('active');
      }
      a11yPanel.classList.add('hidden');
    });
  }

  // Toggle actions
  document.querySelectorAll('.a11y-toggle[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;

      // Reset handler
      if (action === 'reset') {
        Object.values(a11yMap).forEach(cls => document.body.classList.remove(cls));
        localStorage.removeItem('systemize_a11y');
        syncToggleStates();
        return;
      }

      // Toggle individual setting
      const bodyClass = a11yMap[action];
      if (!bodyClass) return;

      const isActive = document.body.classList.toggle(bodyClass);
      btn.classList.toggle('active', isActive);

      // Persist
      const current = JSON.parse(localStorage.getItem('systemize_a11y') || '{}');
      current[action] = isActive;
      localStorage.setItem('systemize_a11y', JSON.stringify(current));
    });
  });

})();
