-- Let the owner-triggered retry recover existing booked meetings that were queued
-- before provider credentials were available or exhausted their automatic attempts.

CREATE OR REPLACE FUNCTION public.requeue_meeting_integrations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_requeued INTEGER;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'service_role_required' USING ERRCODE = '42501';
  END IF;

  UPDATE private.meeting_integration_outbox outbox
  SET
    attempts = 0,
    next_attempt_at = now(),
    completed_at = NULL,
    last_error_code = NULL
  FROM public.meeting_integrations integration
  JOIN public.meeting_slots slot
    ON slot.id = integration.meeting_slot_id
  WHERE outbox.meeting_slot_id = integration.meeting_slot_id
    AND integration.status <> 'ready'
    AND slot.status = 'booked';

  GET DIAGNOSTICS v_requeued = ROW_COUNT;

  UPDATE public.meeting_integrations integration
  SET
    status = 'pending',
    last_error_code = NULL,
    updated_at = now()
  FROM public.meeting_slots slot
  WHERE slot.id = integration.meeting_slot_id
    AND integration.status <> 'ready'
    AND slot.status = 'booked';

  RETURN v_requeued;
END;
$$;

REVOKE ALL ON FUNCTION public.requeue_meeting_integrations()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.requeue_meeting_integrations()
  TO service_role;

COMMENT ON FUNCTION public.requeue_meeting_integrations() IS
  'Requeues unfinished booked meeting integrations for an explicit owner retry.';
