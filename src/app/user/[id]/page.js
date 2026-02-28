"use client";
import { useEffect, useState, use } from "react";
import { supabase } from "../../../lib/supabase";
import TopBar from "../../components/TopBar";
import BottomNav from "../../components/BottomNav";
import { useRouter } from "next/navigation";

export default function UserProfile({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", id).single();
    setProfile(profileData);

    const { data: postsData } = await supabase.from("posts").select("*").eq("author_id", id).order("created_at", { ascending: false });
    setPosts(postsData || []);

    const { count: fwersCount } = await supabase.from("follows").select("*", { count:"exact", head:true }).eq("following_id", id);
    setFollowersCount(fwersCount || 0);

    const { count: fwingCount } = await supabase.from("follows").select("*", { count:"exact", head:true }).eq("follower_id", id);
    setFollowingCount(fwingCount || 0);

    if (user) {
      const { data: followData } = await supabase.from("follows").select("*").eq("follower_id", user.id).eq("following_id", id).single();
      setIsFollowing(!!followData);
    }

    setLoading(false);
  }

  async function toggleFollow() {
    setFollowLoading(true);
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", id);
      setIsFollowing(false);
      setFollowersCount(prev => prev - 1);
    } else {
      await supabase.from("follows").insert({ follower_id: currentUserId, following_id: id });
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
    }
    setFollowLoading(false);
  }

  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}><p style={{color:"#9ca3af"}}>Loading...</p></div>;
  if (!profile) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}><p style={{color:"#9ca3af"}}>User not found</p></div>;

  const isOwnProfile = currentUserId === id;

  return (
    <div>
      <TopBar />
      <div style={{padding:"16px 16px 120px 16px"}}>
        <div style={{background:"white",borderRadius:24,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",marginBottom:16}}>
          <div style={{height:96,background:"linear-gradient(to right, #E8735A, #ff9a7c)"}} />
          <div style={{padding:"0 16px 20px 16px"}}>

            <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginTop:-40,marginBottom:12}}>
              <div style={{width:80,height:80,borderRadius:"50%",border:"4px solid white",background:"#FFE4DE",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.1)"}}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                  : <span style={{color:"#E8735A",fontWeight:"bold",fontSize:28}}>{profile.full_name?.[0] || "R"}</span>
                }
              </div>
              <div style={{display:"flex",gap:8}}>
                {!isOwnProfile && (
                  <button onClick={toggleFollow} disabled={followLoading}
                    style={{background:isFollowing?"white":"#E8735A",color:isFollowing?"#E8735A":"white",border:isFollowing?"2px solid #E8735A":"none",borderRadius:999,padding:"8px 20px",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:isFollowing?"none":"0 2px 8px rgba(232,115,90,0.3)"}}>
                    {followLoading ? "..." : isFollowing ? "Following ✓" : "+ Follow"}
                  </button>
                )}
                <button onClick={() => router.back()}
                  style={{border:"1px solid #ddd",borderRadius:999,padding:"8px 16px",fontSize:13,fontWeight:600,background:"white",cursor:"pointer"}}>
                  ← Back
                </button>
              </div>
            </div>

            <h2 style={{fontSize:20,fontWeight:"bold",margin:0}}>{profile.full_name || "Researcher"}</h2>
            {(profile.degree || profile.position) && (
              <p style={{color:"#6b7280",fontSize:14,marginTop:4}}>
                {profile.degree || profile.position}{profile.institution ? " · " + profile.institution : ""}
              </p>
            )}
            {profile.bio && <p style={{color:"#374151",fontSize:14,marginTop:8,lineHeight:1.6}}>{profile.bio}</p>}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{color:"#E8735A",fontSize:13,display:"block",marginTop:4}}>
                🔗 {profile.website.replace(/https?:\/\//,"")}
              </a>
            )}

            <div style={{display:"flex",gap:24,marginTop:16,paddingTop:16,borderTop:"1px solid #f3f4f6"}}>
              {[["Posts",posts.length],["Followers",followersCount],["Following",followingCount]].map(([label,count]) => (
                <div key={label} style={{textAlign:"center"}}>
                  <p style={{fontWeight:"bold",fontSize:18,margin:0}}>{count}</p>
                  <p style={{color:"#9ca3af",fontSize:12,margin:0}}>{label}</p>
                </div>
              ))}
            </div>

            {profile.interests && profile.interests.length > 0 && (
              <div style={{marginTop:16}}>
                <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Research Interests</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {profile.interests.map(i => (
                    <span key={i} style={{background:"#FFE4DE",color:"#E8735A",fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:999}}>{i}</span>
                  ))}
                </div>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
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
        </div>

        <h3 style={{fontWeight:"bold",marginBottom:12}}>Posts ({posts.length})</h3>
        {posts.length === 0 ? (
          <div style={{textAlign:"center",padding:"40px 20px",background:"white",borderRadius:20,border:"1px solid #f3f4f6",color:"#9ca3af"}}>
            <p style={{fontWeight:600}}>No posts yet</p>
          </div>
        ) : posts.map(post => (
          <div key={post.id} style={{background:"white",borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.04)",border:"1px solid #f3f4f6"}}>
            <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
              <span style={{background:post.type==="Collaboration"?"#FFE4DE":"#dcfce7",color:post.type==="Collaboration"?"#E8735A":"#16a34a",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999}}>
                {post.type === "Collaboration" ? "🤝 Collaborator Needed" : "📄 Research Post"}
              </span>
              {post.field && <span style={{background:"#dbeafe",color:"#2563eb",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999}}>{post.field}</span>}
            </div>
            <h4 style={{fontWeight:600,margin:"0 0 4px 0",fontSize:14}}>{post.title}</h4>
            <p style={{color:"#6b7280",fontSize:13,margin:0}}>{post.description}</p>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}