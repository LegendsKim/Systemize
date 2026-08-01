import { beginGoogleSignIn } from "@/features/portal/auth/actions";
import {
  AuthGate,
  AuthGateMark,
  AuthSignalList,
  AuthTrustBadges,
} from "@/features/portal/auth/components/AuthGate";
import { GoogleSignInButton } from "@/features/portal/auth/components/GoogleSignInButton";
import { LoginPwaInstallPrompt } from "@/features/portal/pwa/LoginPwaInstallPrompt";
import { PwaRegistration } from "@/features/portal/pwa/PwaRegistration";
import { portalShareMetadata } from "@/lib/seo/portal-share-metadata";

export const metadata = portalShareMetadata({
  path: "/login",
  title: "כניסה ל־SYSTEMIZE PORTAL",
  description:
    "כניסה מאובטחת לאזור האישי שבו מצב הפרויקט, המסמכים והפעולות הבאות נשארים במקום אחד.",
});

/**
 * The three lines on the ink panel.
 *
 * Deliberately not "תמונת מצב אחת ועדכנית" and its neighbours, which were true of every
 * portal ever built and therefore said nothing about this one. Each line now names the
 * specific thing a client is actually afraid of losing track of.
 */
const signals = [
  {
    title: "מה קורה עכשיו",
    detail: "השלב הנוכחי, מה הושלם ומה התאריך הבא, בלי לשאול.",
  },
  {
    title: "מה מחכה לך",
    detail: "החלטות ואישורים שממתינים לך, מרוכזים במקום אחד.",
  },
  {
    title: "מה כבר סוכם",
    detail: "מסמכים, גרסאות והחלטות קודמות, שמורים וניתנים לשליפה.",
  },
] as const;

export default function LoginPage() {
  return (
    <>
      <PwaRegistration />
      <AuthGate
        labelledBy="login-title"
        aside={
          <>
            <p className="auth-eyebrow">שקט, סדר ושקיפות</p>
            <h2>תמיד לדעת מה קורה בפרויקט</h2>
            <AuthSignalList items={signals} />
            <p className="auth-panel-footnote">
              כל שינוי בפרויקט מתעדכן כאן אוטומטית. אין דוח שבועי להמתין לו.
            </p>
          </>
        }
      >
        <AuthGateMark />
        <p className="auth-eyebrow">האזור האישי</p>
        <h1 id="login-title">כל הפרויקט שלך, במקום אחד ברור</h1>
        <p className="auth-gate-lede">
          כניסה מאובטחת לאזור האישי שבו מחכים לך מצב הפרויקט, מסמכים, החלטות
          והפעולות הבאות.
        </p>
        <form action={beginGoogleSignIn} className="auth-gate-form">
          <GoogleSignInButton label="המשך עם Google" />
        </form>
        <AuthTrustBadges
          items={["ללא סיסמאות", "בהזמנה בלבד", "חיבור מוצפן"]}
        />
        <p className="auth-gate-note">
          הכניסה זמינה רק לחשבון Gmail שהוזמן מראש. SYSTEMIZE לעולם לא מקבלת את
          סיסמת Google שלך.
        </p>
      </AuthGate>
      <LoginPwaInstallPrompt />
    </>
  );
}
