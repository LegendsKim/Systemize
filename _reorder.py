"""Reorder sections in index.html and fix text."""
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# --- Define section boundaries by their opening comment + section tag ---
# We'll extract each section block including its preceding comment
section_ids = [
    'hero', 'power', 'value', 'comparison', 'why-excel',
    'saas-vs-excel', 'about', 'audit', 'process', 'portfolio', 'faq', 'cta'
]

# Find the start/end positions of each section
sections = {}
for sid in section_ids:
    # Find the comment line before the section (if any)
    # Pattern: optional comment line, then <section id="xxx"...>...</section>
    pattern = re.compile(
        r'(  <!-- =+[^>]*?-->\s*\n)?'  # optional comment
        r'(\s*<section id="' + re.escape(sid) + r'"[\s\S]*?</section>\s*\n)',
        re.MULTILINE
    )
    m = pattern.search(html)
    if m:
        sections[sid] = m.group(0)
        # Replace with a unique placeholder
        html = html.replace(m.group(0), f'{{{{SECTION_{sid}}}}}\n', 1)

# New logical order:
# 1. Hero - hook
# 2. Value - quick value props
# 3. Comparison (before/after) - the problem/solution
# 4. Power - what Excel can do (capabilities)
# 5. Portfolio - proof
# 6. Why-Excel - why specifically Excel
# 7. SaaS vs Excel - detailed comparison
# 8. About - who am I
# 9. Audit/Terminal - contact
# 10. Process - how we work
# 11. FAQ
# 12. CTA
new_order = [
    'hero', 'value', 'comparison', 'power', 'portfolio',
    'why-excel', 'saas-vs-excel', 'about', 'audit', 'process', 'faq', 'cta'
]

# Remove all placeholders
for sid in section_ids:
    placeholder = f'{{{{SECTION_{sid}}}}}\n'
    html = html.replace(placeholder, '', 1)

# Find where first section was (after </header>)
insert_pos = html.find('</header>')
# Move past the closing tag and newline
insert_pos = html.index('\n', insert_pos) + 1

# Build the combined sections string
combined = '\n'
for sid in new_order:
    if sid in sections:
        combined += sections[sid]

# Insert
html = html[:insert_pos] + combined + html[insert_pos:]

# --- Text fixes ---
# 1. Replace aggressive "לסבול" language
html = html.replace('למה להמשיך לסבול?', 'מוכנים לעבוד חכם יותר?')
html = html.replace(
    'הגיע הזמן לעבור לניהול על אוטומט ולהפסיק לבזבז זמן וכסף על טעויות אנוש.',
    'הפער בין ניהול ידני לניהול אוטומטי הוא עצום. הנה מה שמשתנה ברגע שעושים את הצעד.'
)
html = html.replace(
    'אני רוצה להפסיק לסבול - בואו נתחיל',
    'אני מוכן לשדרג \u2013 בואו נתחיל'
)
# Fix the "ניהול ידני (הבעיה)" text to be softer
html = html.replace('ניהול ידני (הבעיה)', 'איך זה נראה היום')
html = html.replace('הפתרון של Systemize', 'איך זה נראה אחרי Systemize')

# 2. Fix the 'להקנא' typo the user introduced
html = html.replace('להקנא', 'להתקנא')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('Done! Sections reordered and text fixed.')
