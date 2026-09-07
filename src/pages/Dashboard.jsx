import { Link } from "react-router-dom";
import { Map, Bell, CircleAlert, Users, ArrowRight } from "lucide-react";
import StatCard from "../components/StatCard";
import ReportCard from "../components/ReportCard";
import { alerts } from "../data/mockData";

export default function Dashboard({reports,user}) {
  const name=user?.name ? user.name.charAt(0).toUpperCase()+user.name.slice(1) : "there";
  return <div className="container page-container">
    <div className="dashboard-head"><div><div className="eyebrow">YOUR SAFETY DASHBOARD</div><h1>Good evening, {name}.</h1><p>Here’s the community picture around you today.</p></div><Link to="/report" className="btn btn-berry">+ Report an incident</Link></div>
    <div className="stat-grid"><StatCard icon={CircleAlert} value="12" label="Reports nearby" note="last 7 days"/><StatCard icon={Users} value="86%" label="Community confirmation" note="for your saved area"/><StatCard icon={Bell} value="3" label="New alerts" note="since yesterday"/><StatCard icon={Map} value="4" label="Areas with signals" note="around Pune"/></div>
    <div className="dashboard-grid"><section><div className="section-row"><div><div className="eyebrow">RECENT COMMUNITY REPORTS</div><h2>What people are sharing</h2></div><Link className="text-link" to="/map">View map →</Link></div><div className="report-list">{reports.slice(0,3).map(r=><ReportCard key={r.id} report={r}/>)}</div></section><aside className="dashboard-side"><div className="side-card"><div className="eyebrow">QUICK ACTIONS</div><Link to="/map">Explore safety map <ArrowRight/></Link><Link to="/report">Share a report <ArrowRight/></Link><Link to="/alerts">Review alerts <ArrowRight/></Link></div><div className="side-card soft"><div className="eyebrow">LATEST ALERT</div><h3>{alerts[0].title}</h3><p>{alerts[0].body}</p><Link to="/alerts" className="text-link">See all alerts →</Link></div></aside></div>
  </div>
}
