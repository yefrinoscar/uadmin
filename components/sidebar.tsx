"use client"
import { MessageSquareDot, BadgePercent, Calculator  } from "lucide-react"
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import Image from "next/image"
import { NavUser } from "./nav-user"
import { usePathname } from "next/navigation"

const menu = [
  {
    name: 'Pedidos',
    url: '',
    icon: MessageSquareDot,
    path: '/dashboard/requests',
    disabled: false
  },
  {
    name: 'Promociones',
    url: '',
    icon: BadgePercent,
    path: '/dashboard/promotions',
    disabled: false
  },
  {
    name: 'Calculadora',
    url: '',
    icon: Calculator,
    path: '/dashboard/calculator',
    disabled: false
  }
]

export function Sidebar({ user }: {
  user: {
    name: string,
    email: string,
    avatar: string
  }
}) {
  const pathname = usePathname();
  console.log(pathname);


  return (
    <ShadcnSidebar className="border-r border-primary/10 disabled:pointer-events-none">
      <SidebarHeader>
        <NavUser user={user} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tienda</SidebarGroupLabel>
          <SidebarMenu>
            {menu.map((item) => (
              <SidebarMenuItem key={item.name} >
                <SidebarMenuButton asChild isActive={pathname === item.path} aria-disabled={item.disabled}>
                  <a href={item.path}>
                    <item.icon />
                    <span>{item.name}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 px-4 py-2">
          <Image
            className='w-9'
            alt="Logo"
            src="/underla_logo.svg"
            width={200}
            height={200}
          />
          <h2 className="text-xl font-bold">Uadmin</h2>
        </div>
      </SidebarFooter>
    </ShadcnSidebar>
  )
}
