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
import FileDetailPage from "./pages/FileDetailPage";
import PlayerPage from "./pages/PlayerPage";
import QuizzesPage from "./pages/QuizzesPage";
import QuizBuilderPage from "./pages/QuizBuilderPage";
import QuizPlayerPage from "./pages/QuizPlayerPage";
import QuizResultsPage from "./pages/QuizResultsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AdminOrgsPage from "./pages/admin/AdminOrgsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminPermissionsPage from "./pages/admin/AdminPermissionsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        {/* Main */}
        <Route path="/" component={Dashboard} />
        <Route path="/upload" component={UploadPage} />
        <Route path="/files" component={FilesPage} />
        <Route path="/files/:id" component={FileDetailPage} />
        <Route path="/play/:id" component={PlayerPage} />

        {/* Quizzes */}
        <Route path="/quizzes" component={QuizzesPage} />
        <Route path="/quizzes/new" component={QuizBuilderPage} />
        <Route path="/quizzes/:id/edit" component={QuizBuilderPage} />
        <Route path="/quizzes/:id/play" component={QuizPlayerPage} />
        <Route path="/quizzes/:id/results/:attemptId" component={QuizResultsPage} />

        {/* Analytics */}
        <Route path="/analytics" component={AnalyticsPage} />

        {/* Admin */}
        <Route path="/admin/orgs" component={AdminOrgsPage} />
        <Route path="/admin/users" component={AdminUsersPage} />
        <Route path="/admin/permissions" component={AdminPermissionsPage} />
        <Route path="/admin/settings" component={AdminSettingsPage} />

        {/* 404 */}
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
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
