import type { Metadata } from "next";
import Link from "next/link";
import {
  AuthGate,
  AuthGateMark,
} from "@/features/portal/auth/components/AuthGate";

export const metadata: Metadata = {
  title: "לא ניתן להשלים את הכניסה",
  robots: { index: false, follow: false, noarchive: true },
};

const messages: Record<string, string> = {
  gmail_required: "בשלב זה ניתן להתחבר רק באמצעות כתובת gmail.com.",
  invitation_required: "החשבון אינו משויך להזמנה פעילה.",
  invitation_rejected: "ההזמנה אינה תקפה, פגה או שייכת לחשבון Gmail אחר.",
  invalid_invitation: "קישור ההזמנה אינו תקין.",
  provider_unavailable: "לא ניתן להתחבר ל-Google כרגע. אפשר לנסות שוב בעוד רגע.",
  missing_code: "Google לא החזירה קוד התחברות תקין.",
  session_exchange: "לא ניתן היה ליצור התחברות מאובטחת.",
  profile_setup: "לא ניתן היה להשלים את יצירת החשבון.",
};

type AuthErrorPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const { reason } = await searchParams;
  const message =
    (reason && messages[reason]) ??
    "לא ניתן היה להשלים את הכניסה. אפשר לנסות שוב או לבקש הזמנה חדשה.";

  return (
    <AuthGate labelledBy="auth-error-title" splash={false}>
      <AuthGateMark />
      <p className="auth-eyebrow">האזור האישי</p>
      <h1 id="auth-error-title">לא הצלחנו להשלים את הכניסה</h1>
      <p className="auth-gate-lede" role="alert">
        {message}
      </p>
      <Link href="/login" className="auth-google-button auth-gate-form">
        ניסיון נוסף
      </Link>
      <p className="auth-gate-note">
        לא נשמרו פרטי הזדהות, ולא נחשף מידע על אף פרויקט.
      </p>
    </AuthGate>
  );
}
