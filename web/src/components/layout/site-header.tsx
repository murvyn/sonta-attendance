"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

function generateBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbSegment[] = [];

  // Always start with Dashboard
  breadcrumbs.push({ label: "Dashboard", href: "/dashboard" });

  // Map path segments to readable labels
  const labelMap: Record<string, string> = {
    "sonta-heads": "Sonta Heads",
    meetings: "Meetings",
    analytics: "Analytics",
    admins: "Admin Users",
    settings: "Settings",
    profile: "Profile",
  };

  // Skip 'dashboard' as we already added it
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    const isLast = i === segments.length - 1;
    const label =
      labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

    if (isLast) {
      // Last segment is the current page (no link)
      breadcrumbs.push({ label });
    } else {
      // Intermediate segments get links
      const href = "/" + segments.slice(0, i + 1).join("/");
      breadcrumbs.push({ label, href });
    }
  }

  return breadcrumbs;
}

export function SiteHeader() {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 bg-card/80 backdrop-blur-xl supports-backdrop-filter:bg-card/60 shadow-soft px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <span key={crumb.label} className="flex items-center gap-2">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="font-semibold">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href={crumb.href!}
                      className="font-medium hover:text-primary transition-smooth"
                    >
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
