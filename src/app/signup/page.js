"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

const FIELDS = ["Medical","Engineering","Psychology","Business","Technology","Biology","Chemistry","Physics","Mathematics","Law"];
const DEGREES = ["High School","Bachelor's Degree","Master's Degree","PhD","Postdoctoral","Professor","MD","MBBS","BDS","Other"];

export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [institution, setInstitution] = useState("");
  const [degree, setDegree] = useState("");
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  function toggleInterest(val) {
    setInterests(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  }

  async function handleSignup() {
    if (!email || !password || !fullName) {
      setError("Please fill all required fields");
      return;
    }
    setLoading(true);
    setError("");

    const { data, error: err } = await supabase.auth.signUp({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
        institution,
        degree,
        position: degree,
        interests,
        email,
      });
    }

    setLoading(false);
    router.push("/dashboard");
  }

  const inp = {
    width:"100%",
    border:"1.5px solid #e5e7eb",
    borderRadius:12,
    padding:"13px 16px",
    fontSize:14,
    outline:"none",
    boxSizing:"border-box",
    background:"#fafafa",
    color:"#111827",
    fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  };

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

      {/* Background blobs */}
      <div style={{position:"absolute",top:-100,right:-100,width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle, rgba(232,115,90,0.1) 0%, transparent 70%)",pointerEvents:"none"}} />
      <div style={{position:"absolute",bottom:-80,left:-80,width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle, rgba(232,115,90,0.07) 0%, transparent 70%)",pointerEvents:"none"}} />

      <div style={{width:"100%",maxWidth:420,position:"relative",zIndex:1}}>

        {/* Logo + Tagline */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <img src="/logo.png" alt="ResearchLink" style={{height:52,objectFit:"contain",marginBottom:20}} />

          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:0,marginBottom:10}}>
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
            Join the research community
          </p>
        </div>

        {/* Step indicator */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:0,marginBottom:20}}>
          {[1,2].map((s,i) => (
            <div key={s} style={{display:"flex",alignItems:"center"}}>
              <div style={{
                width:28,height:28,borderRadius:"50%",
                background:step>=s?"#E8735A":"#f3f4f6",
                color:step>=s?"white":"#9ca3af",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:11,fontWeight:700,letterSpacing:0.5
              }}>
                {step>s ? "✓" : "0"+s}
              </div>
              {i < 1 && (
                <div style={{width:60,height:2,background:step>1?"#E8735A":"#f3f4f6",transition:"background 0.3s"}} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background:"white",
          borderRadius:24,
          padding:"36px 32px",
          boxShadow:"0 4px 32px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
          border:"1px solid #f3f4f6"
        }}>

          {error && (
            <div style={{background:"#fef2f2",color:"#dc2626",padding:"11px 14px",borderRadius:10,marginBottom:16,fontSize:13,border:"1px solid #fecaca"}}>
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 4px 0",color:"#111827",letterSpacing:-0.3}}>
                Create Account
              </h2>
              <p style={{color:"#9ca3af",fontSize:14,margin:"0 0 24px 0"}}>
                Step 1 of 2 — Basic information
              </p>

              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"#6b7280",display:"block",marginBottom:7,textTransform:"uppercase",letterSpacing:1}}>
                    Full Name *
                  </label>
                  <input
                    style={inp}
                    placeholder="Dr. Jane Smith"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    onFocus={e => { e.target.style.borderColor="#E8735A"; e.target.style.background="white"; }}
                    onBlur={e => { e.target.style.borderColor="#e5e7eb"; e.target.style.background="#fafafa"; }}
                  />
                </div>

                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"#6b7280",display:"block",marginBottom:7,textTransform:"uppercase",letterSpacing:1}}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    style={inp}
                    placeholder="you@university.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={e => { e.target.style.borderColor="#E8735A"; e.target.style.background="white"; }}
                    onBlur={e => { e.target.style.borderColor="#e5e7eb"; e.target.style.background="#fafafa"; }}
                  />
                </div>

                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"#6b7280",display:"block",marginBottom:7,textTransform:"uppercase",letterSpacing:1}}>
                    Password *
                  </label>
                  <div style={{position:"relative"}}>
                    <input
                      type={showPass?"text":"password"}
                      style={{...inp,paddingRight:64}}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={e => { e.target.style.borderColor="#E8735A"; e.target.style.background="white"; }}
                      onBlur={e => { e.target.style.borderColor="#e5e7eb"; e.target.style.background="#fafafa"; }}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#9ca3af",fontWeight:700,letterSpacing:0.5}}>
                      {showPass?"HIDE":"SHOW"}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"#6b7280",display:"block",marginBottom:7,textTransform:"uppercase",letterSpacing:1}}>
                    Institution
                  </label>
                  <input
                    style={inp}
                    placeholder="MIT, Harvard, Stanford..."
                    value={institution}
                    onChange={e => setInstitution(e.target.value)}
                    onFocus={e => { e.target.style.borderColor="#E8735A"; e.target.style.background="white"; }}
                    onBlur={e => { e.target.style.borderColor="#e5e7eb"; e.target.style.background="#fafafa"; }}
                  />
                </div>

                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"#6b7280",display:"block",marginBottom:7,textTransform:"uppercase",letterSpacing:1}}>
                    Degree
                  </label>
                  <select
                    style={{...inp,appearance:"none"}}
                    value={degree}
                    onChange={e => setDegree(e.target.value)}
                    onFocus={e => { e.target.style.borderColor="#E8735A"; e.target.style.background="white"; }}
                    onBlur={e => { e.target.style.borderColor="#e5e7eb"; e.target.style.background="#fafafa"; }}>
                    <option value="">Select your degree</option>
                    {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <button
                  onClick={() => {
                    if (!fullName || !email || !password) { setError("Please fill all required fields"); return; }
                    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
                    setError(""); setStep(2);
                  }}
                  style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#E8735A 0%,#d4624a 100%)",color:"white",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",letterSpacing:0.5,boxShadow:"0 4px 16px rgba(232,115,90,0.35)",marginTop:4}}>
                  CONTINUE
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 4px 0",color:"#111827",letterSpacing:-0.3}}>
                Research Interests
              </h2>
              <p style={{color:"#9ca3af",fontSize:14,margin:"0 0 20px 0"}}>
                Step 2 of 2 — Select your fields of interest
              </p>

              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
                {FIELDS.map(f => (
                  <button key={f} type="button" onClick={() => toggleInterest(f)}
                    style={{
                      padding:"8px 16px",
                      borderRadius:8,
                      fontSize:12,
                      fontWeight:600,
                      cursor:"pointer",
                      border:interests.includes(f)?"1.5px solid #E8735A":"1.5px solid #e5e7eb",
                      background:interests.includes(f)?"#E8735A":"white",
                      color:interests.includes(f)?"white":"#6b7280",
                      letterSpacing:0.3,
                      transition:"all 0.15s"
                    }}>
                    {f}
                  </button>
                ))}
              </div>

              {interests.length > 0 && (
                <div style={{background:"#fafafa",border:"1px solid #f3f4f6",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#6b7280"}}>
                  {interests.length} field{interests.length > 1 ? "s" : ""} selected
                </div>
              )}

              <div style={{display:"flex",gap:10}}>
                <button onClick={() => setStep(1)}
                  style={{flex:1,padding:"13px",background:"white",color:"#6b7280",border:"1.5px solid #e5e7eb",borderRadius:12,fontWeight:600,fontSize:13,cursor:"pointer",letterSpacing:0.5}}>
                  BACK
                </button>
                <button onClick={handleSignup} disabled={loading}
                  style={{flex:2,padding:"13px",background:loading?"#f3f4f6":"linear-gradient(135deg,#E8735A 0%,#d4624a 100%)",color:loading?"#9ca3af":"white",border:"none",borderRadius:12,fontWeight:700,fontSize:13,cursor:loading?"not-allowed":"pointer",letterSpacing:0.5,boxShadow:loading?"none":"0 4px 16px rgba(232,115,90,0.35)"}}>
                  {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
                </button>
              </div>
            </div>
          )}

          <div style={{display:"flex",alignItems:"center",gap:12,margin:"24px 0 0 0"}}>
            <div style={{flex:1,height:1,background:"#f3f4f6"}} />
            <span style={{fontSize:11,color:"#d1d5db",fontWeight:600,letterSpacing:1}}>OR</span>
            <div style={{flex:1,height:1,background:"#f3f4f6"}} />
          </div>

          <div style={{textAlign:"center",marginTop:16}}>
            <p style={{color:"#6b7280",fontSize:14,margin:0}}>
              Already have an account?{" "}
              <span onClick={() => router.push("/login")}
                style={{color:"#E8735A",fontWeight:700,cursor:"pointer"}}>
                Sign In
              </span>
            </p>
          </div>
        </div>

        {/* Bottom wordmark */}
        <div style={{display:"flex",justifyContent:"center",gap:0,marginTop:28}}>
          {["Research","Collaborate","Publish","Grow"].map((word, i) => (
            <div key={word} style={{display:"flex",alignItems:"center"}}>
              <span style={{fontSize:10,color:"#d1d5db",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>
                {word}
              </span>
              {i < 3 && <div style={{width:3,height:3,borderRadius:"50%",background:"#E8735A",margin:"0 10px",opacity:0.4}} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}