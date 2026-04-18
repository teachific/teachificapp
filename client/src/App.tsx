import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UploadQueueProvider } from "./contexts/UploadQueueContext";
import { UploadQueuePanel } from "./components/UploadQueuePanel";
import { getSubdomain } from "./hooks/useSubdomain";

// ─── Lazy-loaded page components ───────────────────────────────────────────

// Core pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const FilesPage = lazy(() => import("./pages/FilesPage"));
const UploadPage = lazy(() => import("./pages/UploadPage"));
const MediaLibraryPage = lazy(() => import("./pages/MediaLibraryPage"));
const FileDetailPage = lazy(() => import("./pages/FileDetailPage"));
const PlayerPage = lazy(() => import("./pages/PlayerPage"));
const EmbedPage = lazy(() => import("./pages/EmbedPage"));
const QuizzesPage = lazy(() => import("./pages/QuizzesPage"));
const QuizBuilderPage = lazy(() => import("./pages/QuizBuilderPage"));
const QuizPlayerPage = lazy(() => import("./pages/QuizPlayerPage"));
const QuizResultsPage = lazy(() => import("./pages/QuizResultsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const AdminOrgsPage = lazy(() => import("./pages/admin/AdminOrgsPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminPermissionsPage = lazy(() => import("./pages/admin/AdminPermissionsPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));
const PlatformAdminPage = lazy(() => import("./pages/admin/PlatformAdminPage"));

// LMS pages
const CoursesPage = lazy(() => import("./pages/lms/CoursesPage"));
const CourseBuilderPage = lazy(() => import("./pages/lms/CourseBuilderPage"));
const BrandingPage = lazy(() => import("./pages/lms/BrandingPage"));
const MembersPage = lazy(() => import("./pages/lms/MembersPage"));
const LmsAnalyticsPage = lazy(() => import("./pages/lms/LmsAnalyticsPage"));
const PageBuilderPage = lazy(() => import("./pages/lms/PageBuilderPage"));
const SchoolPage = lazy(() => import("./pages/lms/SchoolPage"));
const OrgLandingPage = lazy(() => import("./pages/lms/OrgLandingPage"));
const SchoolMyCoursesPage = lazy(() => import("./pages/lms/SchoolMyCoursesPage"));
const FormsPage = lazy(() => import("./pages/lms/FormsPage"));
const FormBuilderPage = lazy(() => import("./pages/lms/FormBuilderPage"));
const FormResponsesPage = lazy(() => import("./pages/lms/FormResponsesPage"));
const FormAnalyticsPage = lazy(() => import("./pages/lms/FormAnalyticsPage"));
const FormPlayerPage = lazy(() => import("./pages/FormPlayerPage"));
const CourseSalesPage = lazy(() => import("./pages/lms/CourseSalesPage"));
const CoursePlayerPage = lazy(() => import("./pages/lms/CoursePlayerPage"));
const CourseOverviewPage = lazy(() => import("./pages/lms/CourseOverviewPage"));
const OrgPoliciesPage = lazy(() => import("./pages/OrgPoliciesPage"));
const CustomPagesPage = lazy(() => import("./pages/admin/CustomPagesPage"));
const DigitalProductsPage = lazy(() => import("./pages/admin/DigitalProductsPage"));
const DigitalProductEditorPage = lazy(() => import("./pages/admin/DigitalProductEditorPage"));
const DigitalProductSalesPage = lazy(() => import("./pages/DigitalProductSalesPage"));
const DigitalDownloadsReportsPage = lazy(() => import("./pages/admin/DigitalDownloadsReportsPage"));
const WebinarsPage = lazy(() => import("./pages/admin/WebinarsPage"));
const WebinarEditorPage = lazy(() => import("./pages/admin/WebinarEditorPage"));
const WebinarReportsPage = lazy(() => import("./pages/admin/WebinarReportsPage"));
const WebinarRegisterPage = lazy(() => import("./pages/WebinarRegisterPage"));
const WebinarWatchPage = lazy(() => import("./pages/WebinarWatchPage"));
const OrgSettingsPage = lazy(() => import("./pages/OrgSettingsPage"));
const StudentLogReportsPage = lazy(() => import("./pages/lms/StudentLogReportsPage"));
const LmsDashboardPage = lazy(() => import("./pages/lms/LmsDashboardPage"));
const MyCoursesPage = lazy(() => import("./pages/lms/MyCoursesPage"));
const MyCertificatesPage = lazy(() => import("./pages/lms/MyCertificatesPage"));
const EmailMarketingPage = lazy(() => import("./pages/lms/EmailMarketingPage"));
const PublicPagePage = lazy(() => import("./pages/PublicPagePage"));

// Members section
const GroupsPage = lazy(() => import("./pages/members/GroupsPage"));
const GroupManagerPortalPage = lazy(() => import("./pages/members/GroupManagerPortalPage"));
const MemberCertificatesPage = lazy(() => import("./pages/members/MemberCertificatesPage"));
const DiscussionsPage = lazy(() => import("./pages/members/DiscussionsPage"));
const AssignmentsPage = lazy(() => import("./pages/members/AssignmentsPage"));

// Products section
const MembershipsPage = lazy(() => import("./pages/products/MembershipsPage"));
const BundlesPage = lazy(() => import("./pages/products/BundlesPage"));
const CommunityPage = lazy(() => import("./pages/products/CommunityPage"));
const CommunityLearnerPage = lazy(() => import("./pages/lms/CommunityLearnerPage"));
const CommunityManagePage = lazy(() => import("./pages/products/CommunityManagePage"));
const CategoriesPage = lazy(() => import("./pages/products/CategoriesPage"));
const RecordPage = lazy(() => import("./pages/RecordPage"));

// Marketing section
const WebsitePage = lazy(() => import("./pages/marketing/WebsitePage"));
const EmailCampaignsPage = lazy(() => import("./pages/marketing/EmailCampaignsPage"));
const FunnelsPage = lazy(() => import("./pages/marketing/FunnelsPage"));
const AffiliatesPage = lazy(() => import("./pages/marketing/AffiliatesPage"));

// Sales section
const OrdersPage = lazy(() => import("./pages/sales/OrdersPage"));
const SubscriptionsPage = lazy(() => import("./pages/sales/SubscriptionsPage"));
const GroupOrdersPage = lazy(() => import("./pages/sales/GroupOrdersPage"));
const CouponsPage = lazy(() => import("./pages/sales/CouponsPage"));
const InvoicesPage = lazy(() => import("./pages/sales/InvoicesPage"));
const RevenuePartnersPage = lazy(() => import("./pages/sales/RevenuePartnersPage"));

// Analytics section
const RevenueAnalyticsPage = lazy(() => import("./pages/analytics/RevenueAnalyticsPage"));
const EngagementAnalyticsPage = lazy(() => import("./pages/analytics/EngagementAnalyticsPage"));
const MarketingAnalyticsPage = lazy(() => import("./pages/analytics/MarketingAnalyticsPage"));
const CustomReportsPage = lazy(() => import("./pages/analytics/CustomReportsPage"));

// Integrations section
const IntegrationsPage = lazy(() => import("./pages/integrations/IntegrationsPage"));
const ApiPage = lazy(() => import("./pages/integrations/ApiPage"));
const WebhooksPage = lazy(() => import("./pages/integrations/WebhooksPage"));

// Profile section
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const BillingPage = lazy(() => import("./pages/profile/BillingPage"));

// Public / marketing pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const PlatformPoliciesPage = lazy(() => import("./pages/PlatformPoliciesPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));

// Standalone tools
const QuizCreatorPage = lazy(() => import("./pages/QuizCreatorPage"));
const QuizCreatorGate = lazy(() => import("./pages/QuizCreatorGate"));
const QuizCreatorDashboard = lazy(() => import("./pages/QuizCreatorDashboard"));
const QuizCreatorLandingPage = lazy(() => import("./pages/QuizCreatorLandingPage"));
const StudioDashboard = lazy(() => import("./pages/StudioDashboard"));
const StudioLandingPage = lazy(() => import("./pages/StudioLandingPage"));
const CreatorDashboardPage = lazy(() => import("./pages/CreatorDashboardPage"));
const CreatorEditorPage = lazy(() => import("./pages/CreatorEditorPage"));
const CreatorLandingPage = lazy(() => import("./pages/CreatorLandingPage"));
const DesktopDownloadPage = lazy(() => import("./pages/DesktopDownloadPage"));

// Auth pages (no sidebar)
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("./pages/auth/VerifyEmailPage"));

// ─── Suspense fallback ──────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

// Auth paths that render without the dashboard shell
const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

// Bare routes — no admin sidebar (share links, embeds, auth pages, student player)
function BareRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
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
        <Route path="/school">{() => <SchoolPage />}</Route>
        <Route path="/school/:orgSlug">{() => <SchoolPage />}</Route>
        <Route path="/school/courses/:courseId" component={CourseSalesPage} />
        <Route path="/school/:orgSlug/courses/:courseId" component={CourseSalesPage} />
        {/* Member portal routes — require auth, show member sidebar */}
        <Route path="/school/:orgSlug/my-courses" component={SchoolMyCoursesPage} />
        <Route path="/school/my-courses" component={SchoolMyCoursesPage} />
        <Route path="/community/:hubId" component={CommunityLearnerPage} />
        {/* Platform-level legal policies — independent of any org */}
        <Route path="/help" component={HelpPage} />
        <Route path="/policies" component={PlatformPoliciesPage} />
        <Route path="/terms" component={PlatformPoliciesPage} />
        <Route path="/privacy" component={PlatformPoliciesPage} />
        {/* Org-specific policies */}
        <Route path="/policies/:orgSlug" component={OrgPoliciesPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/verify-email" component={VerifyEmailPage} />
        {/* Marketing landing page — shown to logged-out visitors at root */}
        <Route path="/" component={LandingPage} />
        {/* Support page — publicly accessible */}
        <Route path="/support" component={SupportPage} />
        {/* Standalone Quiz Creator — gated by role */}
        <Route path="/quiz-creator" component={QuizCreatorGate} />
        {/* QuizCreator standalone app for users without LMS access */}
        <Route path="/quiz-creator-app/download">{() => <DesktopDownloadPage app="quizCreator" />}</Route>
        <Route path="/quiz-creator-app" component={QuizCreatorDashboard} />
        {/* QuizCreator sales/marketing page */}
        <Route path="/quiz-creator-pro" component={QuizCreatorLandingPage} />
        {/* Teachific Studio standalone dashboard */}
        <Route path="/studio/download">{() => <DesktopDownloadPage app="studio" />}</Route>
        <Route path="/studio" component={StudioDashboard} />
        {/* Teachific Studio sales/marketing page */}
        <Route path="/studio-pro" component={StudioLandingPage} />
        {/* TeachificCreator™ — eLearning authoring tool */}
        <Route path="/creator-pro" component={CreatorLandingPage} />
        <Route path="/creator/download">{() => <DesktopDownloadPage app="creator" />}</Route>
        <Route path="/creator" component={CreatorDashboardPage} />
        <Route path="/creator/:projectId" component={CreatorEditorPage} />
      </Switch>
    </Suspense>
  );
}

// Admin shell routes — wrapped in DashboardLayout
function AdminRouter() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          {/* Root → Dashboard */}
          {/* Root is handled by BareRouter (LandingPage redirects logged-in users to /lms) */}

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
          {/* Parent nav redirects — collapsed sidebar navigates to parent path */}
          <Route path="/members">{() => { window.location.replace("/members/users"); return null; }}</Route>
          <Route path="/products">{() => { window.location.replace("/lms/courses"); return null; }}</Route>
          <Route path="/marketing">{() => { window.location.replace("/marketing/website"); return null; }}</Route>
          <Route path="/sales">{() => { window.location.replace("/sales/orders"); return null; }}</Route>
          <Route path="/settings">{() => { window.location.replace("/lms/settings"); return null; }}</Route>
          <Route path="/admin">{() => { window.location.replace("/platform-admin"); return null; }}</Route>

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
          <Route path="/record">{() => { window.location.replace("/media-library#record-edit"); return null; }}</Route>

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
          <Route path="/upload">{() => { window.location.replace("/media-library#library"); return null; }}</Route>
          <Route path="/files">{() => { window.location.replace("/media-library#library"); return null; }}</Route>
          <Route path="/files/:id" component={FileDetailPage} />
          <Route path="/quizzes">{() => { window.location.replace("/media-library#quizzes"); return null; }}</Route>
          <Route path="/play/:id" component={PlayerPage} />
          <Route path="/quizzes/new" component={QuizBuilderPage} />
          <Route path="/quizzes/:id/edit" component={QuizBuilderPage} />
          <Route path="/quizzes/:id/play" component={QuizPlayerPage} />
          <Route path="/quizzes/:id/results/:attemptId" component={QuizResultsPage} />
          <Route path="/lms/my-courses" component={MyCoursesPage} />
          <Route path="/lms/my-certificates" component={MyCertificatesPage} />
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
      </Suspense>
    </DashboardLayout>
  );
}


