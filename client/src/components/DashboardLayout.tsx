import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  BarChart3,
  BookOpen,
  Building2,
  ChevronRight,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  Palette,
  PanelLeft,
  Settings,
  Crown,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const navGroups = [
  {
    label: "",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
      { icon: Library, label: "Media Library", path: "/media-library" },
      { icon: GraduationCap, label: "Courses", path: "/lms/courses" },
      { icon: Users, label: "Members", path: "/lms/members" },
    ],
  },
  {
    label: "Administration",
    adminOnly: true,
    items: [
      { icon: Building2, label: "Organizations", path: "/admin/orgs" },
      { icon: Users, label: "Users", path: "/admin/users" },
      { icon: BarChart3, label: "Analytics", path: "/lms/analytics" },
      { icon: Palette, label: "Branding", path: "/lms/branding" },
      { icon: FileText, label: "Custom Pages", path: "/lms/custom-pages" },
      { icon: Settings, label: "Settings", path: "/admin/settings" },
      { icon: Crown, label: "Platform Admin", path: "/platform-admin", ownerOnly: true },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    const searchParams = new URLSearchParams(window.location.search);
    const errorCode = searchParams.get("error");
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full bg-white/5 backdrop-blur rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center">
              <span className="text-4xl font-bold tracking-tight select-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.03em' }}>
                <span className="text-white">teach</span><span style={{ color: '#189aa1' }}>ific</span><span className="text-white" style={{ fontSize: '0.45em', verticalAlign: 'super', marginLeft: '2px' }}>&#8482;</span>
              </span>
            </div>
            {errorCode === "registration_closed" ? (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-300">
                  <p className="font-semibold mb-1">Registration is currently closed</p>
                  <p className="text-xs text-amber-400/80">New accounts are not being accepted at this time. Please contact the platform administrator to request access.</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center max-w-sm">
                Sign in to access your content library, manage SCORM packages, and track learner progress.
              </p>
            )}
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in to continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const isAdmin = user?.role === "site_admin" || user?.role === "site_owner";
  const isOwner = user?.role === "site_owner";
  const isOrgAdmin = user?.role === "org_admin";

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - left;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const activeItem = navGroups.flatMap((g) => g.items).find((i) => {
    if (i.path === "/") return location === "/";
    return location.startsWith(i.path);
  });

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-border/50" disableTransition={isResizing}>
          {/* Header */}
          <SidebarHeader className="h-16 justify-center border-b border-border/50">
            <div className="flex items-center gap-3 px-2 w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {isCollapsed ? (
                <span className="text-2xl font-bold select-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#189aa1' }}>t</span>
              ) : (
                <span className="text-2xl font-bold tracking-tight select-none pl-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>
                  <span className="text-white">teach</span><span style={{ color: '#189aa1' }}>ific</span><span className="text-white" style={{ fontSize: '0.5em', verticalAlign: 'super', marginLeft: '1px' }}>&#8482;</span>
                </span>
              )}
            </div>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent className="gap-0 py-2">
            {navGroups.map((group) => {
              if (group.adminOnly && !isAdmin) return null;
              return (
                <SidebarGroup key={group.label || "main"} className="py-1">
                  {group.label && (
                    <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1">
                      {group.label}
                    </SidebarGroupLabel>
                  )}
                  <SidebarMenu className="px-2">
                    {group.items.filter((item) => !(item as any).ownerOnly || isOwner).map((item) => {
                      const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path);
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => setLocation(item.path)}
                            tooltip={item.label}
                            className="h-9 transition-all font-normal"
                          >
                            <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                            <span className={isActive ? "font-medium" : ""}>{item.label}</span>
                            {isActive && !isCollapsed && (
                              <ChevronRight className="ml-auto h-3 w-3 text-primary opacity-60" />
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroup>
              );
            })}
          </SidebarContent>
          {/* No footer — profile is in top-right header */}
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Top header bar with profile menu */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg" />}
            <span className="font-medium text-sm text-muted-foreground">
              {activeItem?.label ?? "Teachific™"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Platform Admin button — site owner and site admins only */}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/platform-admin")}
                className={`gap-1.5 text-xs h-8 px-3 ${location.startsWith("/platform-admin") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {!isMobile && "Platform Admin"}
              </Button>
            )}

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-7 w-7 border shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isMobile && (
                    <div className="flex flex-col items-start min-w-0 max-w-[140px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium truncate leading-none">{user?.name || "User"}</span>
                        {(isAdmin || isOrgAdmin) && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 shrink-0">
                            {isOwner ? "Owner" : user?.role === "site_admin" ? "Admin" : "Org Admin"}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate mt-0.5 w-full">{user?.email || ""}</span>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  {(isAdmin || isOrgAdmin) && (
                    <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0">
                      {isOwner ? "Site Owner" : user?.role === "site_admin" ? "Site Admin" : "Org Admin"}
                    </Badge>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/admin/settings")} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLocation("/platform-admin")} className="cursor-pointer">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Platform Admin
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 min-h-[calc(100vh-3.5rem)]">{children}</main>
      </SidebarInset>
    </>
  );
}
