import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, ShieldAlert, MapPin, Users, X } from "lucide-react";

export default function SOS(){
 const [active,setActive]=useState(false);
 if(active) return <div className="sos-page active"><div className="sos-panel"><div className="sos-ring"><ShieldAlert size={48}/></div><div className="eyebrow">SOS MODE</div><h1>Emergency state activated.</h1><p>This frontend demo simulates the emergency flow. In a production system, verified integrations would be required for real emergency calling or messaging.</p><div className="sos-actions"><button className="btn btn-light" onClick={()=>setActive(false)}><X/> Cancel SOS</button><button className="btn btn-outline-light"><Phone/> Call emergency contact</button></div><div className="sos-location"><MapPin/> Location sharing simulation is active</div></div></div>;
 return <div className="container page-container narrow"><div className="sos-intro"><div className="sos-icon"><ShieldAlert/></div><div className="eyebrow">EMERGENCY TOOLS</div><h1>Need immediate help?</h1><p>SOS is separate from community reporting. Use it for situations that require immediate personal action.</p><button className="sos-main" onClick={()=>setActive(true)}>ACTIVATE SOS</button><div className="sos-features"><span><Phone/> Emergency call flow</span><span><Users/> Trusted contacts</span><span><MapPin/> Location sharing</span></div><Link to="/dashboard" className="back-link">← Back to dashboard</Link></div></div>
}
