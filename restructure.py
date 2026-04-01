import re
import os

html_path = 'index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Extract the terminal wrapper
terminal_match = re.search(r'(<div class="terminal-wrapper" id="terminal-wrapper" data-animate>.*?</p>\s*</div>)', html, flags=re.DOTALL)
if terminal_match:
    terminal_html = terminal_match.group(1)
    # Remove terminal from its original spot
    html = html.replace(terminal_html, '')
else:
    print("Could not find terminal-wrapper")

# 2. Extract the excel bot animation
robot_match = re.search(r'(<div class="excel-bot-animation">.*?</div>\s*</div>)', html, flags=re.DOTALL)
if robot_match:
    robot_html = robot_match.group(1)
    # Remove robot from original spot (about section)
    # Also remove the wrapper
    wrapper_match = re.search(r'(<div class="about-image-wrapper">\s*<div class="excel-bot-animation">.*?</div>\s*</div>\s*</div>)', html, flags=re.DOTALL)
    if wrapper_match:
        html = html.replace(wrapper_match.group(1), '')
    else:
        # Just remove the bot animation
        html = html.replace(robot_html, '')
else:
    print("Could not find robot animation")
    robot_html = "<!-- Robot missing -->"

# 3. Rebuild Hero Content
hero_content_old = r'<div class="hero-content" data-animate>.*?</div>'
hero_content_new = f"""
    <div class="container hero-container">
      <div class="hero-content" data-animate>
        <h1>הופכים את ה-Excel למערכת חכמה שעובדת <strong>בשבילכם</strong></h1>
        <p class="hero-subtitle">אוטומציה עסקית, ייעול תהליכים וחיסכון בעשרות שעות של משימות חזרתיות. בואו נבדוק איפה העסק שלכם שורף זמן יקר.</p>
        <div class="cta-buttons hero-ctas" style="margin-top: 32px;">
          <a href="#audit" class="btn btn-primary" style="padding: 16px 32px; font-size: 1.05rem;">קבלו אבחון אוטומטי בחינם</a>
          <a href="#power" class="btn btn-outline" style="padding: 16px 32px; font-size: 1.05rem;">גלו מה אפשר לעשות ↓</a>
        </div>
      </div>
      
      <div class="hero-visual" data-animate>
        {robot_html}
      </div>
    </div>
"""
html = re.sub(hero_content_old, hero_content_new, html, flags=re.DOTALL)

# 4. Insert Power Section after Hero Section
power_section = """
  <!-- ===================== THE TRUE POWER OF EXCEL ===================== -->
  <section id="power" class="section power-section">
    <div class="container">
      <h2 class="section-title" data-animate>הכוח האמיתי של Excel ו-VBA</h2>
      <p class="section-subtitle" data-animate>לא מדובר בעוד טבלה יפה. מדובר בפלטפורמת פיתוח שמסוגלת לנהל עסקים שלמים מקצה לקצה.</p>
      
      <div class="power-grid">
        <div class="power-card glass-card" data-animate>
          <div class="power-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </div>
          <h3>אוטומציה מקצה לקצה</h3>
          <p>זה לא "קוסמטיקה". המערכות שלי מחברות דוחות יומיים לשרשרת אחת שרצה באופן עצמאי. לחיצת כפתור אחת מחליפה ימים של עבודה שחורה.</p>
        </div>
        <div class="power-card glass-card" data-animate>
          <div class="power-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <h3>שילוב מערכות (API)</h3>
          <p>האקסל מתחבר ל-Outlook, למערכות ה-CRM ואפילו ל-ERP שלכם. הוא שואב נתונים באופן עצמאי ומדווח חזרה בלי מגע יד אדם או העתק הדבק.</p>
        </div>
        <div class="power-card glass-card" data-animate>
          <div class="power-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          </div>
          <h3>Dashboards מותאמים אישית</h3>
          <p>זורקים את הגיליונות המבולגנים. תצוגות מנהלים ברורות, חכמות ומלוטשות שגוזרות תובנות חדות מהדאטה ההיסטורי של העסק, זמן אמת לשליטה טוטאלית.</p>
        </div>
      </div>
    </div>
  </section>
"""
html = html.replace('<!-- ===================== VALUE PROPOSITION ===================== -->', power_section + '\n  <!-- ===================== VALUE PROPOSITION ===================== -->')


