import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Public Pages
import Landing from "./pages/Landing";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Authenticated User Pages
import Dashboard from "./pages/Dashboard";
import SafetyMap from "./pages/SafetyMap";
import ReportIncident from "./pages/ReportIncident";
import IncidentDetails from "./pages/IncidentDetails";
import SOS from "./pages/SOS";
import Profile from "./pages/Profile";
import Alerts from "./pages/Alerts";
import Insights from "./pages/Insights";

// Admin Pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReports from "./pages/admin/AdminReports";
import AdminHotspots from "./pages/admin/AdminHotspots";
import AdminIssues from "./pages/admin/AdminIssues";
import AdminEscalations from "./pages/admin/AdminEscalations";
import AdminModeration from "./pages/admin/AdminModeration";

export default function App() {
  const location = useLocation();
  const isPublic = ["/", "/about", "/login", "/signup"].includes(location.pathname);

  return (
    <AuthProvider>
      <DataProvider>
        <div className="app-shell">
          <Navbar />
          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className={isPublic ? "" : "app-main"}
            >
              <Routes>
                {/* 1. Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/about" element={<About />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* 2. Authenticated User Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/map"
                  element={
                    <ProtectedRoute>
                      <SafetyMap />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/report"
                  element={
                    <ProtectedRoute>
                      <ReportIncident />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/incident/:id"
                  element={
                    <ProtectedRoute>
                      <IncidentDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sos"
                  element={
                    <ProtectedRoute>
                      <SOS />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/alerts"
                  element={
                    <ProtectedRoute>
                      <Alerts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/insights"
                  element={
                    <ProtectedRoute>
                      <Insights />
                    </ProtectedRoute>
                  }
                />

                {/* 3. Authorized Admin Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="hotspots" element={<AdminHotspots />} />
                  <Route path="issues" element={<AdminIssues />} />
                  <Route path="escalations" element={<AdminEscalations />} />
                  <Route path="moderation" element={<AdminModeration />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.main>
          </AnimatePresence>
          {isPublic && <Footer />}
        </div>
      </DataProvider>
    </AuthProvider>
  );
}
