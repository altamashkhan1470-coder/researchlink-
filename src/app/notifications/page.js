"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data } = await supabase
      .from("notifications")
      .select("*, from_profile:profiles!notifications_from_user_id_fkey(id, full_name, avatar_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    setNotifications(data || []);

    // Mark all as read
    await supabase.from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setLoading(false);
  }

  async function deleteNotification(id) {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  async function clearAll() {
    await supabase.from("notifications").delete().eq("user_id", currentUserId);
    setNotifications([]);
  }

  function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff/60) + "m ago";
    if (diff < 86400) return Math.floor(diff/3600) + "h ago";
    return Math.floor(diff/86400) + "d ago";
  }

  function getIcon(type) {
    if (type === "follow") return { bg:"#dbeafe", color:"#2563eb", text:"👤" };
    if (type === "like") return { bg:"#fce7f3", color:"#db2777", text:"♥" };
    if (type === "comment") return { bg:"#dcfce7", color:"#16a34a", text:"💬" };
    if (type === "new_post") return { bg:"#FFE4DE", color:"#E8735A", text:"📄" };
    return { bg:"#f3f4f6", color:"#6b7280", text:"🔔" };
  }

  return (
    <div>
      <TopBar />
      <div style={{padding:"16px 16px 100px 16px"}}>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:"bold",margin:0}}>Notifications</h1>
            <p style={{color:"#9ca3af",fontSize:13,margin:"4px 0 0 0"}}>
              {notifications.filter(n => !n.is_read).length > 0
                ? notifications.filter(n => !n.is_read).length + " unread"
                : "All caught up"}
            </p>
          </div>
          {notifications.length > 0 && (
            <button onClick={clearAll}
              style={{background:"none",border:"1px solid #e5e7eb",borderRadius:10,padding:"6px 14px",fontSize:12,fontWeight:600,color:"#6b7280",cursor:"pointer"}}>
              Clear All
            </button>
          )}
        </div>

        {loading ? (
          <p style={{textAlign:"center",color:"#9ca3af",padding:48}}>Loading...</p>
        ) : notifications.length === 0 ? (
          <div style={{textAlign:"center",padding:"60px 20px",background:"white",borderRadius:20,border:"1px solid #f3f4f6",color:"#9ca3af"}}>
            <div style={{fontSize:48,marginBottom:12}}>🔔</div>
            <p style={{fontWeight:600,fontSize:16,margin:"0 0 4px 0"}}>No notifications yet</p>
            <p style={{fontSize:13,margin:0}}>When someone follows, likes or comments, you'll see it here</p>
          </div>
        ) : notifications.map(n => {
          const icon = getIcon(n.type);
          return (
            <div key={n.id}
              style={{background:n.is_read?"white":"#FFFAF9",borderRadius:16,padding:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,0.04)",border:n.is_read?"1px solid #f3f4f6":"1px solid #FFE4DE",display:"flex",alignItems:"center",gap:12}}>

              {/* From user avatar or icon */}
              <div style={{position:"relative",flexShrink:0}}>
                <div style={{width:46,height:46,borderRadius:"50%",background:"#FFE4DE",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",cursor:n.from_profile?"pointer":"default"}}
                  onClick={() => n.from_profile && router.push("/user/" + n.from_profile.id)}>
                  {n.from_profile?.avatar_url
                    ? <img src={n.from_profile.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    : <span style={{color:"#E8735A",fontWeight:"bold",fontSize:18}}>{n.from_profile?.full_name?.[0] || "R"}</span>
                  }
                </div>
                <div style={{position:"absolute",bottom:-2,right:-2,width:20,height:20,borderRadius:"50%",background:icon.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,border:"2px solid white"}}>
                  {icon.text}
                </div>
              </div>

              {/* Content */}
              <div style={{flex:1,minWidth:0}}
                onClick={() => n.post_id && router.push("/dashboard")}>
                <p style={{fontWeight:n.is_read?500:700,fontSize:14,margin:"0 0 3px 0",color:"#111827",cursor:n.post_id?"pointer":"default"}}>
                  {n.title}
                </p>
                <p style={{fontSize:13,color:"#6b7280",margin:"0 0 4px 0",lineHeight:1.4}}>
                  {n.body}
                </p>
                <p style={{fontSize:11,color:"#9ca3af",margin:0,fontWeight:500}}>
                  {timeAgo(n.created_at)}
                </p>
              </div>

              {/* Unread dot + delete */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,flexShrink:0}}>
                {!n.is_read && (
                  <div style={{width:8,height:8,borderRadius:"50%",background:"#E8735A"}} />
                )}
                <button onClick={() => deleteNotification(n.id)}
                  style={{background:"none",border:"none",color:"#d1d5db",cursor:"pointer",fontSize:16,lineHeight:1,padding:2}}>
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <BottomNav />
    </div>
  );
}