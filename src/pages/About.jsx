import SectionTitle from "../components/SectionTitle";
import { ShieldCheck, Users, Map, LockKeyhole } from "lucide-react";

export default function About() {
  return (
    <div className="container page-container">
      <SectionTitle eyebrow="ABOUT SHEQ" title="A community safety layer for everyday decisions.">SHEQ is designed around a simple idea: people already notice things about their surroundings. The platform helps turn those observations into structured, community-checked information.</SectionTitle>
      <div className="about-grid">
        {[
          [Users,"Community-first","Reports become more useful when other people can confirm, dispute, or add context."],
          [Map,"Location-aware","Safety information is connected to places and time so patterns are easier to understand."],
          [ShieldCheck,"Actionable, not alarming","SHEQ uses community signals instead of absolute “safe/unsafe” claims."],
          [LockKeyhole,"Privacy-conscious","Anonymous reporting is supported, and emergency features are clearly separated from community reporting."]
        ].map(([Icon,t,p])=><div className="about-card" key={t}><Icon/><h3>{t}</h3><p>{p}</p></div>)}
      </div>
      <div className="sdg-box"><div><span className="sdg-tag">SDG 05</span><h3>Gender Equality</h3><p>Supports safer participation and access to public spaces by giving women a community reporting and awareness layer.</p></div><div><span className="sdg-tag">SDG 11</span><h3>Sustainable Cities & Communities</h3><p>Community-generated information can help identify recurring local concerns and areas that may need attention.</p></div></div>
    </div>
  );
}
