/* ============================================================
   SYSTEMIZE — Interactive Terminal & Page Logic
   ============================================================ */

(function () {
  'use strict';

  // ─── CONFIG ────────────────────────────────────────────────
  const WEBHOOK_URL = ''; // TODO: Replace with Make.com webhook URL
  const TYPING_SPEED = 28;       // ms per character (system text)
  const BOOT_LINE_DELAY = 250;   // ms between boot lines
  const POST_BOOT_DELAY = 600;   // ms after boot before dialog

  // ─── ASCII ART ─────────────────────────────────────────────
  const ASCII_ART = [
    ' ____  _  _  ____  ____  ____  __  __  __  ____  ____ ',
    '( ___)( \\/ )( ___)(_  _)(  __)(  \\/  )(_  )(_   )( ___)',
    ' )__)  )  (  )__)   )(   ) _)  )    (  / (_  / /  )__) ',
    '(____)(_/\\_)(____)  (__) (____)(__)(__)(____)(__)  (____)',
  ];

  const BOOT_LINES = [
    { text: '', type: 'spacer' },
    { text: 'Systemize v1.0.0 | Excel & Business Automation', type: 'system-boot' },
    { text: 'Initializing diagnostic engine...  ✓', type: 'system-boot' },
    { text: 'Ready to analyze your workflow.', type: 'system-boot' },
    { text: '─────────────────────────────────────────────', type: 'separator' },
  ];

  // ─── DIALOG FLOW ──────────────────────────────────────────
  const STEPS = [
    {
      id: 'welcome',
      system: 'ברוך הבא. אני כאן כדי לאבחן איפה העסק שלך מבזבז זמן - ולהפוך את זה לאוטומציה.\nהקלד start כדי להתחיל.',
      waitForInput: true,
      validate: (v) => {
        if (v.trim().toLowerCase() !== 'start') return 'Error: הקלד start כדי להתחיל.';
        return null;
      },
      field: null,
    },
    {
      id: 'name',
      system: 'מה השם שלך?',
      waitForInput: true,
      validate: (v) => {
        if (!v.trim()) return 'Error: שדה חובה, אני צריך את זה כדי ליצור קשר. נסה שוב.';
        return null;
      },
      field: 'name',
    },
    {
      id: 'phone',
      system: null, // dynamic, uses name
      waitForInput: true,
      validate: (v) => {
        const phone = v.trim().replace(/[-\s]/g, '');
        if (!phone) return 'Error: שדה חובה, אני צריך את זה כדי ליצור קשר. נסה שוב.';
        if (!/^0[0-9]{8,9}$/.test(phone) && !/^\+?972[0-9]{8,9}$/.test(phone))
          return 'Error: פורמט לא תקין. דוגמה: 050-1234567';
        return null;
      },
      field: 'phone',
    },
    {
      id: 'email',
      system: 'כתובת אימייל:',
      waitForInput: true,
      validate: (v) => {
        if (!v.trim()) return 'Error: שדה חובה, אני צריך את זה כדי ליצור קשר. נסה שוב.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()))
          return 'Error: כתובת לא תקינה. דוגמה: name@gmail.com';
        return null;
      },
      field: 'email',
    },
    {
      id: 'pain',
      system: 'ועכשיו השאלה החשובה, תאר בקצרה פעולה ידנית שחוזרת על עצמה ושורפת לך זמן.\n(למשל: "אני מעתיק נתונים ממיילים לטבלה כל בוקר")',
      waitForInput: true,
      validate: (v) => {
        if (!v.trim()) return 'Error: שדה חובה, אני צריך את זה כדי ליצור קשר. נסה שוב.';
        return null;
      },
      field: 'pain_point',
    },
  ];

  // ─── STATE ─────────────────────────────────────────────────
  const formData = {};
  let currentStep = 0;
  let isTyping = false;
  let terminalDone = false;

  // ─── DOM REFS ──────────────────────────────────────────────
  const header = document.getElementById('site-header');
  const terminalBody = document.getElementById('terminal-body');
  const terminalOutput = document.getElementById('terminal-output');
  const terminalInputLine = document.getElementById('terminal-input-line');
  const terminalInput = document.getElementById('terminal-input');
  const terminalWrapper = document.getElementById('terminal-wrapper');
  const restartContainer = document.getElementById('terminal-restart');
  const restartBtn = document.getElementById('restart-btn');
  const whatsappFab = document.getElementById('whatsapp-fab');

  // ─── HEADER SCROLL ────────────────────────────────────────
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 80);
    // Show FAB after scrolling past hero
    if (whatsappFab) {
      whatsappFab.style.animationPlayState = y > 300 ? 'running' : 'paused';
    }
    lastScroll = y;
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
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Focus terminal input when scrolling to hero
        if (a.getAttribute('href') === '#hero' && !terminalDone) {
          setTimeout(() => terminalInput.focus(), 500);
        }
      }
    });
  });

  // ─── TERMINAL HELPERS ─────────────────────────────────────
  function scrollTerminal() {
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  function addLine(text, className) {
    const div = document.createElement('div');
    div.className = 'terminal-line ' + (className || '');
    div.textContent = text;
    terminalOutput.appendChild(div);
    scrollTerminal();
  }

  function addLineHTML(html, className) {
    const div = document.createElement('div');
    div.className = 'terminal-line ' + (className || '');
    div.innerHTML = html;
    terminalOutput.appendChild(div);
    scrollTerminal();
  }

  // Type system text with animation
  function typeText(text, className) {
    return new Promise((resolve) => {
      isTyping = true;
      const lines = text.split('\n');
      let lineIdx = 0;

      function typeLine() {
        if (lineIdx >= lines.length) {
          isTyping = false;
          resolve();
          return;
        }
        const line = lines[lineIdx];
        const div = document.createElement('div');
        div.className = 'terminal-line ' + (className || 'system');
        terminalOutput.appendChild(div);

        let charIdx = 0;
        function typeChar() {
          if (charIdx < line.length) {
            div.textContent += line[charIdx];
            charIdx++;
            scrollTerminal();
            setTimeout(typeChar, TYPING_SPEED);
          } else {
            lineIdx++;
            if (lineIdx < lines.length) {
              setTimeout(typeLine, 80);
            } else {
              isTyping = false;
              resolve();
            }
          }
        }
        typeChar();
      }
      typeLine();
    });
  }

  // Progress bar animation
  function showProgress() {
    return new Promise((resolve) => {
      const div = document.createElement('div');
      div.className = 'terminal-line progress';
      terminalOutput.appendChild(div);

      const total = 20;
      let filled = 0;

      function tick() {
        filled++;
        const bar = '█'.repeat(filled) + '░'.repeat(total - filled);
        const pct = Math.round((filled / total) * 100);
        div.textContent = `${pct}% ${bar} ...מעבד`;
        scrollTerminal();
        if (filled < total) {
          setTimeout(tick, 50 + Math.random() * 40);
        } else {
          resolve();
        }
      }
      tick();
    });
  }

  // ─── SHOW INPUT ───────────────────────────────────────────
  function showInput() {
    terminalInputLine.style.display = 'flex';
    terminalInput.value = '';
    terminalInput.focus();
    scrollTerminal();
  }

  function hideInput() {
    terminalInputLine.style.display = 'none';
  }

  // ─── BOOT SEQUENCE ────────────────────────────────────────
  async function bootSequence() {
    // ASCII art
    for (const line of ASCII_ART) {
      addLine(line, 'ascii');
    }

    await sleep(300);

    // Boot lines with staggered reveal
    for (const boot of BOOT_LINES) {
      if (boot.type === 'spacer') {
        addLine('', '');
      } else if (boot.type === 'separator') {
        addLine(boot.text, 'separator');
      } else {
        await typeText(boot.text, boot.type);
      }
      await sleep(BOOT_LINE_DELAY);
    }

    await sleep(POST_BOOT_DELAY);
    runStep();
  }

  // ─── STEP RUNNER ───────────────────────────────────────────
  async function runStep() {
    if (currentStep >= STEPS.length) {
      await finishSequence();
      return;
    }

    const step = STEPS[currentStep];

    // Build system message
    let sysMsg = step.system;
    if (step.id === 'phone') {
      sysMsg = `שמח להכיר, ${formData.name}. מספר טלפון? (עדיפות לוואטסאפ)`;
    }

    if (sysMsg) {
      await typeText(sysMsg, 'system');
    }

    if (step.waitForInput) {
      showInput();
    }
  }

  // ─── FINISH ────────────────────────────────────────────────
  async function finishSequence() {
    hideInput();
    await showProgress();
    await sleep(400);
    await typeText(`✓ קיבלתי. אחזור אליך עם אבחון ראשוני תוך 24 שעות. נשמע טוב, ${formData.name}?`, 'success');
    await sleep(800);
    await typeText('Connection closed. נתראה בקרוב.', 'system');
    terminalDone = true;
    const terminal = document.getElementById('terminal');
    terminal.classList.add('terminal-complete');
    terminal.classList.add('terminal-success');

    // Show restart button
    if (restartContainer) {
      restartContainer.style.display = 'block';
    }

    // Send data
    sendLead();
  }

  // ─── SEND LEAD ─────────────────────────────────────────────
  async function sendLead() {
    const payload = {
      name: formData.name || '',
      phone: formData.phone || '',
      email: formData.email || '',
      pain_point: formData.pain_point || '',
      timestamp: new Date().toISOString(),
      source: 'systemize.co.il',
    };

    if (!WEBHOOK_URL) {
      console.log('[Systemize] Lead collected (no webhook configured):', payload);
      return;
    }

    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      console.log('[Systemize] Lead sent successfully');
    } catch (err) {
      console.error('[Systemize] Failed to send lead:', err);
    }
  }

  // ─── INPUT HANDLER ─────────────────────────────────────────
  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInput();
    }
  });

  function handleInput() {
    if (isTyping || terminalDone) return;
    if (currentStep >= STEPS.length) return;

    const value = terminalInput.value;
    const step = STEPS[currentStep];

    // Show user input as line
    addLine(`❮ ${value}`, 'user');
    hideInput();

    // Validate
    const error = step.validate ? step.validate(value) : null;
    if (error) {
      addLine(error, 'error');
      setTimeout(() => showInput(), 300);
      return;
    }

    // Store value
    if (step.field) {
      formData[step.field] = value.trim();
    }

    currentStep++;
    setTimeout(() => runStep(), 350);
  }

  // ─── KEEP TERMINAL FOCUSED ─────────────────────────────────
  document.getElementById('terminal').addEventListener('click', () => {
    if (!terminalDone) {
      terminalInput.focus();
    }
  });

  // ─── UTILITIES ─────────────────────────────────────────────
  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // ─── FAQ ACCORDION ─────────────────────────────────────────
  document.querySelectorAll('.faq-question').forEach((question) => {
    question.addEventListener('click', () => {
      const item = question.closest('.faq-item');
      
      // Close all other items
      document.querySelectorAll('.faq-item').forEach((other) => {
        if (other !== item) other.classList.remove('active');
      });
      
      // Toggle current item
      item.classList.toggle('active');
    });
  });

  // ─── RESTART TERMINAL ──────────────────────────────────────
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      // Reset state
      currentStep = 0;
      terminalDone = false;
      Object.keys(formData).forEach((k) => delete formData[k]);

      // Clear output
      terminalOutput.innerHTML = '';

      // Remove classes
      const terminal = document.getElementById('terminal');
      terminal.classList.remove('terminal-complete');
      terminal.classList.remove('terminal-success');

      // Hide restart button
      restartContainer.style.display = 'none';

      // Re-run boot
      bootSequence();
    });
  }

  // ─── INIT ──────────────────────────────────────────────────
  bootSequence();

})();
