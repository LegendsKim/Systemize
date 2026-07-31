"use client";
// This form converts the owner's local date selection to an authoritative UTC timestamp.

import { useActionState, useRef } from "react";
import {
  createMeetingSlot,
} from "./actions";
import { initialWorkflowActionState } from "./action-state";

export function MeetingSlotForm({
  projectId,
  idempotencyKey,
}: {
  readonly projectId: string;
  readonly idempotencyKey: string;
}) {
  const [state, action, pending] = useActionState(
    createMeetingSlot,
    initialWorkflowActionState
  );
  const localStartRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLSelectElement>(null);
  const startsAtRef = useRef<HTMLInputElement>(null);
  const endsAtRef = useRef<HTMLInputElement>(null);

  function prepareUtcValues() {
    const rawStart = localStartRef.current?.value;
    const durationMinutes = Number(durationRef.current?.value ?? 30);
    if (!rawStart || !startsAtRef.current || !endsAtRef.current) {
      return;
    }
    const start = new Date(rawStart);
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    startsAtRef.current.value = start.toISOString();
    endsAtRef.current.value = end.toISOString();
  }

  return (
    <form action={action} className="workflow-compact-form" onSubmit={prepareUtcValues}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input ref={startsAtRef} type="hidden" name="startsAt" />
      <input ref={endsAtRef} type="hidden" name="endsAt" />

      <label>
        <span>תאריך ושעה</span>
        <input ref={localStartRef} type="datetime-local" required />
      </label>
      <label>
        <span>משך</span>
        <select ref={durationRef} defaultValue="30">
          <option value="30">30 דקות</option>
          <option value="45">45 דקות</option>
          <option value="60">60 דקות</option>
        </select>
      </label>
      {state.message && (
        <p className="workflow-form-message" role="alert">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        className="portal-primary-action"
        disabled={pending}
      >
        {pending ? "פותח מועד…" : "פתיחת מועד לבחירה"}
      </button>
    </form>
  );
}
