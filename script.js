/* ============================================================
   SYSTEMIZE — Interactive Excel Form & Page Logic
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
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
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

  // ─── INLINE EXCEL FORM LOGIC ───────────────────────────────
  const excelContainer = document.getElementById('excel-container');
  const fxCell = document.getElementById('fx-cell');
  const fxText = document.getElementById('fx-text');
  const excelInputs = document.querySelectorAll('.eg-input, .eg-select, .eg-textarea');
  const submitBtn = document.getElementById('excel-submit-btn');
  const submitTextSpan = document.getElementById('excel-submit-text');
  const vbaOverlay = document.getElementById('vba-overlay');
  const successMessage = document.getElementById('success-message');
  const outlookScene = document.getElementById('outlook-scene');
  const sendingText = document.getElementById('sending-text');
  const bgTyping = document.getElementById('bg-typing');

  // Background VBA Typing Loop
  if (bgTyping) {
    const codeSnippet = `Public Function AutomateBusiness(data As Range) As Boolean\n  On Error GoTo ErrorHandler\n  Dim cell As Range\n  For Each cell In data\n    If IsEmpty(cell) Then\n      Debug.Print "Missing data"\n    End If\n  Next cell\n  AutomateBusiness = True\n  Exit Function\nErrorHandler:\n  AutomateBusiness = False\nEnd Function\nSub SyncToCloud()\n  Dim http As Object\n  Set http = CreateObject("MSXML2.XMLHTTP")\n  http.Open "POST", endpoint, False\n  http.setRequestHeader "Content-Type", "application/json"\n  http.send jsonPayload\nEnd Sub\n`;
    
    let typeIndex = 0;
    setInterval(() => {
      if (typeIndex >= codeSnippet.length) typeIndex = 0;
      bgTyping.textContent += codeSnippet[typeIndex];
      // Keep only last 800 chars to avoid memory issues
      if (bgTyping.textContent.length > 800) {
        bgTyping.textContent = bgTyping.textContent.slice(bgTyping.textContent.length - 800);
      }
      typeIndex++;
    }, 40); // speed
  }

  // ─── GEOMETRIC NETWORK CANVAS (section background) ────────────
  const matrixCanvas = document.getElementById('matrix-rain-canvas');
  if (matrixCanvas) {
    const ctx = matrixCanvas.getContext('2d');
    const section = matrixCanvas.parentElement;

    function resizeCanvas() {
      matrixCanvas.width = section.offsetWidth;
      matrixCanvas.height = section.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particles (nodes)
    const particleCount = 60;
    const connectionDist = 150;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * matrixCanvas.width,
        y: Math.random() * matrixCanvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: 1.5 + Math.random() * 1.5,
      });
    }

    function drawNetwork() {
      ctx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);

      // Update & draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off walls
        if (p.x < 0 || p.x > matrixCanvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > matrixCanvas.height) p.vy *= -1;

        // Draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(46, 204, 113, 0.6)';
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            const opacity = (1 - dist / connectionDist) * 0.25;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = 'rgba(46, 204, 113, ' + opacity + ')';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(drawNetwork);
    }

    drawNetwork();
  }

  // Cell Focus & Input Logic
  excelInputs.forEach(input => {
    const parentCell = input.closest('.eg-cell');
    
    // On focus: update formula bar and cell styling
    input.addEventListener('focus', () => {
      // Remove focus from all
      document.querySelectorAll('.focused-cell').forEach(c => c.classList.remove('focused-cell'));
      if (parentCell) {
        parentCell.classList.add('focused-cell');
        // Update FX Bar
        const cellRef = parentCell.getAttribute('data-cell') || '';
        const formula = parentCell.getAttribute('data-formula') || '';
        if (fxCell) fxCell.textContent = cellRef;
        if (fxText) fxText.textContent = formula;
      }
    });

    // On blur: remove focus style
    input.addEventListener('blur', () => {
      if (parentCell) parentCell.classList.remove('focused-cell');
    });

    // On input/change: conditional formatting
    const updateFilledState = () => {
      if (!parentCell) return;
      const val = input.value.trim();
      parentCell.classList.remove('filled-cell');
      parentCell.classList.remove('error-cell');

      if (val !== '') {
        // Validation check
        let isError = false;
        if (input.type === 'email') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) isError = true;
        } else if (input.type === 'tel') {
          const phone = val.replace(/[-\s]/g, '');
          if (!/^0[0-9]{8,9}$/.test(phone) && !/^\+?972[0-9]{8,9}$/.test(phone)) isError = true;
        }

        if (isError) {
          parentCell.classList.add('error-cell');
        } else {
          parentCell.classList.add('filled-cell');
        }
      }
    };
    // Trigger validation only after finishing typing (on blur/change)
    input.addEventListener('blur', updateFilledState);
    input.addEventListener('change', updateFilledState);
  });

  // ─── VBA MACRO ANIMATION AND SUBMIT ────────────────────────
  function generateVBA() {
    return `Sub SystemizeAudit()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Audit")
    Dim lr As Long
    lr = ws.Cells(Rows.Count, 1).End(xlUp).Row + 1
    
    ws.Cells(lr, 1).Value = Now
    ws.Cells(lr, 2).Value = ClientData(1)
    ws.Cells(lr, 3).Value = ClientData(2)
    ws.Cells(lr, 4).Value = ClientData(3)
    ws.Cells(lr, 5).Value = EvaluateProblems()
    
    Call SendWebhookData(ws.Range(Cells(lr,1), Cells(lr,5)))
    Application.ScreenUpdating = True
End Sub`.split('\n');
  }

  async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // Record page load time for anti-spam timing check
  const formLoadTime = Date.now();

  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      // ─── ANTI-SPAM CHECKS ───────────────────────────────────
      // 1. Honeypot: if the hidden field is filled, it's a bot
      const honeypot = document.getElementById('hp-field');
      if (honeypot && honeypot.value !== '') {
        console.log('[Systemize] Bot detected (honeypot)');
        // Fake success to not alert bots
        submitBtn.disabled = true;
        if (submitTextSpan) submitTextSpan.textContent = 'Done';
        return;
      }
      // 2. Timing: if submitted in under 3 seconds, likely bot
      if (Date.now() - formLoadTime < 3000) {
        console.log('[Systemize] Bot detected (too fast)');
        submitBtn.disabled = true;
        if (submitTextSpan) submitTextSpan.textContent = 'Done';
        return;
      }
      // ────────────────────────────────────────────────────────

      const nameVal = document.getElementById('ex-name')?.value || '';
      const emailVal = document.getElementById('ex-email')?.value || '';
      const phoneVal = document.getElementById('ex-phone')?.value || '';
      const painVal = document.getElementById('ex-pain')?.value || '';
      const sourceVal = document.getElementById('ex-source')?.value || '';

      if (!nameVal || !emailVal || !phoneVal || !painVal || !sourceVal) {
        alert('יש למלא את כל השדות בגיליון.');
        return;
      }

      const hasError = document.querySelector('.error-cell');
      if (hasError) {
        alert('ישנם שדות עם פרטים לא תקינים (סומנו באדום). אנא תקן אותם לפני השליחה.');
        return;
      }

      // Payload
      const payload = {
        name: nameVal,
        email: emailVal,
        phone: phoneVal,
        pain_point: painVal,
        source: sourceVal,
        origin: 'systemize.co.il (Excel Inline)',
        timestamp: new Date().toISOString()
      };

      // 1. Loading Text Makeover
      submitBtn.disabled = true;
      submitTextSpan.textContent = 'מייצר פקודת מאקרו...';

      // 2. Show VBA Overlay Matrix
      if (vbaOverlay) {
        vbaOverlay.innerHTML = '';
        vbaOverlay.classList.add('active');
        
        const vbaLines = generateVBA();
        for (let i = 0; i < vbaLines.length; i++) {
          const lineDiv = document.createElement('div');
          lineDiv.className = 'vba-line';
          lineDiv.textContent = vbaLines[i];
          // Stagger the animation timing to make it drop fast
          lineDiv.style.animationDelay = `${i * 0.05}s`;
          vbaOverlay.appendChild(lineDiv);
        }
      }

      // Wait for Matrix to fall
      await sleep(1000);

      // ─── SEND TO API ──────────────────────────────────────────
      let sendSuccess = false;
      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => ({}));

        if (response.ok && result.ok) {
          sendSuccess = true;
        } else {
          console.error('[Systemize] API error:', result);
        }
      } catch (err) {
        console.error('[Systemize] Network error:', err);
      }

      // ─── HANDLE FAILURE ───────────────────────────────────────
      if (!sendSuccess) {
        // Show error in the Excel UI (formula bar turns into an error cell)
        if (fxText) fxText.textContent = '#ERROR! שגיאת תקשורת במאקרו — נסו שוב';
        if (fxCell) fxCell.textContent = 'ERR';

        // Hide VBA overlay
        if (vbaOverlay) {
          vbaOverlay.classList.remove('active');
          vbaOverlay.innerHTML = '';
        }

        // Re-enable submit so user can retry
        submitBtn.disabled = false;
        if (submitTextSpan) submitTextSpan.textContent = 'Run Macro';
        return; // stop – do NOT show success animation
      }

      // 3. Outlook Send Animation Sequence (only on success)
      if (excelContainer) {
        excelContainer.classList.add('excel-dissolve');
      }
      
      await sleep(300);

      if (successMessage && outlookScene) {
        successMessage.classList.add('active'); // shows overlay text wrapper
        outlookScene.classList.add('active');
        
        const sendingStatus = document.getElementById('sending-status');
        const resetContainer = document.getElementById('reset-form-container');

        // Step 1: Outlook envelope pops in, file drops in
        outlookScene.classList.add('step-1');
        await sleep(1000);
        
        // Step 2: Flap closes
        outlookScene.classList.add('step-2');
        if (sendingStatus) sendingStatus.textContent = 'שולח...';
        await sleep(500);

        // Step 3: Envelope flies away
        outlookScene.classList.add('step-3');
        await sleep(800);
        
        // Final: warm success text + reset button
        outlookScene.style.display = 'none';
        if (sendingStatus) {
          sendingStatus.textContent = '';
        }
        if (resetContainer) {
          resetContainer.style.display = 'block';
        }
      }

    });
  }

  // ─── RESET FORM ───────────────────────────────────────────
  const resetBtn = document.getElementById('reset-excel-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // Clear all inputs
      excelInputs.forEach(input => {
        if (input.tagName === 'SELECT') {
          input.selectedIndex = 0;
        } else {
          input.value = '';
        }
        const cell = input.closest('.eg-cell');
        if (cell) {
          cell.classList.remove('filled-cell', 'error-cell');
        }
      });

      // Reset formula bar
      if (fxCell) fxCell.textContent = 'A1';
      if (fxText) fxText.textContent = '';

      // Reset container visibility
      if (excelContainer) {
        excelContainer.classList.remove('excel-dissolve');
      }
      if (successMessage) {
        successMessage.classList.remove('active');
      }
      const outlookEl = document.getElementById('outlook-scene');
      if (outlookEl) {
        outlookEl.classList.remove('active', 'step-1', 'step-2', 'step-3');
        outlookEl.style.display = '';
      }
      const resetCont = document.getElementById('reset-form-container');
      if (resetCont) resetCont.style.display = 'none';
      const statusEl = document.getElementById('sending-status');
      if (statusEl) statusEl.textContent = '';

      // Reset VBA overlay
      if (vbaOverlay) {
        vbaOverlay.classList.remove('active');
        vbaOverlay.innerHTML = '';
      }

      // Re-enable submit
      if (submitBtn) {
        submitBtn.disabled = false;
        if (submitTextSpan) submitTextSpan.textContent = 'Run Macro';
      }
    });
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

})();
