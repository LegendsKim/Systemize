import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DiscoveryIntakeForm } from "@/features/portal/workflow/DiscoveryIntakeForm";
import {
  emptyIntakeAnswers,
  parseIntakeAnswers,
} from "@/features/portal/workflow/intake";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "מסמך היכרות חסוי",
  robots: { index: false, follow: false, noarchive: true },
};

type DiscoveryPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function DiscoveryPage({ params }: DiscoveryPageProps) {
  const { projectId } = await params;
  const supabase = await createServerSupabaseClient();
  const [projectResult, intakeResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id,name")
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("client_intakes")
      .select("status,answers,current_step,review_note")
      .eq("project_id", projectId)
      .maybeSingle(),
  ]);

  if (
    projectResult.error ||
    !projectResult.data ||
    intakeResult.error
  ) {
    notFound();
  }

  const intake = intakeResult.data;
  return (
    <main id="main-content" className="portal-main portal-main-document">
      <DiscoveryIntakeForm
        projectId={projectResult.data.id}
        projectName={projectResult.data.name}
        initialAnswers={
          intake ? parseIntakeAnswers(intake.answers) : emptyIntakeAnswers()
        }
        initialStep={intake?.current_step ?? 1}
        status={intake?.status ?? "draft"}
        reviewNote={intake?.review_note ?? null}
        idempotencyKey={randomUUID()}
      />
    </main>
  );
}
