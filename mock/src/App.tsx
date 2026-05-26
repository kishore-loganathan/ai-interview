import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import NavBar from "./home/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

// Pages
import Dashboard from "./pages/Dashboard/Dashboard";
import NewInterview from "./pages/NewInterview/NewInterview";
import InterviewPage from "./pages/InterviewPage/InterviewPage";
import ScorecardPage from "./pages/ScorecardPage/ScorecardPage";
import History from "./pages/History/History";
import Profile from "./pages/Profile/Profile";
import AdminPanel from "./pages/AdminPanel/AdminPanel";
import SignIn from "./pages/Auth/SignIn";
import SignUp from "./pages/Auth/SignUp";

// Admin Pages
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminInterviews from "./pages/Admin/AdminInterviews";
import AdminEvaluations from "./pages/Admin/AdminEvaluations";
import AdminAnalytics from "./pages/Admin/AdminAnalytics";

const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes - Auth Pages */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Admin Routes - Separate Layout */}
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminRoute><AdminDashboard /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><AdminRoute><AdminUsers /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/interviews" element={<ProtectedRoute><AdminRoute><AdminInterviews /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/evaluations" element={<ProtectedRoute><AdminRoute><AdminEvaluations /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute><AdminRoute><AdminAnalytics /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Protected Routes - Require Authentication */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-background">
                  {/* Persistent Sidebar */}
                  <NavBar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

                  {/* Main Content Area */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <main className="flex-1 overflow-auto">
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/new-interview" element={<NewInterview />} />
                        <Route path="/history" element={<History />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/admin" element={<AdminPanel />} />
                        <Route path="/interview" element={<InterviewPage />} />
                        <Route path="/scorecard" element={<ScorecardPage />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
};

export default App;