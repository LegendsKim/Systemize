import type { Metadata } from "next";
import { beginGoogleSignIn } from "@/features/portal/auth/actions";
import {
  AuthGate,
  AuthGateMark,
  AuthTrustBadges,
} from "@/features/portal/auth/components/AuthGate";
import { GoogleSignInButton } from "@/features/portal/auth/components/GoogleSignInButton";
import { isInvitationToken } from "@/features/portal/invitations/tokens";
import { portalShareMetadata } from "@/lib/seo/portal-share-metadata";

type InvitationPageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({
  params,
}: InvitationPageProps): Promise<Metadata> {
  const { token } = await params;

  return portalShareMetadata({
    path: `/invite/${token}`,
    title: "הזמנה אישית ל־SYSTEMIZE PORTAL",
    description:
      "הזמנה מאובטחת למרחב הפרויקט המשותף של SYSTEMIZE — שלבים, מסמכים והחלטות במקום אחד.",
  });
}

const activationSteps = [
  {
    title: "אימות זהות",
    detail: "Google מאשרת שזה חשבון ה־Gmail שהוזמן.",
  },
  {
    title: "חיבור מאובטח",
    detail: "הגישה משויכת רק לפרויקט שאליו הוזמנת.",
  },
  {
    title: "תמונת מצב ברורה",
    detail: "נכנסים ישירות לשלב הנוכחי ולמה שקורה עכשיו.",
  },
] as const;

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;
  const validShape = isInvitationToken(token);

  return (
    <AuthGate
      labelledBy="invitation-title"
      aside={
        validShape ? (
          <>
            <p className="auth-eyebrow">כך זה עובד</p>
            <h2>שלושה צעדים ואתם בפנים</h2>
            <ol className="auth-steps">
              {activationSteps.map((step) => (
                <li key={step.title}>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="auth-panel-footnote">
              ההפעלה חד־פעמית. מכאן והלאה הכניסה היא לחיצה אחת.
            </p>
          </>
        ) : undefined
      }
    >
      <AuthGateMark />
      <p className="auth-eyebrow">הזמנה אישית</p>
      <h1 id="invitation-title">
        {validShape ? "הפרויקט שלך מחכה לך" : "ההזמנה אינה זמינה"}
      </h1>
      <p className="auth-gate-lede">
        {validShape
          ? "עוד רגע נכנסים למרחב המשותף שבו כל שלב, מסמך והחלטה נשארים מסודרים וברורים."
          : "ייתכן שהקישור שגוי, פג או הוחלף. אפשר לפנות ל־SYSTEMIZE לקבלת הזמנה חדשה."}
      </p>
      {validShape && (
        <>
          <form action={beginGoogleSignIn} className="auth-gate-form">
            <input type="hidden" name="invitationToken" value={token} />
            <GoogleSignInButton label="הפעלת האזור האישי עם Google" />
          </form>
          <AuthTrustBadges
            items={["הפעלה חד־פעמית", "משויך לפרויקט אחד", "חיבור מוצפן"]}
          />
        </>
      )}
      <p className="auth-gate-note auth-gate-note-key">
        {validShape
          ? "חשוב להתחבר עם כתובת ה־Gmail שאליה נשלחה ההזמנה."
          : "לא נחשף מידע על הפרויקט לפני אימות זהות מלא."}
      </p>
    </AuthGate>
  );
}
