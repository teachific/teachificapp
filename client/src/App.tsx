import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Core pages
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
import SchoolMyCoursesPage from "./pages/lms/SchoolMyCoursesPage";
import FormsPage from "./pages/lms/FormsPage";
import FormBuilderPage from "./pages/lms/FormBuilderPage";
import FormResponsesPage from "./pages/lms/FormResponsesPage";
import FormAnalyticsPage from "./pages/lms/FormAnalyticsPage";
import FormPlayerPage from "./pages/FormPlayerPage";
import CourseSalesPage from "./pages/lms/CourseSalesPage";
import CoursePlayerPage from "./pages/lms/CoursePlayerPage";
import CourseOverviewPage from "./pages/lms/CourseOverviewPage";
import OrgPoliciesPage from "./pages/OrgPoliciesPage";
import CustomPagesPage from "./pages/admin/CustomPagesPage";
import DigitalProductsPage from "./pages/admin/DigitalProductsPage";
import DigitalProductEditorPage from "./pages/admin/DigitalProductEditorPage";
import DigitalProductSalesPage from "./pages/DigitalProductSalesPage";
import DigitalDownloadsReportsPage from "./pages/admin/DigitalDownloadsReportsPage";
import WebinarsPage from "./pages/admin/WebinarsPage";
import WebinarEditorPage from "./pages/admin/WebinarEditorPage";
import WebinarReportsPage from "./pages/admin/WebinarReportsPage";
import WebinarRegisterPage from "./pages/WebinarRegisterPage";
import WebinarWatchPage from "./pages/WebinarWatchPage";
import OrgSettingsPage from "./pages/OrgSettingsPage";
import StudentLogReportsPage from "./pages/lms/StudentLogReportsPage";
import LmsDashboardPage from "./pages/lms/LmsDashboardPage";
import MyCoursesPage from "./pages/lms/MyCoursesPage";
import EmailMarketingPage from "./pages/lms/EmailMarketingPage";
import PublicPagePage from "./pages/PublicPagePage";

// Members section
import GroupsPage from "./pages/members/GroupsPage";
import GroupManagerPortalPage from "./pages/members/GroupManagerPortalPage";
import MemberCertificatesPage from "./pages/members/MemberCertificatesPage";
import DiscussionsPage from "./pages/members/DiscussionsPage";
import AssignmentsPage from "./pages/members/AssignmentsPage";

// Products section
import MembershipsPage from "./pages/products/MembershipsPage";
import BundlesPage from "./pages/products/BundlesPage";
import CommunityPage from "./pages/products/CommunityPage";
import CommunityLearnerPage from "./pages/lms/CommunityLearnerPage";
import CommunityManagePage from "./pages/products/CommunityManagePage";
import CategoriesPage from "./pages/products/CategoriesPage";
import RecordPage from "./pages/RecordPage";

// Marketing section
import WebsitePage from "./pages/marketing/WebsitePage";
import EmailCampaignsPage from "./pages/marketing/EmailCampaignsPage";
import FunnelsPage from "./pages/marketing/FunnelsPage";
import AffiliatesPage from "./pages/marketing/AffiliatesPage";

// Sales section
import OrdersPage from "./pages/sales/OrdersPage";
import SubscriptionsPage from "./pages/sales/SubscriptionsPage";
import GroupOrdersPage from "./pages/sales/GroupOrdersPage";
import CouponsPage from "./pages/sales/CouponsPage";
import InvoicesPage from "./pages/sales/InvoicesPage";
import RevenuePartnersPage from "./pages/sales/RevenuePartnersPage";

// Analytics section
import RevenueAnalyticsPage from "./pages/analytics/RevenueAnalyticsPage";
import EngagementAnalyticsPage from "./pages/analytics/EngagementAnalyticsPage";
import MarketingAnalyticsPage from "./pages/analytics/MarketingAnalyticsPage";
import CustomReportsPage from "./pages/analytics/CustomReportsPage";

// Integrations section
import IntegrationsPage from "./pages/integrations/IntegrationsPage";
import ApiPage from "./pages/integrations/ApiPage";
import WebhooksPage from "./pages/integrations/WebhooksPage";

