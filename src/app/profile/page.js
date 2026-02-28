"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { useRouter } from "next/navigation";

const FIELDS = ["Medical","Engineering","Psychology","Business","Technology","Biology","Chemistry","Physics","Mathematics","Law"];
const DEGREES = ["High School","Bachelor's Degree","Master's Degree","PhD","Postdoctoral","Professor","MD","MBBS","BDS","Other"];
const SKILLS_LIST = ["Python","R","MATLAB","Data Analysis","Machine Learning","Clinical Research","Lab Work","Statistics","Writing","Project Management","Literature Review","Bioinformatics","Deep Learning","Molecular Biology","Chemistry","Physics","Mathematics"];

const inp = {width:"100%",border:"2px solid #f3f4f6",borderRadius:14,padding:"12px 16px",fontSize:14,outline:"none",boxSizing:"border-box",background:"#fafafa"};
const lbl = {fontSize:12,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:0.5,display:"block",marginBottom:6};

export default function Profile() {
  const router = useRouter();
  const fileRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [myPosts, setMyPosts] = useState([]);
  const [uid, setUid] = useState("");
  const [fullName, setFullName] = useState("");
  const [institution, setInstitution] = useState("");
  const [degree, setDegree] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [interests, setInterests] = useState([]);
  const [skills, setSkills] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUid(user.id);

    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) {
      setProfile(data);
      setFullName(data.full_name || "");
      setInstitution(data.institution || "");
      setDegree(data.degree || data.position || "");
      setBio(data.bio || "");
      setWebsite(data.website || "");
      setInterests(data.interests || []);
      setSkills(data.skills || []);
      setAvatarUrl(data.avatar_url || "");
    }

    const { data: posts } = await supabase.from("posts").select("*")
      .eq("author_id", user.id).order("created_at", { ascending: false });
    setMyPosts(posts || []);

    const { count: fwers } = await supabase.from("follows")
      .select("*", { count:"exact", head:true }).eq("following_id", user.id);
    setFollowersCount(fwers || 0);

    const { count: fwing } = await supabase.from("follows")
      .select("*", { count:"exact", head:true }).eq("follower_id", user.id);
    setFollowingCount(fwing || 0);

    setLoading(false);
  }

  async function loadFollowers() {
    const { data } = await supabase.from("follows")
      .select("*, profile:profiles!follows_follower_id_fkey(id, full_name, avatar_url, institution)")
      .eq("following_id", uid);
    setFollowersList(data || []);
    setShowFollowers(true);
  }

  async function loadFollowing() {
    const { data } = await supabase.from("follows")
      .select("*, profile:profiles!follows_following_id_fkey(id, full_name, avatar_url, institution)")
      .eq("follower_id", uid);
    setFollowingList(data || []);
    setShowFollowing(true);
  }

  async function uploadPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fileName = uid + "_" + Date.now() + "." + file.name.split(".").pop();
    const { error: upErr } = await supabase.storage.from("Avatar").upload(fileName, file, { upsert: true });
    if (upErr) { setError("Upload failed: " + upErr.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("Avatar").getPublicUrl(fileName);
    const url = urlData.publicUrl;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", uid);
    setAvatarUrl(url);
    setUploading(false);
  }

  async function save() {
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("profiles").update({
      full_name: fullName, institution, degree, position: degree,
      bio, website, interests, skills, avatar_url: avatarUrl
    }).eq("id", uid);
    if (err) { setError("Could not save: " + err.message); setSaving(false); return; }
    setProfile(p => ({ ...p, full_name: fullName, institution, degree, bio, website, interests, skills, avatar_url: avatarUrl }));
    setEditing(false);
    setSaving(false);
  }

  async function deletePost(postId) {
    if (!confirm("Delete this post?")) return;
    await supabase.from("posts").delete().eq("id", postId);
    setMyPosts(prev => prev.filter(p => p.id !== postId));
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function toggle(arr, setArr, val) {
    setArr(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  }

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
      <p style={{color:"#9ca3af"}}>Loading...</p>
    </div>
  );

  return (
    <div>
      <TopBar />
      <div style={{padding:"16px 16px 120px 16px"}}>

        <div style={{background:"white",borderRadius:24,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",marginBottom:16}}>
          <div style={{height:96,background:"linear-gradient(to right, #E8735A, #ff9a7c)"}} />
          <div style={{padding:"0 16px 20px 16px"}}>

            <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginTop:-40,marginBottom:12}}>
              <div style={{position:"relative"}}>
                <div onClick={() => fileRef.current.click()}
                  style={{width:80,height:80,borderRadius:"50%",border:"4px solid white",background:"#FFE4DE",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",cursor:"pointer"}}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    : <span style={{color:"#E8735A",fontWeight:"bold",fontSize:28}}>{fullName?.[0] || "R"}</span>
                  }
                </div>
                <div onClick={() => fileRef.current.click()}
                  style={{position:"absolute",bottom:0,right:0,width:26,height:26,background:"#E8735A",borderRadius:"50%",border:"2px solid white",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:11,color:"white",fontWeight:"bold"}}>
                  +
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={uploadPhoto} />
                {uploading && (
                  <div style={{position:"absolute",inset:0,borderRadius:"50%",background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{color:"white",fontSize:11,fontWeight:600}}>...</span>
                  </div>
                )}
              </div>

              <div style={{display:"flex",gap:8,marginTop:44}}>
                {!editing ? (
                  <>
                    <button onClick={() => setEditing(true)}
                      style={{border:"1px solid #ddd",borderRadius:999,padding:"6px 14px",fontSize:13,fontWeight:600,background:"white",cursor:"pointer"}}>
                      Edit
                    </button>
                    <button onClick={logout}
                      style={{border:"1px solid #fecaca",borderRadius:999,padding:"6px 14px",fontSize:13,fontWeight:600,color:"#ef4444",background:"white",cursor:"pointer"}}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={save} disabled={saving}
                      style={{background:"#E8735A",color:"white",borderRadius:999,padding:"6px 14px",fontSize:13,fontWeight:600,border:"none",cursor:"pointer"}}>
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => setEditing(false)}
                      style={{border:"1px solid #ddd",borderRadius:999,padding:"6px 14px",fontSize:13,fontWeight:600,background:"white",cursor:"pointer"}}>
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div style={{background:"#fef2f2",color:"#ef4444",padding:"10px 14px",borderRadius:12,marginBottom:12,fontSize:13}}>
                {error}
              </div>
            )}

            {!editing && (
              <div>
                <h2 style={{fontSize:20,fontWeight:"bold",margin:0}}>{profile?.full_name || "Your Name"}</h2>
                {(profile?.degree || profile?.position) && (
                  <p style={{color:"#6b7280",fontSize:14,marginTop:4}}>
                    {profile.degree || profile.position}
                    {profile.institution ? " · " + profile.institution : ""}
                  </p>
                )}
                {profile?.bio && (
                  <p style={{color:"#374151",fontSize:14,marginTop:8,lineHeight:1.6}}>{profile.bio}</p>
                )}
                {profile?.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer"
                    style={{color:"#E8735A",fontSize:13,display:"block",marginTop:4,textDecoration:"none"}}>
                    {profile.website.replace(/https?:\/\//,"")}
                  </a>
                )}

                {/* Stats — clickable followers/following */}
                <div style={{display:"flex",gap:24,marginTop:16,paddingTop:16,borderTop:"1px solid #f3f4f6"}}>
                  <div style={{textAlign:"center"}}>
                    <p style={{fontWeight:"bold",fontSize:18,margin:0}}>{myPosts.length}</p>
                    <p style={{color:"#9ca3af",fontSize:12,margin:0}}>Posts</p>
                  </div>
                  <div style={{textAlign:"center",cursor:"pointer"}} onClick={loadFollowers}>
                    <p style={{fontWeight:"bold",fontSize:18,margin:0,color:"#E8735A"}}>{followersCount}</p>
                    <p style={{color:"#9ca3af",fontSize:12,margin:0}}>Followers</p>
                  </div>
                  <div style={{textAlign:"center",cursor:"pointer"}} onClick={loadFollowing}>
                    <p style={{fontWeight:"bold",fontSize:18,margin:0,color:"#E8735A"}}>{followingCount}</p>
                    <p style={{color:"#9ca3af",fontSize:12,margin:0}}>Following</p>
                  </div>
                </div>

                {profile?.interests && profile.interests.length > 0 && (
                  <div style={{marginTop:16}}>
                    <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Research Interests</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {profile.interests.map(i => (
                        <span key={i} style={{background:"#FFE4DE",color:"#E8735A",fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:999}}>{i}</span>
                      ))}
                    </div>
                  </div>
                )}

                {profile?.skills && profile.skills.length > 0 && (
                  <div style={{marginTop:16}}>
                    <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Skills</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {profile.skills.map(s => (
                        <span key={s} style={{background:"#eff6ff",color:"#2563eb",fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:999}}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {editing && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <label style={lbl}>Full Name</label>
                  <input style={inp} placeholder="Dr. Jane Smith" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Degree</label>
                  <select style={inp} value={degree} onChange={e => setDegree(e.target.value)}>
                    <option value="">Select your degree</option>
                    {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Institution</label>
                  <input style={inp} placeholder="MIT, Stanford..." value={institution} onChange={e => setInstitution(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Bio</label>
                  <textarea style={{...inp,resize:"none"}} rows={3} value={bio} onChange={e => setBio(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Website</label>
                  <input style={inp} placeholder="https://..." value={website} onChange={e => setWebsite(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Research Interests</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:4}}>
                    {FIELDS.map(f => (
                      <button key={f} type="button" onClick={() => toggle(interests, setInterests, f)}
                        style={{padding:"6px 14px",borderRadius:999,fontSize:12,fontWeight:600,cursor:"pointer",border:interests.includes(f)?"none":"1px solid #d1d5db",background:interests.includes(f)?"#E8735A":"white",color:interests.includes(f)?"white":"#6b7280"}}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Skills</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:4}}>
                    {SKILLS_LIST.map(s => (
                      <button key={s} type="button" onClick={() => toggle(skills, setSkills, s)}
                        style={{padding:"6px 14px",borderRadius:999,fontSize:12,fontWeight:600,cursor:"pointer",border:skills.includes(s)?"none":"1px solid #d1d5db",background:skills.includes(s)?"#2563eb":"white",color:skills.includes(s)?"white":"#6b7280"}}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Posts Tab */}
        {!editing && (
          <>
            <h3 style={{fontWeight:"bold",marginBottom:12}}>My Posts ({myPosts.length})</h3>
            {myPosts.length === 0 ? (
              <div style={{textAlign:"center",padding:"40px 20px",background:"white",borderRadius:20,border:"1px solid #f3f4f6",color:"#9ca3af"}}>
                <p style={{fontWeight:600,marginBottom:4}}>No posts yet</p>
                <p style={{fontSize:13}}>Share your first research!</p>
              </div>
            ) : myPosts.map(post => (
              <div key={post.id} style={{background:"white",borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.04)",border:"1px solid #f3f4f6"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <span style={{background:post.type==="Collaboration"?"#FFE4DE":"#dcfce7",color:post.type==="Collaboration"?"#E8735A":"#16a34a",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999}}>
                      {post.type === "Collaboration" ? "Collaborator Needed" : "Research Post"}
                    </span>
                    {post.field && (
                      <span style={{background:"#dbeafe",color:"#2563eb",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999}}>
                        {post.field}
                      </span>
                    )}
                  </div>
                  <button onClick={() => deletePost(post.id)}
                    style={{background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0,marginLeft:8}}>
                    Delete
                  </button>
                </div>
                <h4 style={{fontWeight:600,margin:"0 0 4px 0",fontSize:14}}>{post.title}</h4>
                <p style={{color:"#6b7280",fontSize:13,margin:0}}>{post.description}</p>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Followers Modal */}
      {showFollowers && (
        <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:"white",width:"100%",maxWidth:480,borderRadius:"24px 24px 0 0",padding:24,maxHeight:"75vh",display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <h3 style={{fontWeight:"bold",fontSize:18,margin:0}}>Followers ({followersCount})</h3>
              <button onClick={() => setShowFollowers(false)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9ca3af"}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:"auto"}}>
              {followersList.length === 0 ? (
                <p style={{textAlign:"center",color:"#9ca3af",padding:32}}>No followers yet</p>
              ) : followersList.map(f => (
                <div key={f.follower_id} onClick={() => { setShowFollowers(false); router.push("/user/" + f.profile?.id); }}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #f3f4f6",cursor:"pointer"}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:"#FFE4DE",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                    {f.profile?.avatar_url
                      ? <img src={f.profile.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                      : <span style={{color:"#E8735A",fontWeight:"bold"}}>{f.profile?.full_name?.[0]||"R"}</span>
                    }
                  </div>
                  <div style={{flex:1}}>
                    <p style={{fontWeight:600,margin:0}}>{f.profile?.full_name}</p>
                    <p style={{fontSize:12,color:"#9ca3af",margin:0}}>{f.profile?.institution}</p>
                  </div>
                  <span style={{color:"#9ca3af",fontSize:18}}>›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:"white",width:"100%",maxWidth:480,borderRadius:"24px 24px 0 0",padding:24,maxHeight:"75vh",display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <h3 style={{fontWeight:"bold",fontSize:18,margin:0}}>Following ({followingCount})</h3>
              <button onClick={() => setShowFollowing(false)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9ca3af"}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:"auto"}}>
              {followingList.length === 0 ? (
                <p style={{textAlign:"center",color:"#9ca3af",padding:32}}>Not following anyone yet</p>
              ) : followingList.map(f => (
                <div key={f.following_id} onClick={() => { setShowFollowing(false); router.push("/user/" + f.profile?.id); }}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #f3f4f6",cursor:"pointer"}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:"#FFE4DE",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                    {f.profile?.avatar_url
                      ? <img src={f.profile.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                      : <span style={{color:"#E8735A",fontWeight:"bold"}}>{f.profile?.full_name?.[0]||"R"}</span>
                    }
                  </div>
                  <div style={{flex:1}}>
                    <p style={{fontWeight:600,margin:0}}>{f.profile?.full_name}</p>
                    <p style={{fontSize:12,color:"#9ca3af",margin:0}}>{f.profile?.institution}</p>
                  </div>
                  <span style={{color:"#9ca3af",fontSize:18}}>›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}