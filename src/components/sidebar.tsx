import { useMetricsStore } from "@/store";
// import { Separator } from "@radix-ui/react-select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  ChevronRight,
  Gpu,
  Layers,
  LucideSettings2,
  Orbit,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { logo } from "./icons";

export function AppSidebar({ title }: { title: string }) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(["Layers"]));
  const location = useLocation();

  // ZUSTAND MAGIC: Auto-updates when layers appear in the backend
  const layerCount = useMetricsStore((s) => Object.keys(s.layers).length);

  // Generate the layer links dynamically
  const layerLinks = Array.from({ length: layerCount }, (_, i) => ({
    title: `Layer ${i}`,
    url: `/layers/${i}`,
  }));

  const menuItems = [
    { title: "Overview", url: "/", icon: Orbit },
    {
      title: "Layers",
      url: "/layers",
      icon: Layers,
      children: layerLinks.length > 0 ? layerLinks : undefined,
    },
    { title: "Compute", url: "/compute", icon: Gpu },
    { title: "Config", url: "/config", icon: LucideSettings2 },
  ];

  // Helper to toggle collapsible
  const toggleItem = (title: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(title)) newSet.delete(title);
      else newSet.add(title);
      return newSet;
    });
  };

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
            <div key={item.title}>
              {item.children ? (
                <Collapsible
                  open={openItems.has(item.title)}
                  onOpenChange={() => toggleItem(item.title)}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="p-4.5 font-normal">
                        <item.icon />
                        <span>{item.title}</span>
                        <ChevronRight
                          className={`ml-auto transition-transform duration-200 ${
                            openItems.has(item.title) ? "rotate-90" : ""
                          }`}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent className="pl-2.5">
                    <SidebarMenuSub>
                      {item.children.map((child) => (
                        <SidebarMenuSubItem key={child.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location.pathname === child.url} // Auto-highlight
                          >
                            <Link to={child.url}>
                              <span>{child.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <SidebarMenuItem>
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
              )}
            </div>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </Sidebar>
  );
}