/**
 * SubdomainSchoolRouter
 * When the app is accessed via an org subdomain (e.g. allaboutultrasound.teachific.app),
 * serve both the learner portal AND the admin dashboard for org admins.
 */
function SubdomainSchoolRouter({ subdomain }: { subdomain: string }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Auth works on subdomains */}
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/verify-email" component={VerifyEmailPage} />

        {/* ── Admin dashboard routes (org_admin / org_super_admin) ── */}
        {/* These are served inside DashboardLayout on the subdomain */}
        <Route path="/lms">{() => <DashboardLayout><LmsDashboardPage /></DashboardLayout>}</Route>
        <Route path="/lms/dashboard">{() => <DashboardLayout><LmsDashboardPage /></DashboardLayout>}</Route>
        <Route path="/lms/courses">{() => <DashboardLayout><CoursesPage /></DashboardLayout>}</Route>
        <Route path="/lms/courses/new">{() => <DashboardLayout><CourseBuilderPage /></DashboardLayout>}</Route>
        <Route path="/lms/courses/:id/curriculum">{() => <DashboardLayout><CourseBuilderPage /></DashboardLayout>}</Route>
        <Route path="/lms/courses/:id/settings">{() => <DashboardLayout><CourseBuilderPage /></DashboardLayout>}</Route>
        <Route path="/lms/courses/:id/pricing">{() => <DashboardLayout><CourseBuilderPage /></DashboardLayout>}</Route>
        <Route path="/lms/courses/:id/drip">{() => <DashboardLayout><CourseBuilderPage /></DashboardLayout>}</Route>
        <Route path="/lms/courses/:id/after_purchase">{() => <DashboardLayout><CourseBuilderPage /></DashboardLayout>}</Route>
        <Route path="/lms/courses/:id">{() => <DashboardLayout><CourseBuilderPage /></DashboardLayout>}</Route>
        <Route path="/members/users">{() => <DashboardLayout><MembersPage /></DashboardLayout>}</Route>
        <Route path="/members/groups">{() => <DashboardLayout><GroupsPage /></DashboardLayout>}</Route>
        <Route path="/members/certificates">{() => <DashboardLayout><MemberCertificatesPage /></DashboardLayout>}</Route>
        <Route path="/members/discussions">{() => <DashboardLayout><DiscussionsPage /></DashboardLayout>}</Route>
        <Route path="/members/assignments">{() => <DashboardLayout><AssignmentsPage /></DashboardLayout>}</Route>
        <Route path="/members">{() => { window.location.replace("/members/users"); return null; }}</Route>
        <Route path="/admin/downloads">{() => <DashboardLayout><DigitalProductsPage /></DashboardLayout>}</Route>
        <Route path="/admin/downloads/new">{() => <DashboardLayout><DigitalProductEditorPage /></DashboardLayout>}</Route>
        <Route path="/admin/downloads/:id">{() => <DashboardLayout><DigitalProductEditorPage /></DashboardLayout>}</Route>
        <Route path="/lms/webinars">{() => <DashboardLayout><WebinarsPage /></DashboardLayout>}</Route>
        <Route path="/lms/webinars/:id/edit">{() => <DashboardLayout><WebinarEditorPage /></DashboardLayout>}</Route>
        <Route path="/products/memberships">{() => <DashboardLayout><MembershipsPage /></DashboardLayout>}</Route>
        <Route path="/products/bundles">{() => <DashboardLayout><BundlesPage /></DashboardLayout>}</Route>
        <Route path="/lms/forms">{() => <DashboardLayout><FormsPage /></DashboardLayout>}</Route>
        <Route path="/lms/forms/:id/responses">{() => <DashboardLayout><FormResponsesPage /></DashboardLayout>}</Route>
        <Route path="/lms/forms/:id/analytics">{() => <DashboardLayout><FormAnalyticsPage /></DashboardLayout>}</Route>
        <Route path="/lms/forms/:id">{() => <DashboardLayout><FormBuilderPage /></DashboardLayout>}</Route>
        <Route path="/products/community">{() => <DashboardLayout><CommunityPage /></DashboardLayout>}</Route>
        <Route path="/products/community/:hubId/manage">{() => <DashboardLayout><CommunityManagePage /></DashboardLayout>}</Route>
        <Route path="/products/categories">{() => <DashboardLayout><CategoriesPage /></DashboardLayout>}</Route>
        <Route path="/media-library">{() => <DashboardLayout><MediaLibraryPage /></DashboardLayout>}</Route>
        <Route path="/marketing/website">{() => <DashboardLayout><WebsitePage /></DashboardLayout>}</Route>
        <Route path="/marketing/email">{() => <DashboardLayout><EmailCampaignsPage /></DashboardLayout>}</Route>
        <Route path="/marketing/funnels">{() => <DashboardLayout><FunnelsPage /></DashboardLayout>}</Route>
        <Route path="/marketing/affiliates">{() => <DashboardLayout><AffiliatesPage /></DashboardLayout>}</Route>
        <Route path="/marketing">{() => { window.location.replace("/marketing/website"); return null; }}</Route>
        <Route path="/sales/orders">{() => <DashboardLayout><OrdersPage /></DashboardLayout>}</Route>
        <Route path="/sales/subscriptions">{() => <DashboardLayout><SubscriptionsPage /></DashboardLayout>}</Route>
        <Route path="/sales/coupons">{() => <DashboardLayout><CouponsPage /></DashboardLayout>}</Route>
        <Route path="/sales/invoices">{() => <DashboardLayout><InvoicesPage /></DashboardLayout>}</Route>
        <Route path="/sales">{() => { window.location.replace("/sales/orders"); return null; }}</Route>
        <Route path="/analytics/revenue">{() => <DashboardLayout><RevenueAnalyticsPage /></DashboardLayout>}</Route>
        <Route path="/analytics/engagement">{() => <DashboardLayout><EngagementAnalyticsPage /></DashboardLayout>}</Route>
        <Route path="/analytics">{() => <DashboardLayout><RevenueAnalyticsPage /></DashboardLayout>}</Route>
        <Route path="/lms/analytics">{() => <DashboardLayout><LmsAnalyticsPage /></DashboardLayout>}</Route>
        <Route path="/lms/activity">{() => <DashboardLayout><StudentLogReportsPage /></DashboardLayout>}</Route>
        <Route path="/integrations">{() => <DashboardLayout><IntegrationsPage /></DashboardLayout>}</Route>
        <Route path="/integrations/api">{() => <DashboardLayout><ApiPage /></DashboardLayout>}</Route>
        <Route path="/integrations/webhooks">{() => <DashboardLayout><WebhooksPage /></DashboardLayout>}</Route>
        <Route path="/profile">{() => <DashboardLayout><ProfilePage /></DashboardLayout>}</Route>
        <Route path="/billing">{() => <DashboardLayout><BillingPage /></DashboardLayout>}</Route>
        <Route path="/lms/branding">{() => <DashboardLayout><BrandingPage /></DashboardLayout>}</Route>
        <Route path="/lms/settings">{() => <DashboardLayout><OrgSettingsPage /></DashboardLayout>}</Route>
        <Route path="/lms/my-courses">{() => <DashboardLayout><MyCoursesPage /></DashboardLayout>}</Route>
        <Route path="/lms/my-certificates">{() => <DashboardLayout><MyCertificatesPage /></DashboardLayout>}</Route>
        <Route path="/lms/custom-pages">{() => <DashboardLayout><CustomPagesPage /></DashboardLayout>}</Route>
        <Route path="/lms/page-builder/:pageId">{() => <DashboardLayout><PageBuilderPage /></DashboardLayout>}</Route>
        <Route path="/lms/courses/:courseId/page-builder">{() => <DashboardLayout><PageBuilderPage /></DashboardLayout>}</Route>

        {/* ── Learner / public routes ── */}
        <Route path="/learn/:courseId/overview" component={CourseOverviewPage} />
        <Route path="/learn/:courseId/lesson/:lessonId" component={CoursePlayerPage} />
        <Route path="/learn/:courseId" component={CoursePlayerPage} />
        <Route path="/my-courses" component={SchoolMyCoursesPage} />
        <Route path="/my-certificates">{() => <DashboardLayout><MyCertificatesPage /></DashboardLayout>}</Route>
        <Route path="/courses/:courseId" component={CourseSalesPage} />
        <Route path="/community/:hubId" component={CommunityLearnerPage} />
        <Route path="/embed/:id" component={EmbedPage} />
        <Route path="/webinar/:slug/register" component={WebinarRegisterPage} />
        <Route path="/webinar/:slug/watch" component={WebinarWatchPage} />
        <Route path="/shop/:slug" component={DigitalProductSalesPage} />
        <Route path="/forms/:orgSlug/:slug" component={FormPlayerPage} />
        <Route path="/forms/:slug" component={FormPlayerPage} />
        <Route path="/p/:slug" component={PublicPagePage} />
        <Route path="/policies" component={OrgPoliciesPage} />
        <Route path="/terms" component={OrgPoliciesPage} />
        <Route path="/privacy" component={OrgPoliciesPage} />
        <Route path="/help" component={HelpPage} />

        {/* Default: show landing page if published, otherwise fall back to SchoolPage */}
        <Route>{() => <OrgLandingPage subdomainOrg={subdomain} fallback={<SchoolPage subdomainOrg={subdomain} />} />}</Route>
      </Switch>
    </Suspense>
  );
}

