import type { Metadata } from "next";
import { ContactForm } from "@/features/contact-request/components/ContactForm";
import { Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with us.",
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-(--spacing-page-x) py-12">
      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Get in Touch
          </h1>
          <p className="text-text-secondary">
            Have a question or want to work together? Leave us a message.
          </p>
        </div>
        <Card>
          <ContactForm />
        </Card>
      </div>
    </div>
  );
}
