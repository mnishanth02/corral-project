import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import { cn } from "../lib/utils";

function Sidebar({ className, ...props }: React.ComponentProps<"aside">) {
  return (
    <aside
      data-slot="sidebar"
      className={cn(
        "flex min-h-svh w-64 shrink-0 flex-col border-sidebar-border border-r bg-sidebar text-sidebar-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn(
        "flex min-h-16 items-center gap-3 border-sidebar-border border-b px-4",
        className,
      )}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn("flex flex-1 flex-col gap-4 p-3", className)}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="sidebar-group" className={cn("flex flex-col gap-1", className)} {...props} />
  );
}

function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-label"
      className={cn(
        "px-2 py-1.5 font-medium text-sidebar-foreground/70 text-xs uppercase tracking-wide",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul data-slot="sidebar-menu" className={cn("flex flex-col gap-1", className)} {...props} />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-item" className={cn("list-none", className)} {...props} />;
}

function SidebarItem({
  className,
  active,
  asChild,
  ...props
}: React.ComponentProps<"a"> & { active?: boolean; asChild?: boolean }) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      data-slot="sidebar-item"
      data-active={active}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-9 items-center gap-2 rounded-md px-3 py-2 font-medium text-sidebar-foreground text-sm outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/50 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("mt-auto border-sidebar-border border-t p-3", className)}
      {...props}
    />
  );
}

function SidebarRail({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="sidebar-rail" className={cn("w-px bg-sidebar-border", className)} {...props} />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarItem,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
};
