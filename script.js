/* ============================================================
   SYSTEMIZE — Interactive Excel Form & Page Logic
   ============================================================ */

(function () {
  'use strict';

  // ─── CONFIG ────────────────────────────────────────────────
  const WEBHOOK_URL = ''; // TODO: Replace with Make.com webhook URL

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

  // ─── MATRIX RAIN CANVAS (behind Excel form) ──────────────────
  const matrixCanvas = document.getElementById('matrix-rain-canvas');
  if (matrixCanvas) {
    const ctx = matrixCanvas.getContext('2d');
    const wrapper = matrixCanvas.parentElement;

    function resizeCanvas() {
      matrixCanvas.width = wrapper.offsetWidth;
      matrixCanvas.height = wrapper.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // VBA-style characters for the rain
    const chars = 'Sub End Function Dim Set If Then Else For Next Do Loop Call Range Cells Value ws lr xlUp Rows Count True False Integer Long String Variant Object Nothing Debug Print MsgBox Application Workbook Worksheet ActiveSheet = ( ) . , ; : & + - * / < > ! @ # $ % ^ 0 1 2 3 4 5 6 7 8 9 A B C D E F';
    const charArr = chars.split(' ');
    
    const fontSize = 13;
    let columns = Math.floor(matrixCanvas.width / fontSize);
    let drops = new Array(columns).fill(1);
    let speeds = new Array(columns).fill(0).map(() => 0.3 + Math.random() * 0.7);

    window.addEventListener('resize', () => {
      columns = Math.floor(matrixCanvas.width / fontSize);
      drops = new Array(columns).fill(1);
      speeds = new Array(columns).fill(0).map(() => 0.3 + Math.random() * 0.7);
    });

    function drawMatrix() {
      // Semi-transparent black to create fade trail
      ctx.fillStyle = 'rgba(13, 17, 23, 0.06)';
      ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

      ctx.font = fontSize + 'px "Fira Code", monospace';

      for (let i = 0; i < drops.length; i++) {
        // Random green shades for variety
        const brightness = 120 + Math.floor(Math.random() * 135);
        ctx.fillStyle = 'rgba(46, ' + brightness + ', 80, 0.9)';

        const char = charArr[Math.floor(Math.random() * charArr.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        // Reset drop to top randomly after reaching bottom
        if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += speeds[i];
      }
    }

    setInterval(drawMatrix, 45);
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

  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
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

      try {
        if (WEBHOOK_URL) {
          await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } else {
          console.log('[Systemize] Lead submitted via Macro:', payload);
          await sleep(500);
        }
      } catch (err) {
        console.error('Submit error:', err);
      }

      // 3. Outlook Send Animation Sequence
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
