import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import { categories } from "../data/mockData";
import { createReport } from "../services/reportService";
import { validateReport } from "../utils/validation";

export default function ReportIncident({setReports}) {
  const [form,setForm]=useState({category:"",place:"",date:"",time:"",description:"",anonymous:true});
  const [errors,setErrors]=useState({});
  const [sending,setSending]=useState(false);
  const [done,setDone]=useState(false);
  const navigate=useNavigate();
  const update=(key,value)=>setForm({...form,[key]:value});
  async function submit(e){
    e.preventDefault();
    const next=validateReport(form); setErrors(next);
    if(Object.keys(next).length) return;
    setSending(true);
    const newReport=await createReport(form);
    setReports(prev=>[newReport,...prev]);
    setSending(false); setDone(true);
  }
  if(done) return <div className="container page-container narrow"><div className="success-card"><div className="success-icon"><CheckCircle2/></div><div className="eyebrow">REPORT RECEIVED</div><h1>Thank you for sharing.</h1><p>Your report has been added to the community review flow. Others can now confirm or add context.</p><div className="success-actions"><button className="btn btn-berry" onClick={()=>navigate("/map")}>See it on the map</button><button className="btn btn-outline" onClick={()=>{setDone(false);setForm({category:"",place:"",date:"",time:"",description:"",anonymous:true})}}>Submit another</button></div></div></div>;
  return <div className="container page-container narrow"><div className="form-header"><div><div className="eyebrow">COMMUNITY REPORT</div><h1>What happened?</h1><p>Give enough context for someone else to understand the situation. You can submit anonymously.</p></div><div className="privacy-note"><ShieldCheck size={17}/><span>Privacy-first<br/><small>Anonymous option available</small></span></div></div><form className="report-form" onSubmit={submit}><div className="form-grid"><label>What kind of concern?<select value={form.category} onChange={e=>update("category",e.target.value)}><option value="">Select a category</option>{categories.filter(x=>x!=="All").map(c=><option key={c}>{c}</option>)}</select>{errors.category&&<small className="field-error">{errors.category}</small>}</label><label>Location / area<div className="input-with-icon"><MapPin size={17}/><input value={form.place} onChange={e=>update("place",e.target.value)} placeholder="e.g. Shivajinagar Bus Stop"/></div>{errors.place&&<small className="field-error">{errors.place}</small>}</label><label>Date<input type="date" value={form.date} onChange={e=>update("date",e.target.value)}/></label><label>Approx. time<input type="time" value={form.time} onChange={e=>update("time",e.target.value)}/></label></div><label>Description<textarea rows="6" value={form.description} onChange={e=>update("description",e.target.value)} placeholder="What did you notice? What context might help someone else?"></textarea>{errors.description&&<small className="field-error">{errors.description}</small>}</label><div className="anonymous-row"><div><strong>Submit anonymously</strong><p>Your name will not be shown alongside this report.</p></div><label className="switch"><input type="checkbox" checked={form.anonymous} onChange={e=>update("anonymous",e.target.checked)}/><span/></label></div><button disabled={sending} className="btn btn-berry btn-lg">{sending?"Sending…":"Submit community report →"}</button></form></div>
}
