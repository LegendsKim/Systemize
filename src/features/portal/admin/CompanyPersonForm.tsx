import { updateCompanyPerson } from "./actions";

interface CompanyPersonFormProps {
  readonly projectId: string;
  readonly personId: string;
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly activated: boolean;
  readonly idempotencyKey: string;
}

export function CompanyPersonForm({
  projectId,
  personId,
  fullName,
  email,
  phone,
  activated,
  idempotencyKey,
}: CompanyPersonFormProps) {
  return (
    <form action={updateCompanyPerson} className="admin-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="personId" value={personId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <div className="admin-field">
        <label htmlFor={`person-name-${personId}`}>שם מלא</label>
        <input
          id={`person-name-${personId}`}
          name="fullName"
          defaultValue={fullName}
          autoComplete="name"
          minLength={2}
          maxLength={120}
          required
        />
      </div>
      <div className="admin-field">
        <label htmlFor={`person-email-${personId}`}>כתובת Gmail</label>
        <input
          id={`person-email-${personId}`}
          name="email"
          type="email"
          dir="ltr"
          defaultValue={email}
          readOnly={activated}
          aria-describedby={`person-email-help-${personId}`}
          required
        />
        <p
          id={`person-email-help-${personId}`}
          className="admin-field-help"
        >
          {activated
            ? "הכתובת נעולה לאחר הפעלת החשבון, משום שהיא זהות הכניסה לפרויקט."
            : "שינוי הכתובת מבטל כל הזמנה פעילה. לאחר השמירה יש להפיק קישור חדש."}
        </p>
      </div>
      <div className="admin-field">
        <label htmlFor={`person-phone-${personId}`}>מספר טלפון</label>
        <input
          id={`person-phone-${personId}`}
          name="phone"
          type="tel"
          dir="ltr"
          defaultValue={phone}
          autoComplete="tel"
          minLength={8}
          maxLength={32}
          required
        />
      </div>
      <div className="admin-form-actions">
        <button type="submit" className="admin-button">
          שמירת איש הקשר
        </button>
      </div>
    </form>
  );
}
