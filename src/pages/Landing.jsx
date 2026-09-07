import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Users, ShieldCheck, CircleAlert, BarChart3, Sparkles } from "lucide-react";
import SectionTitle from "../components/SectionTitle";
import { stats } from "../data/mockData";

const dots = Array.from({length: 34}, (_, i) => ({
  left: `${8 + (i * 23) % 82}%`,
  top: `${12 + (i * 37) % 72}%`,
  delay: (i % 7) * .12
}));

export default function Landing() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);

  return (
    <>
      <section className="hero">
        <motion.div className="hero-orb orb-one" style={{y}} />
        <motion.div className="hero-orb orb-two" />
        <div className="container hero-grid">
          <motion.div initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} transition={{duration:.7}}>
            <div className="eyebrow">COMMUNITY × SAFETY × INSIGHT</div>
            <h1>Safety becomes stronger when <em>we share what we know.</em></h1>
            <p className="hero-copy">SHEQ turns everyday safety experiences into a community signal — helping women understand their surroundings, report concerns, and make more informed decisions.</p>
            <div className="hero-actions">
              <Link to="/map" className="btn btn-berry btn-lg">Explore the safety map <ArrowRight size={18}/></Link>
              <Link to="/report" className="text-link">Share a report <span>↗</span></Link>
            </div>
            <div className="hero-trust"><ShieldCheck size={17}/> Anonymous reporting available · Community-verified signals</div>
          </motion.div>

          <motion.div className="hero-visual" initial={{opacity:0,scale:.92}} animate={{opacity:1,scale:1}} transition={{duration:.8,delay:.15}}>
            <div className="signal-card">
              <div className="signal-head"><span>LIVE COMMUNITY SIGNAL</span><span className="pulse-dot"/></div>
              <div className="signal-map">
                <div className="map-lines"/>
                {dots.map((d,i)=><motion.i key={i} className="signal-dot" style={{left:d.left,top:d.top}} animate={{scale:[1,1.6,1],opacity:[.4,1,.4]}} transition={{duration:2.8,repeat:Infinity,delay:d.delay}} />)}
                <motion.div className="signal-cluster" animate={{rotate:[0,5,-4,0],scale:[.98,1.03,.98]}} transition={{duration:5,repeat:Infinity}}><div className="cluster-core">42</div><small>signals</small></motion.div>
              </div>
              <div className="signal-footer"><div><strong>Shivajinagar</strong><span>Elevated concern</span></div><div className="score">78%</div></div>
            </div>
            <div className="floating-tag tag-one"><Users size={15}/> 14 people confirmed</div>
            <div className="floating-tag tag-two"><MapPin size={15}/> 3 new reports nearby</div>
          </motion.div>
        </div>
        <div className="hero-bottom-fade"/>
      </section>

      <section className="intro-section">
        <div className="container">
          <SectionTitle eyebrow="THE IDEA" title="From isolated experiences to a shared safety picture.">
            A single report tells one story. A community of reports can reveal a pattern.
          </SectionTitle>
          <div className="process-grid">
            {[
              [CircleAlert,"REPORT","Share what happened or what feels unsafe."],
              [Users,"VERIFY","People nearby can confirm, dispute, or add context."],
              [BarChart3,"UNDERSTAND","Patterns become location and time-based safety signals."],
              [ShieldCheck,"DECIDE","Use the information to plan with more awareness."]
            ].map(([Icon,title,text],i)=>(
              <motion.div className="process-card" key={title} whileHover={{y:-7}} transition={{type:"spring",stiffness:300}}>
                <div className="process-num">0{i+1}</div><Icon className="process-icon"/><h3>{title}</h3><p>{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="berry-section">
        <div className="container berry-grid">
          <div><div className="eyebrow light-eyebrow">WHY SHEQ</div><h2>One place for the pieces of safety that usually feel fragmented.</h2><p>Reports, community verification, location context, alerts, insights and emergency tools — brought together without turning every street into a warning sign.</p><Link to="/about" className="btn btn-ivory">See how SHEQ works <ArrowRight size={17}/></Link></div>
          <div className="mini-stack">
            {["Community reports","Verified safety signals","Location-based alerts","Insights & patterns"].map((x,i)=><motion.div key={x} className="stack-card" initial={{x:30,opacity:0}} whileInView={{x:0,opacity:1}} viewport={{once:true}} transition={{delay:i*.1}}><span>0{i+1}</span>{x}<ArrowRight size={16}/></motion.div>)}
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container">
          <SectionTitle eyebrow="THE NETWORK" title="A safety picture built from many voices." />
          <div className="stats-grid">
            <div><strong>{stats.reports.toLocaleString()}+</strong><span>community reports</span></div>
            <div><strong>{stats.verified}%</strong><span>reports with community confirmation</span></div>
            <div><strong>{stats.areas}</strong><span>areas with active signals</span></div>
            <div><strong>{stats.community.toLocaleString()}+</strong><span>community interactions</span></div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta-box"><div><div className="eyebrow">YOUR EXPERIENCE MATTERS</div><h2>Seen something others should know?</h2><p>A quick report can become useful context for someone else.</p></div><Link to="/report" className="btn btn-berry">Report an incident <ArrowRight size={18}/></Link></div>
      </section>
    </>
  );
}
