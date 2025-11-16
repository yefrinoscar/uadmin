import { Sidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { currentUser } from "@clerk/nextjs/server";
import { NavigationProgress } from "@/components/navigation-progress";
import { cookies } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const name = user?.username ?? '';
  const email = user?.emailAddresses.find(u => u.id === user.primaryEmailAddressId)?.emailAddress ?? '';
  const avatar = user?.imageUrl ?? '';

  // Read sidebar state from cookies on the server
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar_state");
  const defaultOpen = sidebarState?.value === "false" ? false : true;

  return (
      <SidebarProvider defaultOpen={defaultOpen}>
        <div className="flex h-screen w-full overflow-hidden">
          <Sidebar user={{ name, email, avatar }} />
          <main className="px-8 py-2 flex-grow overflow-y-auto overflow-x-hidden">
            <div className="mx-auto container max-w-full">
              {children}
            </div>
            <NavigationProgress />
          </main>
        </div>
      </SidebarProvider>
  );
}