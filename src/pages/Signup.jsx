import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../services/authService";
import { validateEmail } from "../utils/validation";

export default function Signup({setUser}) {
  const [form,setForm] = useState({name:"",email:"",password:""});
  const [error,setError] = useState("");
  const navigate=useNavigate();
  async function submit(e){
    e.preventDefault();
    if(!form.name.trim()) return setError("Please enter your name.");
    if(!validateEmail(form.email)) return setError("Enter a valid email.");
    if(form.password.length<6) return setError("Password must contain at least 6 characters.");
    setError("");
    const data=await signup(form); setUser(data); navigate("/dashboard");
  }
  return <div className="auth-page"><div className="auth-art signup-art"><div className="brand auth-brand">SHEQ</div><div><div className="eyebrow light-eyebrow">JOIN THE NETWORK</div><h1>Your experience could help someone else.</h1><p>Become part of a community turning local observations into useful context.</p></div></div><div className="auth-panel"><div className="auth-content"><div className="eyebrow">CREATE ACCOUNT</div><h2>Let's get you started.</h2><p>You can still choose anonymous reporting for individual incidents.</p><form onSubmit={submit} className="auth-form"><label>Full name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label><label>Email address<input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} type="email" placeholder="you@example.com"/></label><label>Password<input value={form.password} onChange={e=>setForm({...form,password:e.target.value})} type="password" placeholder="At least 6 characters"/></label>{error&&<div className="form-error">{error}</div>}<button className="btn btn-berry w-100">Create account</button><p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p></form></div></div></div>
}