// Profile section
import ProfilePage from "./pages/profile/ProfilePage";
import BillingPage from "./pages/profile/BillingPage";

// Auth pages (no sidebar)
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
      <Route path="/embed/:id" component={EmbedPage} />
      <Route path="/learn/:courseId/overview" component={CourseOverviewPage} />
      <Route path="/learn/:courseId" component={CoursePlayerPage} />
      <Route path="/learn/:courseId/lesson/:lessonId" component={CoursePlayerPage} />
      <Route path="/p/:slug" component={PublicPagePage} />
      <Route path="/webinar/:slug/register" component={WebinarRegisterPage} />
      <Route path="/webinar/:slug/watch" component={WebinarWatchPage} />
      <Route path="/shop/:slug" component={DigitalProductSalesPage} />
      <Route path="/forms/:orgSlug/:slug" component={FormPlayerPage} />
      <Route path="/forms/:slug" component={FormPlayerPage} />
      <Route path="/school" component={SchoolPage} />
      <Route path="/school/:orgSlug" component={SchoolPage} />
      <Route path="/school/courses/:courseId" component={CourseSalesPage} />
      <Route path="/school/:orgSlug/courses/:courseId" component={CourseSalesPage} />
      {/* Member portal routes — require auth, show member sidebar */}
      <Route path="/school/:orgSlug/my-courses" component={SchoolMyCoursesPage} />
      <Route path="/school/my-courses" component={SchoolMyCoursesPage} />
      <Route path="/community/:hubId" component={CommunityLearnerPage} />
      <Route path="/policies/:orgSlug" component={OrgPoliciesPage} />
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
        {/* Root → Dashboard */}
        <Route path="/">{() => { window.location.replace("/lms"); return null; }}</Route>

        {/* Dashboard */}
        <Route path="/lms" component={LmsDashboardPage} />
        <Route path="/lms/dashboard" component={LmsDashboardPage} />

        {/* ── Members ── */}
        <Route path="/members/users" component={MembersPage} />
        <Route path="/members/groups" component={GroupsPage} />
        <Route path="/members/group-manager" component={GroupManagerPortalPage} />
        <Route path="/members/certificates" component={MemberCertificatesPage} />
        <Route path="/members/discussions" component={DiscussionsPage} />
        <Route path="/members/assignments" component={AssignmentsPage} />
        {/* Legacy /lms/members redirect */}
        <Route path="/lms/members">{() => { window.location.replace("/members/users"); return null; }}</Route>

        {/* ── Products ── */}
        <Route path="/lms/courses" component={CoursesPage} />
        <Route path="/lms/courses/new" component={CourseBuilderPage} />
        <Route path="/lms/courses/:id/curriculum" component={CourseBuilderPage} />
        <Route path="/lms/courses/:id/settings" component={CourseBuilderPage} />
        <Route path="/lms/courses/:id/pricing" component={CourseBuilderPage} />
        <Route path="/lms/courses/:id/drip" component={CourseBuilderPage} />
        <Route path="/lms/courses/:id/after_purchase" component={CourseBuilderPage} />
        <Route path="/lms/courses/:id" component={CourseBuilderPage} />
        <Route path="/admin/downloads" component={DigitalProductsPage} />
        <Route path="/admin/downloads/reports" component={DigitalDownloadsReportsPage} />
        <Route path="/admin/downloads/new" component={DigitalProductEditorPage} />
        <Route path="/admin/downloads/:id" component={DigitalProductEditorPage} />
        <Route path="/lms/webinars" component={WebinarsPage} />
        <Route path="/lms/webinars/reports" component={WebinarReportsPage} />
        <Route path="/lms/webinars/:id/edit" component={WebinarEditorPage} />
        <Route path="/products/memberships" component={MembershipsPage} />
        <Route path="/products/bundles" component={BundlesPage} />
        <Route path="/lms/forms" component={FormsPage} />
        <Route path="/lms/forms/:id/responses" component={FormResponsesPage} />
        <Route path="/lms/forms/:id/analytics" component={FormAnalyticsPage} />
        <Route path="/lms/forms/:id" component={FormBuilderPage} />
        <Route path="/products/community" component={CommunityPage} />
        <Route path="/products/community/:hubId/manage" component={CommunityManagePage} />
        <Route path="/products/categories" component={CategoriesPage} />
        <Route path="/media-library" component={MediaLibraryPage} />
        <Route path="/record" component={RecordPage} />

        {/* ── Marketing ── */}
        <Route path="/marketing/website" component={WebsitePage} />
        <Route path="/marketing/email" component={EmailCampaignsPage} />
        <Route path="/marketing/funnels" component={FunnelsPage} />
        <Route path="/marketing/affiliates" component={AffiliatesPage} />
        {/* Legacy email marketing redirect */}
        <Route path="/lms/email-marketing">{() => { window.location.replace("/marketing/email"); return null; }}</Route>

        {/* ── Sales ── */}
        <Route path="/sales/orders" component={OrdersPage} />
        <Route path="/sales/subscriptions" component={SubscriptionsPage} />
        <Route path="/sales/group-orders" component={GroupOrdersPage} />
        <Route path="/sales/coupons" component={CouponsPage} />
        <Route path="/sales/invoices" component={InvoicesPage} />
        <Route path="/sales/revenue-partners" component={RevenuePartnersPage} />

        {/* ── Analytics ── */}
        <Route path="/analytics/revenue" component={RevenueAnalyticsPage} />
        <Route path="/analytics/engagement" component={EngagementAnalyticsPage} />
        <Route path="/analytics/marketing" component={MarketingAnalyticsPage} />
        <Route path="/analytics/custom-reports" component={CustomReportsPage} />
        <Route path="/analytics-hub" component={RevenueAnalyticsPage} />
        {/* Legacy analytics redirects */}
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/lms/analytics" component={LmsAnalyticsPage} />
        <Route path="/lms/activity" component={StudentLogReportsPage} />

        {/* ── Integrations ── */}
        <Route path="/integrations" component={IntegrationsPage} />
        <Route path="/integrations/api" component={ApiPage} />
        <Route path="/integrations/webhooks" component={WebhooksPage} />

        {/* ── Profile ── */}
        <Route path="/profile" component={ProfilePage} />
        <Route path="/billing" component={BillingPage} />

        {/* ── Platform Admin ── */}
        <Route path="/admin/orgs" component={AdminOrgsPage} />
        <Route path="/admin/users" component={AdminUsersPage} />
        <Route path="/admin/permissions" component={AdminPermissionsPage} />
        <Route path="/admin/settings" component={AdminSettingsPage} />
        <Route path="/platform-admin" component={PlatformAdminPage} />

        {/* ── Misc / Legacy ── */}
        <Route path="/upload">{() => { window.location.replace("/media-library#upload"); return null; }}</Route>
        <Route path="/files">{() => { window.location.replace("/media-library#files"); return null; }}</Route>
        <Route path="/files/:id" component={FileDetailPage} />
        <Route path="/quizzes">{() => { window.location.replace("/media-library#quizzes"); return null; }}</Route>
        <Route path="/play/:id" component={PlayerPage} />
        <Route path="/quizzes/new" component={QuizBuilderPage} />
        <Route path="/quizzes/:id/edit" component={QuizBuilderPage} />
        <Route path="/quizzes/:id/play" component={QuizPlayerPage} />
        <Route path="/quizzes/:id/results/:attemptId" component={QuizResultsPage} />
        <Route path="/lms/my-courses" component={MyCoursesPage} />
        <Route path="/lms/branding" component={BrandingPage} />
        <Route path="/lms/page-builder/:pageId" component={PageBuilderPage} />
        <Route path="/lms/courses/:courseId/page-builder" component={PageBuilderPage} />
        <Route path="/lms/custom-pages" component={CustomPagesPage} />
        <Route path="/lms/settings" component={OrgSettingsPage} />
        <Route path="/learn/:courseId" component={CoursePlayerPage} />
        <Route path="/learn/:courseId/lesson/:lessonId" component={CoursePlayerPage} />

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
    path.startsWith("/school") ||
    path.startsWith("/p/") ||
    path.startsWith("/webinar/") ||
    path.startsWith("/shop/") ||
    path.startsWith("/forms/") ||
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
