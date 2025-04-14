"use client"
import { ChevronRight } from "lucide-react"
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
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import Image from "next/image"
import { NavUser } from "./nav-user"
import { usePathname } from "next/navigation"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible"
import { menu } from '@/config/menu'

export function Sidebar({ user }: {
  user: {
    name: string,
    email: string,
    avatar: string
  }
}) {
  const pathname = usePathname();

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
              item.childs && item.childs.length > 0 ?
                <Collapsible key={item.name} asChild defaultOpen className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.name}>
                        {item.icon && <item.icon />}
                        <span>{item.name}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {
                          item.childs.map((child) => (
                            <SidebarMenuSubItem key={child.name} >
                              <SidebarMenuButton asChild isActive={pathname === child.path} aria-disabled={item.disabled}>
                                <a href={child.path}>
                                  <child.icon />
                                  <span>{child.name}</span>
                                </a>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          ))
                        }
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
                :
                <SidebarMenuItem key={item.name} >
                  <SidebarMenuButton asChild isActive={pathname === item.path} aria-disabled={item.disabled}>
                    <a href={item.path}>
                      <item.icon />
                      <span>{item.name} </span>
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
