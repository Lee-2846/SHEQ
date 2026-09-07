import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { login } from "../services/authService";
import { validateEmail } from "../utils/validation";

export default function Login({ setUser }) {
  const [form,setForm] = useState({email:"",password:""});
  const [error,setError] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    if (!validateEmail(form.email)) return setError("Enter a valid email address.");
    if (form.password.length < 6) return setError("Password must contain at least 6 characters.");
    setError("");
    const data = await login(form);
    setUser(data);
    navigate("/dashboard");
  }

  return <AuthLayout title="Welcome back." subtitle="Your community safety network is waiting.">
    <form onSubmit={submit} className="auth-form">
      <label>Email address<input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} type="email" placeholder="you@example.com"/></label>
      <label>Password<input value={form.password} onChange={e=>setForm({...form,password:e.target.value})} type="password" placeholder="••••••••"/></label>
      {error && <div className="form-error">{error}</div>}
      <button className="btn btn-berry w-100" type="submit">Log in</button>
      <p className="auth-switch">New to SHEQ? <Link to="/signup">Create an account</Link></p>
    </form>
  </AuthLayout>
}

function AuthLayout({title,subtitle,children}) {
  return <div className="auth-page"><div className="auth-art"><div className="brand auth-brand"><span className="brand-mark"><ShieldCheck size={19}/></span>SHEQ</div><div><div className="eyebrow light-eyebrow">COMMUNITY SAFETY</div><h1>Knowledge can change the way we move through a city.</h1><p>Share experiences. Find context. Make informed decisions.</p></div></div><div className="auth-panel"><div className="auth-content"><div className="eyebrow">SIGN IN</div><h2>{title}</h2><p>{subtitle}</p>{children}</div></div></div>
}
