import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import Dashboard from "./pages/Dashboard";
import FilesPage from "./pages/FilesPage";
import UploadPage from "./pages/UploadPage";
import MediaLibraryPage from "./pages/MediaLibraryPage";
import FileDetailPage from "./pages/FileDetailPage";
import PlayerPage from "./pages/PlayerPage";
import EmbedPage from "./pages/EmbedPage";
import QuizzesPage from "./pages/QuizzesPage";
import QuizBuilderPage from "./pages/QuizBuilderPage";
import QuizPlayerPage from "./pages/QuizPlayerPage";
import QuizResultsPage from "./pages/QuizResultsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AdminOrgsPage from "./pages/admin/AdminOrgsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminPermissionsPage from "./pages/admin/AdminPermissionsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import PlatformAdminPage from "./pages/admin/PlatformAdminPage";
// LMS pages
import CoursesPage from "./pages/lms/CoursesPage";
import CourseBuilderPage from "./pages/lms/CourseBuilderPage";
import BrandingPage from "./pages/lms/BrandingPage";
import MembersPage from "./pages/lms/MembersPage";
import LmsAnalyticsPage from "./pages/lms/LmsAnalyticsPage";
import PageBuilderPage from "./pages/lms/PageBuilderPage";
import SchoolPage from "./pages/lms/SchoolPage";
import CourseSalesPage from "./pages/lms/CourseSalesPage";
import CoursePlayerPage from "./pages/lms/CoursePlayerPage";
import CustomPagesPage from "./pages/admin/CustomPagesPage";
// Bare routes (no admin sidebar) — used for share links and external embedss
function BareRouter() {
  return (
    <Switch>
      <Route path="/embed/:id" component={EmbedPage} />
      <Route path="/learn/:courseId" component={CoursePlayerPage} />
      <Route path="/learn/:courseId/lesson/:lessonId" component={CoursePlayerPage} />
    </Switch>
  );
}

// Admin shell routes
function AdminRouter() {
  return (
    <DashboardLayout>
      <Switch>
        {/* Main */}
        <Route path="/" component={Dashboard} />
        <Route path="/media-library" component={MediaLibraryPage} />
        {/* Legacy routes — redirect to media library with correct tab */}
        <Route path="/upload">{() => { window.location.replace("/media-library#upload"); return null; }}</Route>
        <Route path="/files">{() => { window.location.replace("/media-library#files"); return null; }}</Route>
        <Route path="/files/:id" component={FileDetailPage} />
        <Route path="/quizzes">{() => { window.location.replace("/media-library#quizzes"); return null; }}</Route>
        <Route path="/play/:id" component={PlayerPage} />

        {/* Quiz sub-routes (builder/player/results) — still accessible directly */}
        <Route path="/quizzes/new" component={QuizBuilderPage} />
        <Route path="/quizzes/:id/edit" component={QuizBuilderPage} />
        <Route path="/quizzes/:id/play" component={QuizPlayerPage} />
        <Route path="/quizzes/:id/results/:attemptId" component={QuizResultsPage} />

        {/* Analytics */}
        <Route path="/analytics" component={AnalyticsPage} />

        {/* LMS */}
        <Route path="/lms/courses" component={CoursesPage} />
        <Route path="/lms/courses/new" component={CourseBuilderPage} />
        <Route path="/lms/courses/:id" component={CourseBuilderPage} />
        <Route path="/lms/members" component={MembersPage} />
        <Route path="/lms/analytics" component={LmsAnalyticsPage} />
        <Route path="/lms/branding" component={BrandingPage} />
        <Route path="/lms/page-builder/:pageId" component={PageBuilderPage} />
        <Route path="/lms/courses/:courseId/page-builder" component={PageBuilderPage} />
        <Route path="/lms/custom-pages" component={CustomPagesPage} />
        {/* Student storefront */}
        <Route path="/school" component={SchoolPage} />
        <Route path="/school/courses/:courseId" component={CourseSalesPage} />
        {/* Course player */}
        <Route path="/learn/:courseId" component={CoursePlayerPage} />
        <Route path="/learn/:courseId/lesson/:lessonId" component={CoursePlayerPage} />
        {/* Admin */}
        <Route path="/admin/orgs" component={AdminOrgsPage} />
        <Route path="/admin/users" component={AdminUsersPage} />
        <Route path="/admin/permissions" component={AdminPermissionsPage} />
        <Route path="/admin/settings" component={AdminSettingsPage} />
        <Route path="/platform-admin" component={PlatformAdminPage} />

        {/* 404 */}
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  // Check if current path is a bare route (embed/share/learn)
  const path = window.location.pathname;
  if (path.startsWith("/embed/") || path.startsWith("/learn/")) {
    return <BareRouter />;
  }
  return <AdminRouter />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
