// import { Separator } from "@radix-ui/react-select";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Gauge,
  Gpu,
  Layers,
  LucideSettings2,
  Orbit,
} from "lucide-react";

import { Link, useLocation } from "react-router-dom";
import { logo } from "./icons";

export function AppSidebar({ title }: { title: string }) {
  const location = useLocation();
  const menuItems = [
    { title: "Overview", url: "/", icon: Orbit },
    { title: "Layers", url: "/layers", icon: Layers },
    { title: "Optimizer", url: "/optimizer", icon: Gauge },
    { title: "Compute", url: "/compute", icon: Gpu },
    { title: "Config", url: "/config", icon: LucideSettings2 },
  ];
  return (
    <Sidebar variant="floating">
      <SidebarHeader className="text-left ml-2 mt-1 text-2xl">
        <div className="flex items-center">
          <div className="w-[1em] h-[1em]">{logo}</div>
          <span className="ml-1 font-light">{title}</span>
        </div>
        <Separator className="bg-border h-0.5" />
      </SidebarHeader>
      <SidebarGroupContent>
      <SidebarMenu className="px-2">
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              className="p-4.5 font-normal"
              asChild
              isActive={location.pathname === item.url}
            >
              <Link to={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      </SidebarGroupContent>
    </Sidebar>
  );
}
