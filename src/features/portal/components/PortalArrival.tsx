import { portalBootSteps } from "@/features/portal/boot-sequence";
import { BootSequence } from "@/features/portal/components/BootSequence";

interface PortalArrivalProps {
  /** The client's first name, used once, in the closing line. */
  readonly firstName: string;
}

/**
 * The arrival sequence, played once after a successful sign-in.
 *
 * It exists to cover the one moment the portal cannot make graceful on its own: the
 * return from Google, when a person who has just handed over an identity lands on a page
 * that is still deciding what to show them. Roughly five and a half seconds, skippable
 * throughout, and it strips its own `welcome` parameter on the way out.
 */
export function PortalArrival({ firstName }: PortalArrivalProps) {
  return (
    <BootSequence
      steps={portalBootSteps}
      title="מכינים לך את האזור האישי"
      completeTitle={firstName ? `הכול מוכן, ${firstName}` : "הכול מוכן"}
      skipLabel="דילוג לאזור האישי"
      clearParam="welcome"
    />
  );
}
