import { AdminSidebar } from "@/components/admin/sidebar";
import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 lg:ml-64">
        <div className="p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
