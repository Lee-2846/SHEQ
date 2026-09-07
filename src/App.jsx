import { useState } from "react";
import { Routes, Route, Navigate, useLocation, Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShieldCheck, Map, Bell, UserRound, Siren, Menu, X, ArrowRight,
  CircleAlert, Users, BarChart3, CheckCircle2, LockKeyhole, HeartHandshake
} from "lucide-react";
import { reports as initialReports } from "./data/mockData";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import SafetyMap from "./pages/SafetyMap";
import ReportIncident from "./pages/ReportIncident";
import IncidentDetails from "./pages/IncidentDetails";
import Alerts from "./pages/Alerts";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";
import SOS from "./pages/SOS";
import About from "./pages/About";

export default function App() {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState(initialReports);
  const location = useLocation();

  const isPublic = ["/", "/about", "/login", "/signup"].includes(location.pathname);

  return (
    <div className="app-shell">
      <Navbar user={user} setUser={setUser} />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28 }}
          className={isPublic ? "" : "app-main"}
        >
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/signup" element={<Signup setUser={setUser} />} />
            <Route path="/dashboard" element={<Dashboard reports={reports} user={user} />} />
            <Route path="/map" element={<SafetyMap reports={reports} />} />
            <Route path="/report" element={<ReportIncident setReports={setReports} />} />
            <Route path="/incident/:id" element={<IncidentDetails reports={reports} setReports={setReports} />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/insights" element={<Insights reports={reports} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/sos" element={<SOS />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
      {isPublic && <Footer />}
    </div>
  );
}
