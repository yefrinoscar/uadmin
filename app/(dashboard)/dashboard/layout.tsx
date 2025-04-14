"use client"

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";
import { menu } from "@/config/menu";

export default function DashboardContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const description = menu.find(item => item.path === pathname)?.description;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 h-10 mb-16">
        <SidebarTrigger />
        <Separator orientation="vertical" className="!h-6" />
        <h1 className="text-sm font-semibold text-muted-foreground">{description}</h1>
      </div>
      
      <div className="flex flex-col gap-5">
        {children}
      </div>
    </div>
  );
}