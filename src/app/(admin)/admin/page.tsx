import { redirect } from "next/navigation";
import { requireAdmin } from "@/features/admin";

export default async function AdminIndexPage() {
  await requireAdmin();
  redirect("/admin/reviews");
}
