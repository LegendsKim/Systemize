import {
  buildTelHref,
  buildWhatsAppHref,
} from "@/features/portal/admin/lead-contact";
import { requireSystemizeOwner } from "@/features/portal/auth/session";
import { formatPortalDateTime } from "@/features/portal/workflow/format";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listLeadsForOwner } from "@/server/repositories/lead.repository";

/*
 * The WhatsApp glyph, drawn at the same 24-grid and 1.75 stroke as the console's other
 * icons. Borrowing the brand's filled logo would put a second visual language inside a
 * button that already reads as SYSTEMIZE's.
 */
const whatsAppGlyph =
  "M4.5 19.5 5.6 16a7.2 7.2 0 1 1 2.9 2.9L4.5 19.5Zm5-8.9c0 3 3 4.9 3.4 4.9.7 0 1.6-.6 1.8-1.2.1-.3 0-.5-.2-.6l-1.4-.7c-.2-.1-.4 0-.6.2l-.4.5c-.8-.3-1.6-1.1-1.9-1.9l.5-.4c.2-.2.2-.4.2-.6l-.7-1.4c-.1-.2-.3-.3-.6-.2-.6.2-1.1 1-1.1 1.4Z";

export default async function AdminLeadsPage() {
  await requireSystemizeOwner();
  const supabase = await createServerSupabaseClient();
  const leads = await listLeadsForOwner(supabase);

  return (
    <main id="main-content" className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">פניות מהאתר</p>
          <h1>לידים</h1>
          <p>
            כל פנייה שהתקבלה מטופס יצירת הקשר באתר, מהחדשה לוותיקה. פתיחת שורה
            מציגה את מלוא הפרטים, ומשם אפשר לעבור לשיחה בלחיצה אחת.
          </p>
        </div>
      </div>

      {leads.length === 0 ? (
        <section className="admin-section">
          <div className="admin-empty">
            <h2>עדיין לא התקבלו פניות</h2>
            <p>
              כל טופס שיישלח מהאתר יופיע כאן מיד, עם שם, עסק, טלפון, דוא״ל
              והתוכן המלא של ההודעה.
            </p>
          </div>
        </section>
      ) : (
        <section className="admin-section" aria-labelledby="leads-title">
          <div className="admin-section-head">
            <h2 id="leads-title">פניות שהתקבלו</h2>
            <p>
              {leads.length === 1
                ? "פנייה אחת"
                : `${leads.length} פניות`}{" "}
              · ממוינות מהחדשה לוותיקה
            </p>
          </div>

          {/*
            Native disclosure rows rather than clickable table rows. The requirement is
            "click a row to see everything", and `details`/`summary` is exactly that
            interaction with keyboard support, an announced expanded state, and no client
            JavaScript — none of which a div with an onClick would have.
          */}
          <ul className="admin-lead-list">
            {leads.map((lead) => {
              const whatsAppHref = buildWhatsAppHref({
                fullName: lead.full_name,
                businessName: lead.business_name,
                phone: lead.phone,
              });

              return (
                <li key={lead.id}>
                  <details className="admin-lead">
                    <summary>
                      <span className="admin-lead-identity">
                        <strong>{lead.full_name}</strong>
                        <small>{lead.business_name}</small>
                      </span>
                      <time
                        className="admin-lead-time"
                        dateTime={lead.created_at}
                      >
                        {formatPortalDateTime(lead.created_at)}
                      </time>
                      <span className="admin-lead-toggle" aria-hidden="true">
                        פרטים
                      </span>
                    </summary>

                    <div className="admin-lead-body">
                      <dl className="admin-lead-facts">
                        <div>
                          <dt>טלפון</dt>
                          <dd>
                            <a href={buildTelHref(lead.phone)} dir="ltr">
                              {lead.phone}
                            </a>
                          </dd>
                        </div>
                        <div>
                          <dt>דוא״ל</dt>
                          <dd>
                            <a href={`mailto:${lead.email}`} dir="ltr">
                              {lead.email}
                            </a>
                          </dd>
                        </div>
                        <div>
                          <dt>שם העסק</dt>
                          <dd>{lead.business_name}</dd>
                        </div>
                        <div>
                          <dt>מזהה פנייה</dt>
                          <dd dir="ltr">{lead.request_id}</dd>
                        </div>
                      </dl>

                      <div className="admin-lead-message">
                        <h3>מה נכתב בפנייה</h3>
                        <p>{lead.message}</p>
                      </div>

                      <div className="admin-lead-actions">
                        {whatsAppHref ? (
                          <a
                            href={whatsAppHref}
                            className="admin-button"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              focusable="false"
                            >
                              <path
                                d={whatsAppGlyph}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            המשך שיחה בוואטסאפ
                          </a>
                        ) : (
                          /*
                           * A number that could not be read as international digits gets
                           * no button. Guessing a destination here opens a chat with a
                           * stranger, which is worse than asking the operator to look.
                           */
                          <p className="admin-lead-note">
                            לא ניתן לבנות קישור וואטסאפ מהמספר שנמסר. אפשר
                            להתקשר או לכתוב במייל.
                          </p>
                        )}
                        <a
                          href={`mailto:${lead.email}`}
                          className="admin-button"
                          data-variant="secondary"
                        >
                          שליחת מייל
                        </a>
                      </div>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
