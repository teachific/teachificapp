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
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Mail,
  Palette,
  PanelLeft,
  Settings,
  ShieldCheck,
  Tag,
  User,
  UserCog,
  Users,
  Video,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

// ─── Nav definition ──────────────────────────────────────────────────────────
// Items can have sub-items for accordion expansion.
// adminOnly: true  → only site_admin / site_owner see this
// ownerOnly: true  → only site_owner sees this
type NavSubItem = { label: string; path: string };
type NavItem = {
  icon: React.ElementType;
  label: string;
  path: string;
  ownerOnly?: boolean;
  adminOnly?: boolean;
  subItems?: NavSubItem[];
};
type NavGroup = {
  label?: string;
  dividerBefore?: boolean;
  adminOnly?: boolean;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/lms" },
      { icon: FolderOpen, label: "Media Library", path: "/media-library" },
    ],
  },
  {
    dividerBefore: true,
    items: [
      {
        icon: GraduationCap,
        label: "Courses",
        path: "/lms/courses",
        subItems: [
          { label: "All Courses", path: "/lms/courses" },
          { label: "Course Builder", path: "/lms/courses" },
          { label: "Certificates", path: "/lms/courses" },
          { label: "Coupons", path: "/lms/courses" },
        ],
      },
      { icon: Download, label: "Digital Downloads", path: "/admin/downloads" },
      { icon: Video, label: "Webinars", path: "/lms/webinars" },
    ],
  },
  {
    dividerBefore: true,
    items: [
      { icon: Users, label: "Members", path: "/lms/members" },
    ],
  },
  {
    label: "Administration",
    dividerBefore: true,
    adminOnly: true,
    items: [
      { icon: Building2, label: "Organizations", path: "/admin/orgs" },
      {
        icon: UserCog,
        label: "Users",
        path: "/admin/users",
        adminOnly: true,
        subItems: [
          { label: "All Users", path: "/admin/users" },
          { label: "Roles & Permissions", path: "/admin/users" },
          { label: "Invitations", path: "/admin/users" },
        ],
      },
      {
        icon: BarChart3,
        label: "Analytics",
        path: "/lms/analytics",
        subItems: [
          { label: "Overview", path: "/lms/analytics" },
          { label: "Activity Log", path: "/lms/activity" },
          { label: "Downloads Reports", path: "/admin/downloads/reports" },
          { label: "Webinar Reports", path: "/lms/webinars/reports" },
        ],
      },
    ],
  },
  {
    adminOnly: true,
    items: [
      { icon: Palette, label: "Branding", path: "/lms/branding" },
      { icon: FileText, label: "Custom Pages", path: "/lms/custom-pages" },
      { icon: Mail, label: "Email Marketing", path: "/lms/email-marketing" },
      {
        icon: Settings,
        label: "Settings",
        path: "/lms/settings",
        subItems: [
          { label: "General", path: "/lms/settings" },
          { label: "Learning Content", path: "/lms/settings" },
          { label: "Payments", path: "/lms/settings" },
          { label: "Integrations", path: "/lms/settings" },
          { label: "Code & Analytics", path: "/lms/settings" },
        ],
      },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 272;
const MIN_WIDTH = 220;
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
                <span className="text-white">teach</span><span style={{ color: '#15a4b7' }}>ific</span><span className="text-white" style={{ fontSize: '0.45em', verticalAlign: 'super', marginLeft: '2px' }}>&#8482;</span>
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

  // Track which accordion groups are open (by item path)
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    // Auto-open the group that contains the current active path
    const initial = new Set<string>();
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.subItems && item.subItems.some((s) => location.startsWith(s.path) && s.path !== item.path)) {
          initial.add(item.path);
        }
      }
    }
    return initial;
  });

  const toggleGroup = (path: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

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

  // Determine the active top-level item for the header breadcrumb
  const allItems = navGroups.flatMap((g) => g.items);
  const activeItem = allItems.find((i) => {
    if (i.path === "/lms") return location === "/lms" || location === "/";
    return location.startsWith(i.path) && i.path !== "/lms";
  }) ?? allItems.find((i) => i.path === "/lms");

  const isItemActive = (item: NavItem) => {
    if (item.path === "/lms") return location === "/lms" || location === "/";
    return location.startsWith(item.path);
  };

  const isSubItemActive = (sub: NavSubItem) => location === sub.path || (sub.path !== "/" && location.startsWith(sub.path));

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-border/40" disableTransition={isResizing}>
          {/* Header */}
          <SidebarHeader className="h-16 justify-center border-b border-border/40 px-3">
            <div className="flex items-center gap-2.5 w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-sidebar-foreground/50" />
              </button>
              {!isCollapsed && (
                <span className="text-[22px] font-bold tracking-tight select-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>
                  <span className="text-sidebar-foreground">teach</span>
                  <span style={{ color: '#15a4b7' }}>ific</span>
                  <span className="text-sidebar-foreground" style={{ fontSize: '0.45em', verticalAlign: 'super', marginLeft: '1px' }}>&#8482;</span>
                </span>
              )}
              {isCollapsed && (
                <span className="text-[22px] font-bold select-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#15a4b7' }}>t</span>
              )}
            </div>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent className="py-3 px-0 overflow-y-auto">
            {navGroups.map((group, groupIdx) => {
              if (group.adminOnly && !isAdmin) return null;
              return (
                <div key={groupIdx}>
                  {/* Divider + optional section label */}
                  {group.dividerBefore && (
                    <div className="mx-3 my-2 border-t border-border/30" />
                  )}
                  {group.label && !isCollapsed && (
                    <div className="px-4 pt-1 pb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 select-none">
                        {group.label}
                      </span>
                    </div>
                  )}

                  {/* Items */}
                  <div className="px-2 space-y-0.5">
                    {group.items
                      .filter((item) => {
                        if (item.ownerOnly && !isOwner) return false;
                        if (item.adminOnly && !isAdmin) return false;
                        return true;
                      })
                      .map((item) => {
                        const active = isItemActive(item);
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        const isOpen = openGroups.has(item.path);

                        return (
                          <div key={item.path}>
                            {/* Top-level nav item */}
                            <button
                              onClick={() => {
                                if (hasSubItems && !isCollapsed) {
                                  toggleGroup(item.path);
                                } else {
                                  setLocation(item.path);
                                }
                              }}
                              title={isCollapsed ? item.label : undefined}
                              className={`
                                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group
                                ${active
                                  ? "bg-primary text-primary-foreground font-medium shadow-sm"
                                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                }
                                ${isCollapsed ? "justify-center px-2" : ""}
                              `}
                            >
                              <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"}`} />
                              {!isCollapsed && (
                                <>
                                  <span className="flex-1 text-left leading-none">{item.label}</span>
                                  {hasSubItems ? (
                                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"} ${active ? "text-primary-foreground/70" : "text-sidebar-foreground/40"}`} />
                                  ) : active ? (
                                    <ChevronRight className="h-3 w-3 shrink-0 opacity-60 text-primary-foreground" />
                                  ) : null}
                                </>
                              )}
                            </button>

                            {/* Sub-items (accordion) */}
                            {hasSubItems && !isCollapsed && isOpen && (
                              <div className="ml-4 mt-0.5 mb-1 pl-3 border-l-2 border-primary/30 space-y-0.5">
                                {item.subItems!.map((sub) => {
                                  const subActive = isSubItemActive(sub);
                                  return (
                                    <button
                                      key={sub.path + sub.label}
                                      onClick={() => setLocation(sub.path)}
                                      className={`
                                        w-full text-left px-2 py-1.5 rounded-md text-[13px] transition-all duration-150
                                        ${subActive
                                          ? "text-primary font-medium bg-primary/8"
                                          : "text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                                        }
                                      `}
                                    >
                                      {sub.label}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </SidebarContent>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Top header bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg" />}
            {activeItem ? (
              <div className="flex items-center gap-2">
                <activeItem.icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">{activeItem.label}</span>
              </div>
            ) : (
              <span className="text-xl font-bold tracking-tight select-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>
                <span className="text-foreground">teach</span><span style={{ color: '#15a4b7' }}>ific</span><span className="text-foreground" style={{ fontSize: '0.45em', verticalAlign: 'super', marginLeft: '2px' }}>&#8482;</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
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
                    <div className="hidden sm:flex flex-col items-start min-w-0 max-w-[140px]">
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
                <DropdownMenuItem onClick={() => setLocation("/lms/settings")} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Organization Settings
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
