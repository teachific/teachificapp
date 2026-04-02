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
import DigitalProductsPage from "./pages/admin/DigitalProductsPage";
import DigitalProductEditorPage from "./pages/admin/DigitalProductEditorPage";
import DigitalProductSalesPage from "./pages/DigitalProductSalesPage";
import WebinarsPage from "./pages/admin/WebinarsPage";
import WebinarEditorPage from "./pages/admin/WebinarEditorPage";
import WebinarRegisterPage from "./pages/WebinarRegisterPage";
import WebinarWatchPage from "./pages/WebinarWatchPage";
import OrgSettingsPage from "./pages/OrgSettingsPage";
import StudentLogReportsPage from "./pages/lms/StudentLogReportsPage";
import PublicPagePage from "./pages/PublicPagePage";
// Auth pages (Teachific-branded, no sidebar)
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";

// Auth paths that render without the dashboard shell
const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

// Bare routes — no admin sidebar (share links, embeds, auth pages, student player)
function BareRouter() {
  return (
    <Switch>
      {/* Embeds & player */}
      <Route path="/embed/:id" component={EmbedPage} />
      <Route path="/learn/:courseId" component={CoursePlayerPage} />
      <Route path="/learn/:courseId/lesson/:lessonId" component={CoursePlayerPage} />
      {/* Public custom pages (no sidebar) */}
      <Route path="/p/:slug" component={PublicPagePage} />
      {/* Public webinar pages */}
      <Route path="/webinar/:slug/register" component={WebinarRegisterPage} />
      <Route path="/webinar/:slug/watch" component={WebinarWatchPage} />
      {/* Public digital product sales pages */}
      <Route path="/shop/:slug" component={DigitalProductSalesPage} />
      {/* Teachific-branded auth */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
    </Switch>
  );
}

// Admin shell routes — wrapped in DashboardLayout
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

        {/* Quiz sub-routes */}
        <Route path="/quizzes/new" component={QuizBuilderPage} />
        <Route path="/quizzes/:id/edit" component={QuizBuilderPage} />
        <Route path="/quizzes/:id/play" component={QuizPlayerPage} />
        <Route path="/quizzes/:id/results/:attemptId" component={QuizResultsPage} />

        {/* Analytics */}
        <Route path="/analytics" component={AnalyticsPage} />

        {/* LMS */}
        <Route path="/lms/courses" component={CoursesPage} />
        <Route path="/lms/courses/new" component={CourseBuilderPage} />
        <Route path="/lms/courses/:id/curriculum" component={CourseBuilderPage} />
        <Route path="/lms/courses/:id/settings" component={CourseBuilderPage} />
        <Route path="/lms/courses/:id/pricing" component={CourseBuilderPage} />
        <Route path="/lms/courses/:id/drip" component={CourseBuilderPage} />
        <Route path="/lms/courses/:id/after_purchase" component={CourseBuilderPage} />
        <Route path="/lms/courses/:id" component={CourseBuilderPage} />
        <Route path="/lms/members" component={MembersPage} />
        <Route path="/lms/analytics" component={LmsAnalyticsPage} />
        <Route path="/lms/branding" component={BrandingPage} />
        <Route path="/lms/page-builder/:pageId" component={PageBuilderPage} />
        <Route path="/lms/courses/:courseId/page-builder" component={PageBuilderPage} />
        <Route path="/lms/custom-pages" component={CustomPagesPage} />
        <Route path="/lms/settings" component={OrgSettingsPage} />
        <Route path="/lms/activity" component={StudentLogReportsPage} />

        {/* Student storefront */}
        <Route path="/school" component={SchoolPage} />
        <Route path="/school/courses/:courseId" component={CourseSalesPage} />

        {/* Course player (inside dashboard shell for authenticated users) */}
        <Route path="/learn/:courseId" component={CoursePlayerPage} />
        <Route path="/learn/:courseId/lesson/:lessonId" component={CoursePlayerPage} />

        {/* Digital Downloads */}
        <Route path="/admin/downloads" component={DigitalProductsPage} />
        <Route path="/admin/downloads/new" component={DigitalProductEditorPage} />
        <Route path="/admin/downloads/:id" component={DigitalProductEditorPage} />

        {/* Webinars */}
        <Route path="/lms/webinars" component={WebinarsPage} />
        <Route path="/lms/webinars/:id/edit" component={WebinarEditorPage} />

        {/* Platform admin */}
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
  const path = window.location.pathname;
  const isBare =
    path.startsWith("/embed/") ||
    path.startsWith("/learn/") ||
    path.startsWith("/p/") ||
    path.startsWith("/webinar/") ||
    path.startsWith("/shop/") ||
    AUTH_PATHS.some((p) => path === p || path.startsWith(p + "?"));
  return isBare ? <BareRouter /> : <AdminRouter />;
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
