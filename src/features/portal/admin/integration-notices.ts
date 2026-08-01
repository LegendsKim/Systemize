export const integrationNotices: Record<string, string> = {
  "google-calendar-connected":
    "Google Calendar חובר בהצלחה. זימוני הפגישות יישלחו אוטומטית.",
  "google-calendar-account-mismatch":
    "יש לחבר את אותו חשבון Gmail שמוגדר כבעלים של SYSTEMIZE.",
  "google-calendar-state-invalid":
    "בקשת החיבור פגה או אינה תקינה. אפשר להתחיל את החיבור מחדש.",
  "google-calendar-connect-failed":
    "חיבור Google Calendar לא הושלם. אפשר לנסות שוב.",
  "google-calendar-store-failed":
    "ההרשאה התקבלה אך לא נשמרה. אפשר לנסות שוב.",
  "google-calendar-forbidden": "רק חשבון הבעלים יכול לחבר את היומן.",
  "meeting-integrations-ready":
    "הפגישה הוכנה בהצלחה: קישור Zoom ואירוע Google Calendar זמינים כעת.",
  "meeting-integrations-retrying":
    "הספק החיצוני ביקש להמתין. המערכת תנסה שוב אוטומטית.",
  "meeting-integrations-attention":
    "יצירת Zoom או Calendar נכשלה ודורשת בדיקת הגדרות.",
  "meeting-integrations-failed":
    "לא ניתן היה להפעיל את תור הפגישות כרגע. אפשר לנסות שוב.",
  "meeting-integrations-no-work": "אין כרגע פגישות שממתינות ליצירת קישורים.",
  "meeting-providers-not-configured":
    "חסרים משתני סביבה של Zoom או Google Calendar בייצור.",
  "google-calendar-connect-required":
    "יש לחבר את Google Calendar לפני יצירת הזימונים.",
  "system-health-checked": "בדיקת המערכות הסתיימה והמצב עודכן.",
  "system-health-check-failed": "לא ניתן היה להשלים את בדיקת המערכות כרגע.",
  zoom_account_id_missing: "הערך ZOOM_ACCOUNT_ID חסר ב־Vercel.",
  zoom_client_id_missing: "הערך ZOOM_CLIENT_ID חסר ב־Vercel.",
  zoom_client_secret_missing: "הערך ZOOM_CLIENT_SECRET חסר ב־Vercel.",
  zoom_host_user_id_missing: "הערך ZOOM_HOST_USER_ID חסר ב־Vercel.",
  zoom_account_id_too_long: "הערך ZOOM_ACCOUNT_ID ב־Vercel ארוך מהצפוי.",
  zoom_client_id_too_long: "הערך ZOOM_CLIENT_ID ב־Vercel ארוך מהצפוי.",
  zoom_client_secret_too_long: "הערך ZOOM_CLIENT_SECRET ב־Vercel ארוך מהצפוי.",
  zoom_host_user_id_too_long: "הערך ZOOM_HOST_USER_ID ב־Vercel ארוך מהצפוי.",
};
