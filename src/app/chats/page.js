"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";

export default function Chats() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupSearchResults, setGroupSearchResults] = useState([]);
  const [tab, setTab] = useState("all");

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);
    await loadConversations(user.id);
    setLoading(false);
  }

  async function loadConversations(uid) {
    const { data: parts } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", uid);

    if (!parts || parts.length === 0) return;
    const ids = parts.map(p => p.conversation_id);

    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .in("id", ids)
      .order("created_at", { ascending: false });

    const enriched = await Promise.all((convos || []).map(async c => {
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!c.is_group) {
        const { data: otherParts } = await supabase
          .from("conversation_participants")
          .select("*, profile:profiles(id, full_name, avatar_url)")
          .eq("conversation_id", c.id)
          .neq("user_id", uid);
        return { ...c, lastMsg, otherUser: otherParts?.[0]?.profile };
      }
      return { ...c, lastMsg };
    }));

    setConversations(enriched);
  }

  async function searchUsers(q) {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const { data } = await supabase.from("profiles")
      .select("id, full_name, avatar_url, institution")
      .ilike("full_name", "%" + q + "%")
      .neq("id", currentUserId)
      .limit(10);
    setSearchResults(data || []);
  }

  async function startDM(person) {
    try {
      const { data: existing } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", currentUserId);

      const myIds = (existing || []).map(e => e.conversation_id);

      if (myIds.length > 0) {
        const { data: shared } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", person.id)
          .in("conversation_id", myIds);

        if (shared && shared.length > 0) {
          for (const s of shared) {
            const { data: c } = await supabase
              .from("conversations")
              .select("*")
              .eq("id", s.conversation_id)
              .eq("is_group", false)
              .single();
            if (c) {
              setShowNewChat(false);
              router.push("/chats/" + c.id);
              return;
            }
          }
        }
      }

      const { data: conv, error } = await supabase
        .from("conversations")
        .insert({ created_by: currentUserId, is_group: false })
        .select()
        .single();

      if (error || !conv) {
        alert("Error: " + (error?.message || "unknown"));
        return;
      }

      await supabase.from("conversation_participants").insert([
        { conversation_id: conv.id, user_id: currentUserId },
        { conversation_id: conv.id, user_id: person.id }
      ]);

      setShowNewChat(false);
      router.push("/chats/" + conv.id);
    } catch (err) {
      alert("Error: " + err.message);
    }
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

    setShowNewGroup(false);
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

  const filtered = tab === "all" ? conversations
    : tab === "dms" ? conversations.filter(c => !c.is_group)
    : conversations.filter(c => c.is_group);

  return (
    <div>
      <TopBar />
      <div style={{padding:"16px 16px 100px 16px"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <h1 style={{fontSize:22,fontWeight:"bold",margin:0}}>Messages</h1>
          <div style={{display:"flex",gap:8}}>
            <button onClick={() => setShowNewGroup(true)}
              style={{background:"#f3f4f6",border:"none",borderRadius:12,padding:"8px 14px",fontSize:13,fontWeight:600,cursor:"pointer",color:"#374151"}}>
              👥 Group
            </button>
            <button onClick={() => setShowNewChat(true)}
              style={{background:"#E8735A",color:"white",border:"none",borderRadius:12,padding:"8px 14px",fontSize:13,fontWeight:600,cursor:"pointer"}}>
              ✉️ Chat
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",background:"#f3f4f6",borderRadius:12,padding:4,marginBottom:16,gap:4}}>
          {[["all","All"],["dms","💬 DMs"],["groups","👥 Groups"]].map(([val,label]) => (
            <button key={val} onClick={() => setTab(val)}
              style={{padding:"8px",borderRadius:10,border:"none",fontWeight:600,fontSize:12,cursor:"pointer",background:tab===val?"white":"transparent",color:tab===val?"#E8735A":"#6b7280"}}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{textAlign:"center",color:"#9ca3af",padding:48}}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{textAlign:"center",padding:"60px 20px",color:"#9ca3af",background:"white",borderRadius:20,border:"1px solid #f3f4f6"}}>
            <p style={{fontSize:40,marginBottom:8}}>💬</p>
            <p style={{fontWeight:600,fontSize:16}}>
              {tab === "dms" ? "No direct messages yet" : tab === "groups" ? "No group chats yet" : "No messages yet"}
            </p>
            <p style={{fontSize:13}}>
              {tab === "groups" ? "Create a group chat above!" : "Start a conversation!"}
            </p>
            <button onClick={() => tab === "groups" ? setShowNewGroup(true) : setShowNewChat(true)}
              style={{marginTop:16,background:"#E8735A",color:"white",border:"none",borderRadius:12,padding:"10px 24px",fontSize:14,fontWeight:600,cursor:"pointer"}}>
              {tab === "groups" ? "Create Group" : "Start Chatting"}
            </button>
          </div>
        ) : filtered.map(c => (
          <div key={c.id} onClick={() => router.push("/chats/" + c.id)}
            style={{background:"white",borderRadius:16,padding:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,0.04)",border:"1px solid #f3f4f6",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>

            <div style={{width:52,height:52,borderRadius:"50%",background:"#FFE4DE",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,position:"relative"}}>
              {c.is_group ? (
                <span style={{fontSize:24}}>👥</span>
              ) : c.otherUser?.avatar_url ? (
                <img src={c.otherUser.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} />
              ) : (
                <span style={{color:"#E8735A",fontWeight:"bold",fontSize:20}}>{c.otherUser?.full_name?.[0] || "R"}</span>
              )}
            </div>

            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}>
                <p style={{fontWeight:700,fontSize:15,margin:0,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
                  {c.is_group ? c.name : c.otherUser?.full_name || "User"}
                </p>
                <span style={{fontSize:11,color:"#9ca3af",flexShrink:0,marginLeft:8}}>
                  {timeAgo(c.lastMsg?.created_at)}
                </span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {c.is_group && (
                  <span style={{background:"#FFE4DE",color:"#E8735A",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999,flexShrink:0}}>
                    GROUP
                  </span>
                )}
                <p style={{fontSize:13,color:"#9ca3af",margin:0,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
                  {c.lastMsg?.content || "No messages yet"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New DM Modal */}
      {showNewChat && (
        <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:"white",width:"100%",maxWidth:480,borderRadius:"24px 24px 0 0",padding:24,maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <h3 style={{fontWeight:"bold",fontSize:18,margin:0}}>New Message</h3>
              <button onClick={() => { setShowNewChat(false); setSearchQuery(""); setSearchResults([]); }}
                style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9ca3af"}}>✕</button>
            </div>
            <input
              style={{width:"100%",border:"2px solid #f3f4f6",borderRadius:14,padding:"12px 16px",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:12,background:"#fafafa"}}
              placeholder="Search by name..."
              value={searchQuery}
              onChange={e => searchUsers(e.target.value)}
              autoFocus
            />
            <div style={{flex:1,overflowY:"auto"}}>
              {searchResults.length === 0 && searchQuery && (
                <p style={{textAlign:"center",color:"#9ca3af",padding:24,fontSize:13}}>No users found</p>
              )}
              {!searchQuery && (
                <p style={{textAlign:"center",color:"#9ca3af",padding:24,fontSize:13}}>Type a name to search</p>
              )}
              {searchResults.map(person => (
                <div key={person.id} onClick={() => startDM(person)}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid #f3f4f6",cursor:"pointer"}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:"#FFE4DE",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                    {person.avatar_url
                      ? <img src={person.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                      : <span style={{color:"#E8735A",fontWeight:"bold",fontSize:16}}>{person.full_name?.[0]||"R"}</span>
                    }
                  </div>
                  <div style={{flex:1}}>
                    <p style={{fontWeight:600,margin:0}}>{person.full_name}</p>
                    <p style={{fontSize:12,color:"#9ca3af",margin:0}}>{person.institution}</p>
                  </div>
                  <span style={{color:"#E8735A",fontSize:13,fontWeight:600}}>Message →</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Group Chat Modal */}
      {showNewGroup && (
        <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:"white",width:"100%",maxWidth:480,borderRadius:"24px 24px 0 0",padding:24,maxHeight:"85vh",display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <h3 style={{fontWeight:"bold",fontSize:18,margin:0}}>New Group Chat</h3>
              <button onClick={() => { setShowNewGroup(false); setGroupName(""); setSelectedPeople([]); }}
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