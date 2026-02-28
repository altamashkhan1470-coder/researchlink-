"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { Users, Plus, ArrowLeft, Send, FileText } from "lucide-react";

const FIELDS = ["Medical","Engineering","Psychology","Business","Technology","Biology","Chemistry","Physics","Mathematics","Law"];

export default function Groups() {
  const [view, setView] = useState("list");
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState("posts");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [field, setField] = useState("");
  const [groupPosts, setGroupPosts] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postDesc, setPostDesc] = useState("");
  const [showPostForm, setShowPostForm] = useState(false);

  useEffect(() => { loadGroups(); }, []);

  async function loadGroups() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUser(user);
    const { data: allGroups } = await supabase.from("groups").select("*").order("members_count", { ascending: false });
    setGroups(allGroups || []);
    const { data: memberships } = await supabase.from("group_members").select("group_id").eq("user_id", user.id);
    setMyGroups((memberships || []).map(m => m.group_id));
    setLoading(false);
  }

  async function openGroup(group) {
    setSelectedGroup(group);
    setView("inside");
    setTab("posts");
    const { data: posts } = await supabase.from("group_posts").select("*, author:profiles(full_name)").eq("group_id", group.id).order("created_at", { ascending: false });
    setGroupPosts(posts || []);
    const { data: msgs } = await supabase.from("group_messages").select("*, sender:profiles(full_name)").eq("group_id", group.id).order("created_at", { ascending: true });
    setGroupMessages(msgs || []);
    supabase.channel("group_chat:" + group.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_messages", filter: "group_id=eq." + group.id },
        payload => setGroupMessages(prev => [...prev, payload.new]))
      .subscribe();
  }

  async function sendGroupMessage(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await supabase.from("group_messages").insert({ group_id: selectedGroup.id, sender_id: currentUser.id, content: newMessage.trim() });
    setNewMessage("");
  }

  async function createGroupPost(e) {
    e.preventDefault();
    if (!postTitle || !postDesc) return;
    const { data } = await supabase.from("group_posts").insert({ group_id: selectedGroup.id, author_id: currentUser.id, title: postTitle, description: postDesc }).select("*, author:profiles(full_name)").single();
    if (data) setGroupPosts(prev => [data, ...prev]);
    setPostTitle(""); setPostDesc(""); setShowPostForm(false);
  }

  async function joinGroup(groupId) {
    await supabase.from("group_members").insert({ group_id: groupId, user_id: currentUser.id });
    const group = groups.find(g => g.id === groupId);
    await supabase.from("groups").update({ members_count: (group.members_count || 1) + 1 }).eq("id", groupId);
    setMyGroups(prev => [...prev, groupId]);
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, members_count: (g.members_count || 1) + 1 } : g));
  }

  async function createGroup(e) {
    e.preventDefault();
    if (!name) return;
    const { data } = await supabase.from("groups").insert({ name, description, field: field || null, admin_id: currentUser.id }).select().single();
    if (data) {
      await supabase.from("group_members").insert({ group_id: data.id, user_id: currentUser.id });
      setGroups(prev => [data, ...prev]);
      setMyGroups(prev => [...prev, data.id]);
    }
    setName(""); setDescription(""); setField(""); setShowCreate(false);
  }

  const btnStyle = { background: "#E8735A", color: "white", border: "none", borderRadius: 999, padding: "8px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer", width: "100%", marginTop: 8 };
  const inputStyle = { width: "100%", border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" };

  if (view === "inside" && selectedGroup) {
    const isMember = myGroups.includes(selectedGroup.id);
    const isAdmin = selectedGroup.admin_id === currentUser?.id;

    return (
      <div>
        <div style={{ position: "sticky", top: 0, zIndex: 30, background: "white", borderBottom: "1px solid #f3f4f6", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setView("list")} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FFE4DE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={18} color="#E8735A" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: "bold", fontSize: 14, margin: 0 }}>{selectedGroup.name}</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{selectedGroup.members_count} members{isAdmin ? " · Admin" : ""}</p>
          </div>
          {!isMember && (
            <button onClick={() => joinGroup(selectedGroup.id)} style={{ background: "#E8735A", color: "white", border: "none", borderRadius: 999, padding: "6px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Join
            </button>
          )}
        </div>

        <div style={{ display: "flex", background: "#f3f4f6", margin: "12px 16px", borderRadius: 12, padding: 4 }}>
          {["posts", "chat"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: "8px", borderRadius: 10, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", background: tab === t ? "white" : "transparent", color: tab === t ? "#E8735A" : "#6b7280" }}>
              {t === "posts" ? "📄 Posts" : "💬 Chat"}
            </button>
          ))}
        </div>

        {tab === "posts" && (
          <div style={{ padding: "0 16px 100px 16px" }}>
            {isMember && (
              <button onClick={() => setShowPostForm(true)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, background: "#FFF7F5", border: "1px solid #FFD4CA", borderRadius: 16, padding: "12px 16px", marginBottom: 16, cursor: "pointer", color: "#9ca3af", fontSize: 14 }}>
                <Plus size={16} color="#E8735A" /> Share something with the group...
              </button>
            )}
            {groupPosts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "#9ca3af" }}>
                <FileText size={36} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                <p style={{ fontWeight: 600 }}>No posts yet</p>
                {isMember && <p style={{ fontSize: 13 }}>Be the first to post!</p>}
              </div>
            ) : groupPosts.map(post => (
              <div key={post.id} style={{ background: "white", borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FFE4DE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#E8735A", fontWeight: "bold", fontSize: 13 }}>{post.author?.full_name?.[0] || "R"}</span>
                  </div>
                  <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>{post.author?.full_name || "Researcher"}</p>
                </div>
                <h4 style={{ fontWeight: "bold", margin: "0 0 4px 0" }}>{post.title}</h4>
                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{post.description}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "chat" && (
          <div style={{ paddingBottom: 140 }}>
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12, minHeight: "50vh" }}>
              {groupMessages.length === 0 ? (
                <p style={{ textAlign: "center", color: "#9ca3af", padding: 32, fontSize: 13 }}>No messages yet. Say hello! 👋</p>
              ) : groupMessages.map(msg => {
                const isMe = msg.sender_id === currentUser?.id;
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "70%", padding: "10px 16px", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isMe ? "#E8735A" : "#f3f4f6", color: isMe ? "white" : "#111827", fontSize: 14 }}>
                      {!isMe && <p style={{ fontSize: 11, fontWeight: 600, color: "#E8735A", margin: "0 0 4px 0" }}>{msg.sender?.full_name}</p>}
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
            {isMember ? (
              <form onSubmit={sendGroupMessage} style={{ position: "fixed", bottom: 64, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "white", borderTop: "1px solid #f3f4f6", padding: "12px 16px", display: "flex", gap: 8 }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} />
                <button type="submit" style={{ width: 44, height: 44, background: "#E8735A", color: "white", borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Send size={18} />
                </button>
              </form>
            ) : (
              <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: 16 }}>Join the group to chat</p>
            )}
          </div>
        )}

        {showPostForm && (
          <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
            <div style={{ background: "white", width: "100%", maxWidth: 480, borderRadius: "24px 24px 0 0", padding: 24 }}>
              <h3 style={{ fontWeight: "bold", fontSize: 18, marginBottom: 16 }}>Post in {selectedGroup.name}</h3>
              <form onSubmit={createGroupPost} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input style={inputStyle} placeholder="Title *" value={postTitle} onChange={e => setPostTitle(e.target.value)} required />
                <textarea style={{ ...inputStyle, resize: "none" }} rows={4} placeholder="What do you want to share?" value={postDesc} onChange={e => setPostDesc(e.target.value)} required />
                <button type="submit" style={btnStyle}>Post</button>
                <button type="button" onClick={() => setShowPostForm(false)} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 13, cursor: "pointer", padding: 8 }}>Cancel</button>
              </form>
            </div>
          </div>
        )}

        <BottomNav />
      </div>
    );
  }

  return (
    <div>
      <TopBar />
      <div style={{ padding: "16px 16px 100px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h1 style={{ fontWeight: "bold", fontSize: 20, margin: 0 }}>Groups</h1>
          <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#E8735A", color: "white", border: "none", borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={16} /> Create
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>Loading...</p>
        ) : groups.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
            <Users size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <p style={{ fontWeight: 600 }}>No groups yet</p>
            <p style={{ fontSize: 13 }}>Create the first one!</p>
          </div>
        ) : groups.map(group => (
          <div key={group.id} style={{ background: "white", borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => openGroup(group)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "#FFE4DE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Users size={24} color="#E8735A" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: "#111827", margin: 0 }}>{group.name}</p>
                {group.field && <span style={{ background: "#dbeafe", color: "#2563eb", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 999 }}>{group.field}</span>}
                <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0 0", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{group.description}</p>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{group.members_count} members</p>
              </div>
            </button>
            {myGroups.includes(group.id) ? (
              <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, flexShrink: 0 }}>Joined ✓</span>
            ) : (
              <button onClick={() => joinGroup(group.id)} style={{ background: "#E8735A", color: "white", border: "none", borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                Join
              </button>
            )}
          </div>
        ))}
      </div>

      {showCreate && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
          <div style={{ background: "white", width: "100%", maxWidth: 480, borderRadius: "24px 24px 0 0", padding: 24 }}>
            <h3 style={{ fontWeight: "bold", fontSize: 18, marginBottom: 16 }}>Create Group</h3>
            <form onSubmit={createGroup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input style={inputStyle} placeholder="Group Name *" value={name} onChange={e => setName(e.target.value)} required />
              <textarea style={{ ...inputStyle, resize: "none" }} rows={3} placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
              <select style={inputStyle} value={field} onChange={e => setField(e.target.value)}>
                <option value="">Select a field</option>
                {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <button type="submit" style={btnStyle}>Create Group</button>
              <button type="button" onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 13, cursor: "pointer", padding: 8 }}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}