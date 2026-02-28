"use client";
import { useEffect, useState, use, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function ChatRoom({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const bottomRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [conversation, setConversation] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase.channel("messages:" + id)
      .on("postgres_changes", {
        event:"INSERT", schema:"public", table:"messages",
        filter:"conversation_id=eq." + id
      }, async payload => {
        const { data } = await supabase.from("messages")
          .select("*, sender:profiles(full_name, avatar_url)")
          .eq("id", payload.new.id).single();
        if (data) setMessages(prev => [...prev, data]);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [id]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: conv } = await supabase
      .from("conversations").select("*").eq("id", id).single();
    setConversation(conv);

    const { data: parts } = await supabase
      .from("conversation_participants")
      .select("*, profile:profiles(id, full_name, avatar_url, institution)")
      .eq("conversation_id", id);
    setParticipants(parts || []);

    if (conv && !conv.is_group) {
      const other = (parts || []).find(p => p.user_id !== user.id);
      setOtherUser(other?.profile);
    }

    const { data: msgs } = await supabase
      .from("messages")
      .select("*, sender:profiles(full_name, avatar_url)")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setMessages(msgs || []);
    setLoading(false);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await supabase.from("messages").insert({
      conversation_id: id,
      sender_id: currentUserId,
      content: newMessage.trim()
    });
    setNewMessage("");
  }

  function timeStr(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  }

  const chatName = conversation?.is_group ? conversation?.name : otherUser?.full_name || "Chat";
  const chatSub = conversation?.is_group
    ? participants.length + " members"
    : otherUser?.institution || "";

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#f9fafb"}}>

      {/* Header */}
      <div style={{background:"white",borderBottom:"1px solid #f3f4f6",padding:"12px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
        <button onClick={() => router.back()}
          style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#6b7280",lineHeight:1}}>
          ←
        </button>
        <div style={{width:42,height:42,borderRadius:"50%",background:"#FFE4DE",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
          {conversation?.is_group ? (
            <span style={{fontSize:20}}>👥</span>
          ) : otherUser?.avatar_url ? (
            <img src={otherUser.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} />
          ) : (
            <span style={{color:"#E8735A",fontWeight:"bold",fontSize:16}}>
              {otherUser?.full_name?.[0] || "R"}
            </span>
          )}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontWeight:700,fontSize:15,margin:0,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
            {chatName}
          </p>
          <p style={{fontSize:12,color:"#9ca3af",margin:0}}>{chatSub}</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
        {loading ? (
          <p style={{textAlign:"center",color:"#9ca3af",padding:48}}>Loading...</p>
        ) : messages.length === 0 ? (
          <div style={{textAlign:"center",padding:"60px 20px",color:"#9ca3af"}}>
            <p style={{fontSize:40,marginBottom:8}}>👋</p>
            <p style={{fontWeight:600,fontSize:16}}>Say hello!</p>
            <p style={{fontSize:13}}>Start the conversation</p>
          </div>
        ) : messages.map((msg, i) => {
          const isMe = msg.sender_id === currentUserId;
          const showName = conversation?.is_group && !isMe &&
            (i === 0 || messages[i-1]?.sender_id !== msg.sender_id);
          return (
            <div key={msg.id}
              style={{display:"flex",flexDirection:isMe?"row-reverse":"row",alignItems:"flex-end",gap:8,marginBottom:10}}>
              {!isMe && (
                <div style={{width:30,height:30,borderRadius:"50%",background:"#FFE4DE",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
                  {msg.sender?.avatar_url
                    ? <img src={msg.sender.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    : <span style={{color:"#E8735A",fontWeight:"bold",fontSize:11}}>
                        {msg.sender?.full_name?.[0]||"R"}
                      </span>
                  }
                </div>
              )}
              <div style={{maxWidth:"72%"}}>
                {showName && (
                  <p style={{fontSize:11,color:"#9ca3af",margin:"0 0 3px 8px",fontWeight:600}}>
                    {msg.sender?.full_name}
                  </p>
                )}
                <div style={{
                  background:isMe?"linear-gradient(135deg,#E8735A,#ff9a7c)":"white",
                  color:isMe?"white":"#111827",
                  borderRadius:isMe?"18px 18px 4px 18px":"18px 18px 18px 4px",
                  padding:"10px 14px",
                  boxShadow:"0 1px 4px rgba(0,0,0,0.08)",
                  fontSize:14,
                  lineHeight:1.5
                }}>
                  {msg.content}
                </div>
                <p style={{fontSize:10,color:"#9ca3af",margin:"3px 6px 0",textAlign:isMe?"right":"left"}}>
                  {timeStr(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage}
        style={{padding:"12px 16px",borderTop:"1px solid #f3f4f6",background:"white",display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
        <input
          style={{flex:1,border:"2px solid #f3f4f6",borderRadius:999,padding:"12px 18px",fontSize:14,outline:"none",background:"#fafafa"}}
          placeholder="Type a message..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
        />
        <button type="submit"
          style={{width:46,height:46,background:"linear-gradient(135deg,#E8735A,#ff9a7c)",color:"white",border:"none",borderRadius:"50%",cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 8px rgba(232,115,90,0.4)"}}>
          ➤
        </button>
      </form>
    </div>
  );
}