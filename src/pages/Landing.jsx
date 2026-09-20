import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Users, ShieldCheck, CircleAlert, BarChart3, EyeOff, Radio } from "lucide-react";
import SectionTitle from "../components/SectionTitle";
import ReportCard from "../components/ReportCard";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import sheqHero from "../assets/sheq-hero.png";

const dots = Array.from({ length: 32 }, (_, i) => ({
  left: `${10 + (i * 27) % 78}%`,
  top: `${14 + (i * 31) % 68}%`,
  delay: (i % 6) * 0.15
}));

export default function Landing() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const { reports, stats } = useData();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  return (
    <>
      {/* 1. Hero Section */}
      <section className="hero">
        <motion.div className="hero-orb orb-one" style={{ y }} />
        <motion.div className="hero-orb orb-two" />
        <div className="container">
          <motion.div
            className="hero-image-wrapper"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img src={sheqHero} alt="SHEQ Community Safety" className="hero-image" />
          </motion.div>

          <div className="hero-grid">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="eyebrow">{t("home.eyebrow")}</div>
              <h1>
                Safety becomes stronger when <em>we share what we know.</em>
              </h1>
              <p className="hero-copy">
                {t("home.heroSubtitle")}
              </p>

              <div className="hero-actions">
                <Link to={isAuthenticated ? "/dashboard" : "/signup"} className="btn btn-berry btn-lg">
                  {isAuthenticated ? "Go to Dashboard" : t("home.ctaSignup")} <ArrowRight size={18} />
                </Link>
                <Link to="/map" className="btn btn-outline btn-lg hero-secondary-btn">
                  {t("home.ctaExplore")}
                </Link>
              </div>

              <div className="hero-trust">
                <ShieldCheck size={17} className="text-berry" />
                <span>{t("home.trustBadge")}</span>
              </div>
            </motion.div>

            <motion.div
              className="hero-visual"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <div className="signal-card">
                <div className="signal-head">
                  <span className="signal-head-title">
                    <Radio size={14} className="signal-live-icon" /> {t("home.liveSignal")}
                  </span>
                  <span className="pulse-dot" />
                </div>
                <div className="signal-map">
                  <div className="map-lines" />
                  {dots.map((d, i) => (
                    <motion.i
                      key={i}
                      className="signal-dot"
                      style={{ left: d.left, top: d.top }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.35, 1, 0.35] }}
                      transition={{ duration: 2.6, repeat: Infinity, delay: d.delay }}
                    />
                  ))}
                  <motion.div
                    className="signal-cluster"
                    animate={{ scale: [0.98, 1.03, 0.98] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <div className="cluster-core">{reports.length}</div>
                    <small>active signals</small>
                  </motion.div>
                </div>
                <div className="signal-footer">
                  <div>
                    <strong>{reports[0]?.place || "Dadar East"}</strong>
                    <span>{reports[0]?.category || "Active concern"}</span>
                  </div>
                  <div className="score">{stats.totalConfirmations}+ confirmations</div>
                </div>
              </div>

              <div className="floating-tag tag-one">
                <Users size={15} /> {stats.totalConfirmations} community confirmations
              </div>
              <div className="floating-tag tag-two">
                <MapPin size={15} /> {reports.length} verified signals
              </div>
            </motion.div>
          </div>
        </div>
        <div className="hero-bottom-fade" />
      </section>

      {/* 2. Core Pillars / How it operates */}
      <section className="intro-section">
        <div className="container">
          <SectionTitle eyebrow="THE PRINCIPLE" title="From isolated experiences to shared clarity.">
            A single report tells one story. A network of community observations surfaces verified patterns.
          </SectionTitle>
          <div className="process-grid">
            {[
              {
                icon: CircleAlert,
                num: "01",
                title: "Report Concerns",
                text: "Share observations about dark stretches, harassment, transit gaps, or isolated spots."
              },
              {
                icon: EyeOff,
                num: "02",
                title: "Choose Anonymity",
                text: "Submit privately without revealing your name publicly on community maps."
              },
              {
                icon: Users,
                num: "03",
                title: "Confirm & Verify",
                text: "Nearby members confirm or dispute details to keep community context accurate."
              },
              {
                icon: BarChart3,
                num: "04",
                title: "Navigate Informed",
                text: "Use neighborhood signals and active hotspots to make aware, confident travel decisions."
              }
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  className="process-card"
                  key={step.title}
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 280 }}
                >
                  <div className="process-num">{step.num}</div>
                  <Icon className="process-icon" />
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Preview Section of Recent Community Reports */}
      <section className="preview-reports-section">
        <div className="container">
          <SectionTitle
            eyebrow="COMMUNITY ACTIVITY"
            title="Recent community observations."
          >
            Verified reports shared by local members to help keep everyone informed.
          </SectionTitle>
          <div className="report-list">
            {reports.slice(0, 3).map(r => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <Link to="/map" className="btn btn-outline">
              View All on Safety Map <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Why SHEQ Feature Grid */}
      <section className="berry-section">
        <div className="container berry-grid">
          <div>
            <div className="eyebrow light-eyebrow">{t("home.whySheq")}</div>
            <h2>{t("home.whySheqTitle")}</h2>
            <p>{t("home.whySheqDesc")}</p>
            <Link to="/about" className="btn btn-ivory">
              See how SHEQ works <ArrowRight size={17} />
            </Link>
          </div>
          <div className="mini-stack">
            {[
              "Community-verified safety signals",
              "100% public anonymity toggle",
              "Personalized saved place alerts",
              "Simulated emergency SOS protocol"
            ].map((x, i) => (
              <motion.div
                key={x}
                className="stack-card"
                initial={{ x: 25, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <span>0{i + 1}</span>
                {x}
                <ArrowRight size={16} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Live Network Statistics */}
      <section className="stats-section">
        <div className="container">
          <SectionTitle eyebrow="THE NETWORK" title={t("home.networkTitle")} />
          <div className="stats-grid">
            <div>
              <strong>{stats.totalReports}</strong>
              <span>{t("home.communityReports")}</span>
            </div>
            <div>
              <strong>{stats.verifiedReports}</strong>
              <span>{t("home.verifiedReports")}</span>
            </div>
            <div>
              <strong>{stats.activeHotspotsCount}</strong>
              <span>{t("home.activeHotspots")}</span>
            </div>
            <div>
              <strong>{stats.totalConfirmations}</strong>
              <span>{t("home.confirmations")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Clean Bottom Call to Action Box */}
      <section className="cta-section">
        <div className="container cta-box">
          <div>
            <div className="eyebrow">YOUR OBSERVATION MATTERS</div>
            <h2>{t("home.ctaBoxTitle")}</h2>
            <p>{t("home.ctaBoxDesc")}</p>
          </div>
          <div>
            <Link to={isAuthenticated ? "/report" : "/signup"} className="btn btn-berry btn-lg">
              {isAuthenticated ? "Share a report" : t("home.ctaSignup")} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