# 5. Redesign Comparison Grid
comparison_grid_old = r'<div class="comparison-grid">.*?</div>\s*</div>\s*</section>'
comparison_grid_new = """<div class="premium-comparison-wrapper">
        <!-- Scenario 1 -->
        <div class="comparison-scenario" data-animate>
          <div class="floating-card old-way">
            <div class="card-badge badge-red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> במקום: ניהול מלאי מתסכל</div>
            <p>30 מגילות של אקסל עם מק"ט אב, תת-מק"טים, חוסר סנכרון, המון מספרים מפוזרים וכאב ראש כרוני שגוזל שעות כל שבוע.</p>
          </div>
          
          <div class="transition-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"></polyline><line x1="6" y1="12" x2="18" y2="12"></line></svg></div>
          
          <div class="floating-card new-way">
            <div class="card-badge badge-green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg> מקבלים: שליטה חכמה</div>
            <p><strong>Dashboard</strong> חכם ונוח לעין, עדכוני מלאי חיים מהמערכת, ושליחת מיילים אוטומטיים כשהמלאי אוזל. אפס מגע יד אדם.</p>
          </div>
        </div>

        <!-- Scenario 2 -->
        <div class="comparison-scenario mt-x" data-animate>
          <div class="floating-card old-way">
            <div class="card-badge badge-red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> במקום: מידע נזרק לפח</div>
            <p>המון דאטה נאסף ונזרק מדי יום. אין זמן לנתח אותו, חסר מעקב ואין מושג מה קורה באמת מתחת לפני השטח של העסק.</p>
          </div>
          
          <div class="transition-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"></polyline><line x1="6" y1="12" x2="18" y2="12"></line></svg></div>
          
          <div class="floating-card new-way highlight-card">
            <div class="card-badge badge-green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg> מקבלים: נתונים הם כוח</div>
            <p>לוקחים את המידע ההיסטורי והופכים אותו לכוח! סטטיסטיקה מחושבת ולייב-דאטה שמוציאים <strong>מקסימום תועלת</strong> במינימום פעולות. הכל שקוף לבעל העסק.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
"""
html = re.sub(comparison_grid_old, comparison_grid_new, html, flags=re.DOTALL)


# 6. Insert Audit Section with Terminal
audit_section = f"""
  <!-- ===================== TERMINAL / AUDIT ===================== -->
  <section id="audit" class="section audit-section">
    <div class="container">
      <div class="audit-header" data-animate>
        <h2 class="section-title">מוכנים להעלות את העסק על אוטומט?</h2>
        <p class="section-subtitle">ספרו לטרמינל האינטראקטיבי שלנו איפה שורף לכם - ואבחון ראשוני יחכה לכם בוואטסאפ.</p>
      </div>
      
      <div class="split-audit">
        <div class="audit-terminal-container">
          {terminal_html}
        </div>
      </div>
    </div>
  </section>
"""
html = html.replace('<!-- ===================== ABOUT ME & ANIMATION ===================== -->', audit_section + '\n  <!-- ===================== ABOUT ME ===================== -->')

# 7. Clean up About Section center text
about_old = r'<div class="about-grid".*?</div>\s*</div>'
about_new = """<div class="about-grid center-about" data-animate>
        <div class="about-text" style="grid-column: 1 / -1; text-align: center; max-width: 800px; margin: 0 auto;">
          <h2 style="font-size: 2.5rem; margin-bottom: 24px;">שלום, אני מרלן.</h2>
          <p style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 16px;">
            מהנדס עם רקע בתעשייה וניהול. במשך השנים ראיתי מקרוב כמה שעות עסקים מבזבזים על עבודות ידניות שאפשר לבצע בלחיצת כפתור אחת.
          </p>
          <p style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 16px;">
            התמחיתי בבניית מערכות Excel ו-VBA מותאמות אישית, כאלה שעובדות בצורה חלקה, שאנשים רגילים יכולים להשתמש בהן בלי הדרכות ארוכות, ושחוסכות כסף וזמן אמיתי כל חודש.
          </p>
          <p style="font-size: 1.2rem; font-weight: 500; color: var(--accent-terminal); margin-top: 32px;">
            תהליכים שחוזרים על עצמם הם כמו באג – ואני כאן כדי לתקן אותם.
          </p>
        </div>
      </div>"""
html = re.sub(about_old, about_new, html, flags=re.DOTALL)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("HTML rewrite complete.")