function Router() {
  // If running on an org subdomain, serve the school portal directly
  const subdomain = getSubdomain();
  if (subdomain) {
    return <SubdomainSchoolRouter subdomain={subdomain} />;
  }

  const path = window.location.pathname;
  const isBare =
    path === "/" ||
    path.startsWith("/embed/") ||
    path.startsWith("/learn/") ||
    path.startsWith("/school") ||
    path.startsWith("/p/") ||
    path.startsWith("/webinar/") ||
    path.startsWith("/shop/") ||
    path.startsWith("/forms/") ||
    AUTH_PATHS.some((p) => path === p || path.startsWith(p + "?")) ||
    path.startsWith("/quiz-creator") ||
    path.startsWith("/quiz-creator-app") ||
    path.startsWith("/quiz-creator-pro") ||
    path.startsWith("/studio") ||
    path.startsWith("/studio-pro") ||
    path.startsWith("/creator") ||
    path.startsWith("/policies") ||
    path === "/terms" ||
    path === "/privacy" ||
    path === "/help" ||
    path.startsWith("/community/");
  return isBare ? <BareRouter /> : <AdminRouter />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <UploadQueueProvider>
            <Toaster richColors position="top-right" />
            <Router />
            <UploadQueuePanel />
          </UploadQueueProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
