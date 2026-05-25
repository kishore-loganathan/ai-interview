import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import NavBar from "./home/NavBar";

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

const App = () => {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <div className="flex h-screen bg-background">
          {/* Persistent Sidebar */}
          <NavBar />

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

                {/* Auth Routes */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  );
};

export default App;