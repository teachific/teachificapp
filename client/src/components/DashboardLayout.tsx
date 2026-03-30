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
  SidebarFooter,
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
  FileArchive,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Settings,
  Shield,
  Upload,
  Users,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const navGroups = [
  {
    label: "Content",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
      { icon: Upload, label: "Upload Content", path: "/upload" },
      { icon: FileArchive, label: "My Files", path: "/files" },
      { icon: BookOpen, label: "Quizzes", path: "/quizzes" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { icon: BarChart3, label: "Analytics", path: "/analytics" },
    ],
  },
  {
    label: "Administration",
    adminOnly: true,
    items: [
      { icon: Building2, label: "Organizations", path: "/admin/orgs" },
      { icon: Users, label: "Users", path: "/admin/users" },
      { icon: Shield, label: "Permissions", path: "/admin/permissions" },
      { icon: Settings, label: "Settings", path: "/admin/settings" },
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full bg-white/5 backdrop-blur rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <FileArchive className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-center text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Teachific&#8482;
            </h1>
            <p className="text-sm text-slate-400 text-center max-w-sm">
              Sign in to access your content library, manage SCORM packages, and track learner progress.
            </p>
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
  const isAdmin = user?.role === "admin" || user?.role === "site_owner";

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
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-6 w-6 rounded bg-primary flex items-center justify-center shrink-0">
                    <FileArchive className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <span className="font-bold tracking-tight truncate text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Teachific&#8482;</span>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent className="gap-0 py-2">
            {navGroups.map((group) => {
              if (group.adminOnly && !isAdmin) return null;
              return (
                <SidebarGroup key={group.label} className="py-1">
                  {!isCollapsed && (
                    <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1">
                      {group.label}
                    </SidebarGroupLabel>
                  )}
                  <SidebarMenu className="px-2">
                    {group.items.map((item) => {
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

          {/* Footer */}
          <SidebarFooter className="p-3 border-t border-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 border shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium truncate leading-none">{user?.name || "User"}</p>
                        {isAdmin && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 shrink-0">
                            {user?.role === "site_owner" ? "Owner" : "Admin"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">{user?.email || ""}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/admin/settings")} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <span className="font-medium text-sm">{activeItem?.label ?? "Teachific™"}</span>
            </div>
          </div>
        )}
        <main className="flex-1 min-h-screen">{children}</main>
      </SidebarInset>
    </>
  );
}
