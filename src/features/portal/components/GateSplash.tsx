import {
  gateSplashCompleteEvent,
  gateSplashSteps,
} from "@/features/portal/boot-sequence";
import { BootSequence } from "@/features/portal/components/BootSequence";

/**
 * The short brand beat that opens the sign-in screen.
 *
 * It lasts long enough for its three beats to register, says what it is doing, and still
 * goes away on any click, relevant key, or the skip button. Rendered by the server on
 * every load of the gate rather than remembered per session, because remembering means
 * reading browser storage, and reading browser storage during the first render is what
 * produces a mismatch between the server's HTML and the client's.
 */
export function GateSplash() {
  return (
    <BootSequence
      steps={gateSplashSteps}
      title="מכינים את האזור האישי שלך"
      completeTitle="האזור האישי מוכן"
      skipLabel="דילוג"
      completionEvent={gateSplashCompleteEvent}
    />
  );
}
