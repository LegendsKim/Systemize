import { formatPortalDateTime } from "./format";
import {
  presentProjectEvent,
  projectEventActorLabels,
} from "./project-events";

export interface ProjectHistoryEvent {
  readonly id: string;
  readonly event_type: string;
  readonly occurred_at: string;
}

type ProjectHistoryProps = {
  readonly events: readonly ProjectHistoryEvent[];
  /** The client timeline hides internal bookkeeping; the operator's shows everything. */
  readonly audience: "client" | "owner";
  readonly headingId: string;
};

/**
 * "What happened since last time", answered from the append-only event log rather than
 * from a status field that only remembers the present.
 */
export function ProjectHistory({
  events,
  audience,
  headingId,
}: ProjectHistoryProps) {
  const entries = events
    .map((event) => ({ event, presentation: presentProjectEvent(event.event_type) }))
    .filter(
      ({ presentation }) =>
        audience === "owner" || presentation.clientVisible
    );

  return (
    <section className="portal-history" aria-labelledby={headingId}>
      <div className="portal-section-heading">
        <div>
          <p className="portal-eyebrow">מה קרה עד עכשיו</p>
          <h2 id={headingId}>היסטוריית הפרויקט</h2>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="portal-history-empty">
          עדיין לא נרשמו אירועים. כל שליחה, אישור, פגישה ותשלום יופיעו כאן
          לפי סדר הזמן.
        </p>
      ) : (
        <ol className="portal-history-list">
          {entries.map(({ event, presentation }) => (
            <li key={event.id} data-actor={presentation.actor}>
              <div className="portal-history-mark" aria-hidden="true" />
              <div className="portal-history-body">
                <strong>{presentation.title}</strong>
                <p>{presentation.detail}</p>
                <small>
                  <span>{projectEventActorLabels[presentation.actor]}</span>
                  {" · "}
                  <time dateTime={event.occurred_at}>
                    {formatPortalDateTime(event.occurred_at)}
                  </time>
                </small>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
