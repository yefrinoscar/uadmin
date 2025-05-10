import { Sidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { currentUser } from "@clerk/nextjs/server";
import { NavigationProgress } from "@/components/navigation-progress";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const name = user?.username ?? '';
  const email = user?.emailAddresses.find(u => u.id === user.primaryEmailAddressId)?.emailAddress ?? '';
  const avatar = user?.imageUrl ?? '';

  return (
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <Sidebar user={{ name, email, avatar }} />
          <main className="px-8 py-2  flex-grow">
            <div className="mx-auto container">
              {children}
            </div>
            <NavigationProgress />
          </main>
        </div>
      </SidebarProvider>
  );
}