"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import TopBar from "../../components/TopBar";
import BottomNav from "../../components/BottomNav";

export default function GroupChats() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupSearchResults, setGroupSearchResults] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: parts } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (!parts || parts.length === 0) {
      setLoading(false);
      return;
    }

    const ids = parts.map(p => p.conversation_id);

    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .in("id", ids)
      .eq("is_group", true)
      .order("created_at", { ascending: false });

    const enriched = await Promise.all((convos || []).map(async c => {
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const { data: memberCount } = await supabase
        .from("conversation_participants")
        .select("*", { count:"exact", head:true })
        .eq("conversation_id", c.id);

      return { ...c, lastMsg, memberCount: memberCount || 0 };
    }));

    setGroups(enriched);
    setLoading(false);
  }

  async function searchForGroup(q) {
    setGroupSearch(q);
    if (!q.trim()) { setGroupSearchResults([]); return; }
    const { data } = await supabase.from("profiles")
      .select("id, full_name, avatar_url, institution")
      .ilike("full_name", "%" + q + "%")
      .neq("id", currentUserId)
      .limit(10);
    setGroupSearchResults((data || []).filter(p => !selectedPeople.find(s => s.id === p.id)));
  }

  async function createGroupChat() {
    if (!groupName.trim() || selectedPeople.length === 0) {
      alert("Add a group name and at least one person");
      return;
    }
    const { data: conv, error } = await supabase
      .from("conversations")
      .insert({ created_by: currentUserId, is_group: true, name: groupName })
      .select().single();

    if (error || !conv) {
      alert("Error: " + (error?.message || "unknown"));
      return;
    }

    await supabase.from("conversation_participants").insert([
      { conversation_id: conv.id, user_id: currentUserId },
      ...selectedPeople.map(p => ({ conversation_id: conv.id, user_id: p.id }))
    ]);

    setShowCreate(false);
    setGroupName("");
    setSelectedPeople([]);
    router.push("/chats/" + conv.id);
  }

  function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return "now";
    if (diff < 3600) return Math.floor(diff/60) + "m";
    if (diff < 86400) return Math.floor(diff/3600) + "h";
    return Math.floor(diff/86400) + "d";
  }

  return (
    <div>
      <TopBar />
      <div style={{padding:"16px 16px 100px 16px"}}>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:"bold",margin:0}}>Group Chats</h1>
            <p style={{color:"#9ca3af",fontSize:13,margin:"4px 0 0 0"}}>Your messaging groups</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            style={{background:"#E8735A",color:"white",border:"none",borderRadius:12,padding:"10px 16px",fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:"0 2px 8px rgba(232,115,90,0.3)"}}>
            + New Group
          </button>
        </div>

        {loading ? (
          <p style={{textAlign:"center",color:"#9ca3af",padding:48}}>Loading...</p>
        ) : groups.length === 0 ? (
          <div style={{textAlign:"center",padding:"60px 20px",color:"#9ca3af",background:"white",borderRadius:20,border:"1px solid #f3f4f6"}}>
            <p style={{fontSize:40,marginBottom:8}}>👥</p>
            <p style={{fontWeight:600,fontSize:16}}>No group chats yet</p>
            <p style={{fontSize:13}}>Create one to get started!</p>
            <button onClick={() => setShowCreate(true)}
              style={{marginTop:16,background:"#E8735A",color:"white",border:"none",borderRadius:12,padding:"10px 24px",fontSize:14,fontWeight:600,cursor:"pointer"}}>
              Create Group
            </button>
          </div>
        ) : groups.map(c => (
          <div key={c.id} onClick={() => router.push("/chats/" + c.id)}
            style={{background:"white",borderRadius:16,padding:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,0.04)",border:"1px solid #f3f4f6",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
            <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#FFE4DE,#ffd4cc)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:24}}>
              👥
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}>
                <p style={{fontWeight:700,fontSize:15,margin:0,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
                  {c.name}
                </p>
                <span style={{fontSize:11,color:"#9ca3af",flexShrink:0,marginLeft:8}}>
                  {timeAgo(c.lastMsg?.created_at)}
                </span>
              </div>
              <p style={{fontSize:13,color:"#9ca3af",margin:0,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
                {c.lastMsg?.content || "No messages yet"}
              </p>
            </div>
            <span style={{color:"#9ca3af",fontSize:18}}>›</span>
          </div>
        ))}
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:"white",width:"100%",maxWidth:480,borderRadius:"24px 24px 0 0",padding:24,maxHeight:"85vh",display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <h3 style={{fontWeight:"bold",fontSize:18,margin:0}}>New Group Chat</h3>
              <button onClick={() => { setShowCreate(false); setGroupName(""); setSelectedPeople([]); }}
                style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9ca3af"}}>✕</button>
            </div>

            <input
              style={{width:"100%",border:"2px solid #f3f4f6",borderRadius:14,padding:"12px 16px",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:12,background:"#fafafa"}}
              placeholder="Group name *"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
            />

            <input
              style={{width:"100%",border:"2px solid #f3f4f6",borderRadius:14,padding:"12px 16px",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:12,background:"#fafafa"}}
              placeholder="Search people to add..."
              value={groupSearch}
              onChange={e => searchForGroup(e.target.value)}
            />

            {selectedPeople.length > 0 && (
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
                {selectedPeople.map(p => (
                  <div key={p.id} style={{display:"flex",alignItems:"center",gap:6,background:"#FFE4DE",borderRadius:999,padding:"4px 12px"}}>
                    <span style={{fontSize:13,fontWeight:600,color:"#E8735A"}}>{p.full_name}</span>
                    <button onClick={() => setSelectedPeople(prev => prev.filter(x => x.id !== p.id))}
                      style={{background:"none",border:"none",color:"#E8735A",cursor:"pointer",fontSize:14,padding:0}}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{flex:1,overflowY:"auto",marginBottom:12}}>
              {groupSearchResults.length === 0 && groupSearch && (
                <p style={{textAlign:"center",color:"#9ca3af",padding:16,fontSize:13}}>No users found</p>
              )}
              {groupSearchResults.map(person => (
                <div key={person.id}
                  onClick={() => { setSelectedPeople(prev => [...prev, person]); setGroupSearch(""); setGroupSearchResults([]); }}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #f3f4f6",cursor:"pointer"}}>
                  <div style={{width:40,height:40,borderRadius:"50%",background:"#FFE4DE",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                    {person.avatar_url
                      ? <img src={person.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                      : <span style={{color:"#E8735A",fontWeight:"bold"}}>{person.full_name?.[0]||"R"}</span>
                    }
                  </div>
                  <div style={{flex:1}}>
                    <p style={{fontWeight:600,margin:0,fontSize:14}}>{person.full_name}</p>
                    <p style={{fontSize:12,color:"#9ca3af",margin:0}}>{person.institution}</p>
                  </div>
                  <span style={{color:"#E8735A",fontSize:20,fontWeight:"bold"}}>+</span>
                </div>
              ))}
            </div>

            <button onClick={createGroupChat}
              style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#E8735A,#ff9a7c)",color:"white",border:"none",borderRadius:14,fontWeight:700,fontSize:15,cursor:"pointer",boxShadow:"0 4px 15px rgba(232,115,90,0.3)"}}>
              Create Group Chat 🚀
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}