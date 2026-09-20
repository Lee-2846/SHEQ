import { motion } from "framer-motion";
import { ShieldCheck, Users, Radio, Lock } from "lucide-react";

/**
 * FIX 2: Tasteful, professional safety & community visual illustration
 * Replaces heavy empty marketing panels with an elegant vector illustration.
 */
export default function AuthIllustration({ mode = "login" }) {
  const isSignup = mode === "signup";

  return (
    <div className="auth-art-column">
      <div className="auth-illustration-bg" />
      <div className="auth-illustration-orb orb-a" />
      <div className="auth-illustration-orb orb-b" />

      <div className="auth-illustration-container">
        {/* Animated Vector Safety & Community Symbol */}
        <div className="auth-visual-art">
          <svg
            viewBox="0 0 320 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="auth-svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a8526a" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#6c2f41" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef4ea" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#e8d8c9" stopOpacity="0.15" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Outer concentric safety pulse rings */}
            <circle cx="160" cy="160" r="140" stroke="url(#ringGrad)" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.4" />
            <circle cx="160" cy="160" r="115" stroke="url(#ringGrad)" strokeWidth="1.5" opacity="0.5" />
            <circle cx="160" cy="160" r="90" stroke="url(#ringGrad)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

            {/* Subtle community node interconnect lines */}
            <line x1="80" y1="100" x2="160" y2="150" stroke="#fef4ea" strokeWidth="1" opacity="0.25" />
            <line x1="240" y1="100" x2="160" y2="150" stroke="#fef4ea" strokeWidth="1" opacity="0.25" />
            <line x1="160" y1="150" x2="110" y2="230" stroke="#fef4ea" strokeWidth="1" opacity="0.25" />
            <line x1="160" y1="150" x2="210" y2="230" stroke="#fef4ea" strokeWidth="1" opacity="0.25" />

            {/* Community node dots */}
            <circle cx="80" cy="100" r="4" fill="#fef4ea" opacity="0.75" />
            <circle cx="240" cy="100" r="4" fill="#fef4ea" opacity="0.75" />
            <circle cx="110" cy="230" r="3.5" fill="#fef4ea" opacity="0.65" />
            <circle cx="210" cy="230" r="3.5" fill="#fef4ea" opacity="0.65" />

            {/* Main Central Shield Emblem */}
            <path
              d="M160 70 L220 98 V162 C220 205 194 238 160 252 C126 238 100 205 100 162 V98 Z"
              fill="url(#shieldGrad)"
              stroke="#fef4ea"
              strokeWidth="2.5"
              filter="url(#glow)"
            />

            {/* Inner checkmark icon inside shield */}
            <path
              d="M142 160 L154 172 L180 144"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Floating Community Trust Signals */}
        <div className="auth-floating-badges">
          <motion.div
            className="auth-pill-badge"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <ShieldCheck size={16} className="text-berry" />
            <span>Verified Community Safety Network</span>
          </motion.div>

          <motion.div
            className="auth-pill-badge"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <Radio size={15} className="text-berry" />
            <span>{isSignup ? "10,000+ Shared Observations" : "Live Local Context Signals"}</span>
          </motion.div>

          <motion.div
            className="auth-pill-badge"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <Lock size={15} className="text-berry" />
            <span>100% Public Anonymity Protected</span>
          </motion.div>
        </div>

        {/* Restrained Inspirational Typography */}
        <div className="auth-illustration-footer">
          <h3>
            {isSignup
              ? "Your experience could help someone else."
              : "Knowledge changes the way we move through a city."}
          </h3>
          <p>
            {isSignup
              ? "Join a community turning quiet observations into collective safety clarity."
              : "Access verified community signals, personalized alerts, and neighborhood context."}
          </p>
        </div>
      </div>
    </div>
  );
}
