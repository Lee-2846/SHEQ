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

const PHASES = [
  {
    phaseTag: "Phase 1: Getting Started & Exploring",
    steps: [
      {
        num: "01",
        icon: UserPlus,
        title: "Create an Account",
        description: "Sign up in seconds using your preferred verification method — email address or 10-digit mobile number."
      },
      {
        num: "02",
        icon: KeyRound,
        title: "Verify with Passcode",
        description: "Receive a quick one-time passcode to ensure a verified, authentic community of real neighborhood members."
      },
      {
        num: "03",
        icon: Map,
        title: "Explore the Safety Map",
        description: "View community-reported concerns, lighting conditions, and verified signals around your daily travel routes."
      }
    ]
  },
  {
    phaseTag: "Phase 2: Reporting & Community Validation",
    steps: [
      {
        num: "04",
        icon: AlertTriangle,
        title: "Report What You Notice",
        description: "Share observations about poor lighting, street harassment, transit gaps, or unsafe isolated stretches."
      },
      {
        num: "05",
        icon: EyeOff,
        title: "Choose Anonymous Reporting",
        description: "Keep your name hidden from public map reports while retaining full platform integrity and internal verification."
      },
      {
        num: "06",
        icon: CheckCircle2,
        title: "Community Confirmations",
        description: "Confirm incidents you've also observed to help validate local patterns and build collective safety clarity."
      },
      {
        num: "07",
        icon: MessageSquare,
        title: "Add Context & Comments",
        description: "Provide time-sensitive details, status updates, or dispute inaccuracies so information stays fresh and reliable."
      }
    ]
  },
  {
    phaseTag: "Phase 3: Proactive Protection & Emergency Response",
    steps: [
      {
        num: "08",
        icon: TrendingUp,
        title: "Personalized Safety Insights",
        description: "Save places like Home, College, or Work to receive relevant neighborhood updates and safety signals automatically."
      },
      {
        num: "09",
        icon: Phone,
        title: "Configure Emergency Contacts",
        description: "Set up primary family contacts and trusted circle members ready to receive emergency signals instantly."
      },
      {
        num: "10",
        icon: ShieldAlert,
        title: "Activate SOS When in Need",
        description: "Trigger rapid emergency assistance simulation and broadcast your live coordinates to emergency services and contacts."
      }
    ]
  }
];

export default function About() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="container page-container">
      <SectionTitle eyebrow="HOW IT WORKS" title="A structured guide to community safety.">
        SHEQ turns everyday observations into community-checked signals so you can navigate with awareness and confidence.
      </SectionTitle>

      {/* Human Experience Note Banner */}
      <div className="human-story-banner">
        <div className="human-story-icon-wrapper">
          <Heart size={24} className="text-berry" />
        </div>
        <div className="human-story-text">
          <h3>Built around real everyday experiences</h3>
          <p>
            Every woman knows the quiet calculation of choosing which road to take at night, noting where streetlights flicker,
            or feeling uneasy on an isolated stretch. SHEQ was created so nobody has to navigate those moments in isolation.
            By sharing what we notice, we turn individual vigilance into shared community strength.
          </p>
        </div>
      </div>

      {/* 10-Step Structured Timeline Progression */}
      <div className="guide-timeline-container">
        {PHASES.map((phase) => (
          <div className="guide-phase-group" key={phase.phaseTag}>
            <div className="guide-phase-header">
              <span className="guide-phase-tag">{phase.phaseTag}</span>
            </div>
            <div className="guide-steps-list">
              {phase.steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div className="guide-step-row" key={step.num}>
                    <div className="guide-step-badge">
                      <span className="guide-step-number">{step.num}</span>
                    </div>
                    <div className="guide-step-body">
                      <div className="guide-step-title-row">
                        <span className="guide-step-icon">
                          <Icon size={18} />
                        </span>
                        <h3>{step.title}</h3>
                      </div>
                      <p className="guide-step-desc">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Call to Action */}
      <div className="guide-cta-section">
        <div className="guide-cta-inner">
          <div className="guide-cta-content">
            <h2>Ready to join the community?</h2>
            <p>Create your account and start sharing signals with members near you.</p>
          </div>
          <Link to={isAuthenticated ? "/dashboard" : "/signup"} className="btn btn-ivory btn-lg">
            {isAuthenticated ? "Go to Dashboard" : "Create Free Account"} <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
