import { Link } from "react-router-dom";
import {
  UserPlus,
  KeyRound,
  Map,
  AlertTriangle,
  EyeOff,
  CheckCircle2,
  MessageSquare,
  TrendingUp,
  Phone,
  ShieldAlert,
  ArrowRight,
  Heart
} from "lucide-react";
import SectionTitle from "../components/SectionTitle";
import { useAuth } from "../context/AuthContext";

const STEPS = [
  {
    num: "01",
    icon: UserPlus,
    title: "Create an Account",
    description: "Sign up in seconds using your preferred method — email address or mobile phone number."
  },
  {
    num: "02",
    icon: KeyRound,
    title: "Verify with OTP",
    description: "Receive a quick one-time passcode to ensure a verified, trusted community of real users."
  },
  {
    num: "03",
    icon: Map,
    title: "Explore the Safety Map",
    description: "View community-reported concerns, lighting conditions, and verified signals around your daily routes."
  },
  {
    num: "04",
    icon: AlertTriangle,
    title: "Report What You Notice",
    description: "Share observations about poor lighting, harassment, transport issues, or unsafe isolated areas."
  },
  {
    num: "05",
    icon: EyeOff,
    title: "Choose Anonymous Reporting",
    description: "Keep your name hidden from public reports while retaining full platform integrity."
  },
  {
    num: "06",
    icon: CheckCircle2,
    title: "Community Confirmations",
    description: "Confirm incidents you've observed to help validate trends and build collective clarity."
  },
  {
    num: "07",
    icon: MessageSquare,
    title: "Add Context & Comments",
    description: "Provide time-sensitive details, updates, or dispute inaccuracies so information stays fresh."
  },
  {
    num: "08",
    icon: TrendingUp,
    title: "Personalized Safety Insights",
    description: "Save places like Home, College, or Work to receive relevant neighborhood updates automatically."
  },
  {
    num: "09",
    icon: Phone,
    title: "Configure Emergency Contacts",
    description: "Set up primary family contacts and trusted friends ready to receive alerts in emergencies."
  },
  {
    num: "10",
    icon: ShieldAlert,
    title: "Activate SOS When in Need",
    description: "Trigger immediate emergency call simulation and broadcast your live coordinates instantly."
  }
];

export default function About() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="container page-container">
      <SectionTitle eyebrow="HOW IT WORKS" title="A practical guide to community safety.">
        SHEQ connects everyday observations into structured, community-checked signals so you can navigate
        with awareness and confidence.
      </SectionTitle>

      {/* Genuine Human Note */}
      <div className="human-note-card">
        <div className="human-note-icon">
          <Heart size={24} />
        </div>
        <div>
          <h3>Built around real everyday experiences</h3>
          <p>
            Every woman knows the quiet calculation of choosing which road to take at night, noting where
            streetlights flicker, or feeling uneasy on a quiet stretch. SHEQ was created so nobody has to navigate
            those moments in isolation. By sharing what we notice, we turn individual vigilance into shared community
            strength.
          </p>
        </div>
      </div>

      {/* 10-Step Practical Flow Grid */}
      <div className="how-it-works-grid">
        {STEPS.map(step => {
          const Icon = step.icon;
          return (
            <div className="guide-card" key={step.num}>
              <div className="guide-card-head">
                <span className="guide-num">{step.num}</span>
                <div className="guide-icon-wrapper">
                  <Icon size={20} />
                </div>
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          );
        })}
      </div>

      {/* Bottom Call to Action */}
      <div className="about-cta-box">
        <div>
          <h2>Ready to join the community?</h2>
          <p>Create your account and start sharing signals with members near you.</p>
        </div>
        <Link to={isAuthenticated ? "/dashboard" : "/signup"} className="btn btn-berry btn-lg">
          {isAuthenticated ? "Go to Dashboard" : "Create Free Account"} <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
