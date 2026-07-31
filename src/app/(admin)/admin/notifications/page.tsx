import { redirect } from "next/navigation";
import { requireSystemizeOwner } from "@/features/portal/auth/session";

export default async function AdminNotificationsPage() {
  await requireSystemizeOwner();
  redirect("/admin/settings");
}
