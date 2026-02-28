"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push("/dashboard");
  }

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(160deg, #fff5f3 0%, #ffffff 50%, #fff0ed 100%)",
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      justifyContent:"center",
      padding:"24px 20px",
      position:"relative",
      overflow:"hidden",
      fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>

      {/* Background decorative blobs */}
      <div style={{position:"absolute",top:-100,right:-100,width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle, rgba(232,115,90,0.1) 0%, transparent 70%)",pointerEvents:"none"}} />
      <div style={{position:"absolute",bottom:-80,left:-80,width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle, rgba(232,115,90,0.07) 0%, transparent 70%)",pointerEvents:"none"}} />

      <div style={{width:"100%",maxWidth:400,position:"relative",zIndex:1}}>

        {/* Logo + Tagline */}
        <div style={{textAlign:"center",marginBottom:40}}>
          <img src="/logo.png" alt="ResearchLink" style={{height:52,objectFit:"contain",marginBottom:20}} />

          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:0,marginBottom:12}}>
            {["Connect","Collaborate","Grow"].map((word, i) => (
              <div key={word} style={{display:"flex",alignItems:"center"}}>
                <span style={{
                  fontSize:11,
                  fontWeight:700,
                  color: i===1?"#E8735A":"#9ca3af",
                  letterSpacing:2,
                  textTransform:"uppercase"
                }}>
                  {word}
                </span>
                {i < 2 && (
                  <div style={{width:4,height:4,borderRadius:"50%",background:"#E8735A",margin:"0 10px"}} />
                )}
              </div>
            ))}
          </div>
          <p style={{color:"#9ca3af",fontSize:13,margin:0,letterSpacing:0.3}}>
            The platform built for researchers
          </p>
        </div>

        {/* Card */}
        <div style={{
          background:"white",
          borderRadius:24,
          padding:"36px 32px",
          boxShadow:"0 4px 32px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
          border:"1px solid #f3f4f6"
        }}>
          <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 4px 0",color:"#111827",letterSpacing:-0.3}}>
            Sign In
          </h2>
          <p style={{color:"#9ca3af",fontSize:14,margin:"0 0 28px 0"}}>
            Welcome back. Enter your credentials to continue.
          </p>

          {error && (
            <div style={{background:"#fef2f2",color:"#dc2626",padding:"11px 14px",borderRadius:10,marginBottom:16,fontSize:13,border:"1px solid #fecaca"}}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:18}}>

            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#6b7280",display:"block",marginBottom:7,textTransform:"uppercase",letterSpacing:1}}>
                Email Address
              </label>
              <input
                type="email"
                required
                style={{width:"100%",border:"1.5px solid #e5e7eb",borderRadius:12,padding:"13px 16px",fontSize:14,outline:"none",boxSizing:"border-box",background:"#fafafa",color:"#111827",transition:"border-color 0.2s"}}
                placeholder="you@university.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={e => { e.target.style.borderColor="#E8735A"; e.target.style.background="white"; }}
                onBlur={e => { e.target.style.borderColor="#e5e7eb"; e.target.style.background="#fafafa"; }}
              />
            </div>

            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#6b7280",display:"block",marginBottom:7,textTransform:"uppercase",letterSpacing:1}}>
                Password
              </label>
              <div style={{position:"relative"}}>
                <input
                  type={showPass?"text":"password"}
                  required
                  style={{width:"100%",border:"1.5px solid #e5e7eb",borderRadius:12,padding:"13px 48px 13px 16px",fontSize:14,outline:"none",boxSizing:"border-box",background:"#fafafa",color:"#111827"}}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={e => { e.target.style.borderColor="#E8735A"; e.target.style.background="white"; }}
                  onBlur={e => { e.target.style.borderColor="#e5e7eb"; e.target.style.background="#fafafa"; }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#9ca3af",fontWeight:600,letterSpacing:0.5}}>
                  {showPass ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width:"100%",
                padding:"14px",
                background:loading?"#f3f4f6":"linear-gradient(135deg, #E8735A 0%, #d4624a 100%)",
                color:loading?"#9ca3af":"white",
                border:"none",
                borderRadius:12,
                fontWeight:700,
                fontSize:14,
                cursor:loading?"not-allowed":"pointer",
                letterSpacing:0.5,
                marginTop:4,
                boxShadow:loading?"none":"0 4px 16px rgba(232,115,90,0.35)"
              }}>
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </form>

          <div style={{display:"flex",alignItems:"center",gap:12,margin:"24px 0"}}>
            <div style={{flex:1,height:1,background:"#f3f4f6"}} />
            <span style={{fontSize:11,color:"#d1d5db",fontWeight:600,letterSpacing:1}}>OR</span>
            <div style={{flex:1,height:1,background:"#f3f4f6"}} />
          </div>

          <div style={{textAlign:"center"}}>
            <p style={{color:"#6b7280",fontSize:14,margin:0}}>
              Don't have an account?{" "}
              <span onClick={() => router.push("/signup")}
                style={{color:"#E8735A",fontWeight:700,cursor:"pointer"}}>
                Create Account
              </span>
            </p>
          </div>
        </div>

        {/* Bottom tagline */}
        <div style={{display:"flex",justifyContent:"center",gap:0,marginTop:32}}>
          {["Research","Collaborate","Publish","Grow"].map((word, i) => (
            <div key={word} style={{display:"flex",alignItems:"center"}}>
              <span style={{fontSize:11,color:"#d1d5db",fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>
                {word}
              </span>
              {i < 3 && <div style={{width:3,height:3,borderRadius:"50%",background:"#E8735A",margin:"0 10px",opacity:0.5}} />}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}