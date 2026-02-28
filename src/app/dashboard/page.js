"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";

export default function Dashboard() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [currentUserId, setCurrentUserId] = useState("");
  const [userName, setUserName] = useState("Researcher");
  const [selectedPost, setSelectedPost] = useState(null);
  const [interested, setInterested] = useState(true);
  const [experienced, setExperienced] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [likedPosts, setLikedPosts] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [commentPost, setCommentPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentCounts, setCommentCounts] = useState({});
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => { loadFeed(); }, []);

  async function loadFeed() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles").select("full_name").eq("id", user.id).single();
    if (profile) setUserName(profile.full_name?.split(" ")[0] || "Researcher");

    const { data } = await supabase
      .from("posts")
      .select("*, author:profiles(full_name, institution, avatar_url)")
      .order("created_at", { ascending: false });

    const postList = data || [];
    setPosts(postList);

    const { data: myLikes } = await supabase
      .from("post_likes").select("post_id").eq("user_id", user.id);
    const likedMap = {};
    (myLikes || []).forEach(l => likedMap[l.post_id] = true);
    setLikedPosts(likedMap);

    const likeCountMap = {};
    const commentCountMap = {};
    for (const post of postList) {
      const { count: lc } = await supabase
        .from("post_likes").select("*", { count:"exact", head:true }).eq("post_id", post.id);
      likeCountMap[post.id] = lc || 0;
      const { count: cc } = await supabase
        .from("post_comments").select("*", { count:"exact", head:true }).eq("post_id", post.id);
      commentCountMap[post.id] = cc || 0;
    }
    setLikeCounts(likeCountMap);
    setCommentCounts(commentCountMap);
    setLoading(false);
  }

  async function toggleLike(postId) {
    const isLiked = likedPosts[postId];
    if (isLiked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", currentUserId);
      setLikedPosts(prev => ({ ...prev, [postId]: false }));
      setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 1) - 1 }));
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: currentUserId });
      setLikedPosts(prev => ({ ...prev, [postId]: true }));
      setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
    }
  }

  async function openComments(post) {
    setCommentPost(post);
    setReplyTo(null);
    const { data } = await supabase
      .from("post_comments")
      .select("*, author:profiles(full_name, avatar_url)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });
    setComments(data || []);
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    const content = replyTo ? "@" + replyTo.name + " " + newComment.trim() : newComment.trim();
    const { data } = await supabase.from("post_comments")
      .insert({ post_id: commentPost.id, author_id: currentUserId, content })
      .select("*, author:profiles(full_name, avatar_url)").single();
    if (data) {
      setComments(prev => [...prev, data]);
      setCommentCounts(prev => ({ ...prev, [commentPost.id]: (prev[commentPost.id] || 0) + 1 }));
    }
    setNewComment("");
    setReplyTo(null);
  }

  async function applyToPost() {
    await supabase.from("collaboration_applications").insert({
      post_id: selectedPost.id, applicant_id: currentUserId,
      interested, experienced, message: applyMessage,
    });
    alert("Application Submitted!");
    setSelectedPost(null);
    setApplyMessage("");
  }

  function sharePost(post) {
    if (navigator.share) {
      navigator.share({ title: post.title, text: post.description, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.origin + "/post/" + post.id);
      alert("Link copied!");
    }
  }

  function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff/60) + "m ago";
    if (diff < 86400) return Math.floor(diff/3600) + "h ago";
    return Math.floor(diff/86400) + "d ago";
  }

  const filtered = filter === "all" ? posts
    : filter === "research" ? posts.filter(p => p.type === "Research Article")
    : posts.filter(p => p.type === "Collaboration");

  return (
    <div>
      <TopBar />
      <div style={{padding:"16px 16px 100px 16px"}}>

        <h2 style={{fontSize:20,fontWeight:"bold",margin:"0 0 4px 0"}}>Welcome back, {userName} 👋</h2>
        <p style={{color:"#9ca3af",fontSize:13,marginBottom:16}}>Here's the latest research posts</p>

        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[["all","All"],["research","Research"],["collaboration","Collaboration"]].map(([val,label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{padding:"7px 16px",borderRadius:999,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",background:filter===val?"#E8735A":"white",color:filter===val?"white":"#6b7280",boxShadow:filter===val?"0 2px 8px rgba(232,115,90,0.3)":"0 1px 4px rgba(0,0,0,0.06)"}}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{textAlign:"center",color:"#9ca3af",padding:48}}>Loading posts...</p>
        ) : filtered.length === 0 ? (
          <div style={{textAlign:"center",padding:"60px 20px",color:"#9ca3af",background:"white",borderRadius:20,border:"1px solid #f3f4f6"}}>
            <p style={{fontSize:32,marginBottom:8}}>📭</p>
            <p style={{fontWeight:600}}>No posts yet</p>
            <p style={{fontSize:13}}>Be the first to share research!</p>
          </div>
        ) : filtered.map(post => (
          <div key={post.id} style={{background:"white",borderRadius:20,padding:16,marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:"1px solid #f3f4f6"}}>

            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{background:post.type==="Collaboration"?"#FFE4DE":"#dcfce7",color:post.type==="Collaboration"?"#E8735A":"#16a34a",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999}}>
                {post.type==="Collaboration" ? "🤝 Collaborator Needed" : "📄 Research Post"}
              </span>
              {post.field && (
                <span style={{background:"#dbeafe",color:"#2563eb",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999}}>
                  {post.field}
                </span>
              )}
              <span style={{marginLeft:"auto",fontSize:11,color:"#9ca3af"}}>{timeAgo(post.created_at)}</span>
            </div>

            <div onClick={() => post.author_id !== currentUserId && router.push("/user/" + post.author_id)}
              style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,cursor:post.author_id!==currentUserId?"pointer":"default"}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:"#FFE4DE",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                {post.author?.avatar_url
                  ? <img src={post.author.avatar_url} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                  : <span style={{color:"#E8735A",fontWeight:"bold"}}>{post.author?.full_name?.[0] || "R"}</span>
                }
              </div>
              <div>
                <p style={{fontWeight:700,fontSize:14,margin:0}}>{post.author?.full_name || "Researcher"}</p>
                <p style={{fontSize:12,color:"#9ca3af",margin:0}}>{post.author?.institution || ""}</p>
              </div>
            </div>

            <h3 style={{fontWeight:700,fontSize:16,margin:"0 0 6px 0",color:"#111827"}}>{post.title}</h3>
            <p style={{fontSize:14,color:"#6b7280",margin:"0 0 10px 0",lineHeight:1.6}}>{post.description}</p>

            {post.article_url && (
              <a href={post.article_url} target="_blank" rel="noopener noreferrer"
                style={{display:"flex",alignItems:"center",gap:8,background:"#f9fafb",borderRadius:12,padding:"10px 14px",marginBottom:12,textDecoration:"none",color:"#E8735A",fontSize:13,fontWeight:600}}>
                🔗 <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{post.article_url}</span>
              </a>
            )}

            {post.type==="Collaboration" && post.author_id!==currentUserId && (
              <button onClick={() => setSelectedPost(post)}
                style={{width:"100%",padding:"11px",background:"linear-gradient(135deg,#E8735A,#ff9a7c)",color:"white",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:12,boxShadow:"0 3px 12px rgba(232,115,90,0.3)"}}>
                🤝 Apply to Collaborate
              </button>
            )}

            <div style={{display:"flex",alignItems:"center",gap:4,paddingTop:10,borderTop:"1px solid #f3f4f6"}}>
              <button onClick={() => toggleLike(post.id)}
                style={{display:"flex",alignItems:"center",gap:6,border:"none",cursor:"pointer",padding:"6px 10px",borderRadius:10,color:likedPosts[post.id]?"#E8735A":"#9ca3af",fontWeight:600,fontSize:13,background:likedPosts[post.id]?"#FFF0EE":"transparent"}}>
                {likedPosts[post.id] ? "❤️" : "🤍"} {likeCounts[post.id] || 0}
              </button>
              <button onClick={() => openComments(post)}
                style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",padding:"6px 10px",borderRadius:10,color:"#9ca3af",fontWeight:600,fontSize:13}}>
                💬 {commentCounts[post.id] || 0}
              </button>
              <button onClick={() => sharePost(post)}
                style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",padding:"6px 10px",borderRadius:10,color:"#9ca3af",fontWeight:600,fontSize:13,marginLeft:"auto"}}>
                🔗 Share
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Apply Modal */}
      {selectedPost && (
        <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"rgba(0,0,0,0.5)"}}>
          <div style={{background:"white",width:"100%",maxWidth:480,borderRadius:"24px 24px 0 0",padding:24}}>
            <h3 style={{fontWeight:"bold",fontSize:18,marginBottom:4}}>Apply to Collaborate</h3>
            <p style={{color:"#9ca3af",fontSize:13,marginBottom:16}}>{selectedPost.title}</p>
            <p style={{fontSize:14,fontWeight:700,marginBottom:8}}>Are you interested?</p>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {[true,false].map(val => (
                <button key={String(val)} onClick={() => setInterested(val)}
                  style={{flex:1,padding:"10px",borderRadius:12,border:"none",fontWeight:600,fontSize:14,cursor:"pointer",background:interested===val?"#E8735A":"#f3f4f6",color:interested===val?"white":"#6b7280"}}>
                  {val ? "Yes" : "No"}
                </button>
              ))}
            </div>
            <p style={{fontSize:14,fontWeight:700,marginBottom:8}}>Related experience?</p>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {[true,false].map(val => (
                <button key={String(val)} onClick={() => setExperienced(val)}
                  style={{flex:1,padding:"10px",borderRadius:12,border:"none",fontWeight:600,fontSize:14,cursor:"pointer",background:experienced===val?"#E8735A":"#f3f4f6",color:experienced===val?"white":"#6b7280"}}>
                  {val ? "Yes" : "No"}
                </button>
              ))}
            </div>
            <textarea
              style={{width:"100%",border:"2px solid #f3f4f6",borderRadius:14,padding:"12px 16px",fontSize:14,outline:"none",resize:"none",boxSizing:"border-box",marginBottom:16}}
              rows={3} placeholder="Write a short message..."
              value={applyMessage} onChange={e => setApplyMessage(e.target.value)} />
            <button onClick={applyToPost}
              style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#E8735A,#ff9a7c)",color:"white",border:"none",borderRadius:14,fontWeight:700,fontSize:15,cursor:"pointer",marginBottom:8}}>
              Submit Application 🚀
            </button>
            <button onClick={() => setSelectedPost(null)}
              style={{width:"100%",padding:"12px",background:"none",border:"none",color:"#9ca3af",fontSize:14,cursor:"pointer"}}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Comments — Full Screen fixed above everything */}
      {commentPost && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:999,background:"white",display:"flex",flexDirection:"column"}}>

          <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px",borderBottom:"1px solid #f3f4f6",flexShrink:0}}>
            <button onClick={() => { setCommentPost(null); setReplyTo(null); }}
              style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#6b7280",lineHeight:1}}>
              ←
            </button>
            <div style={{flex:1,minWidth:0}}>
              <h3 style={{fontWeight:"bold",fontSize:16,margin:0}}>Comments</h3>
              <p style={{fontSize:12,color:"#9ca3af",margin:0,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
                {commentPost.title}
              </p>
            </div>
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
            {comments.length === 0 ? (
              <div style={{textAlign:"center",padding:"60px 20px",color:"#9ca3af"}}>
                <p style={{fontSize:40,marginBottom:8}}>💬</p>
                <p style={{fontWeight:600,fontSize:16,margin:"0 0 4px 0"}}>No comments yet</p>
                <p style={{fontSize:13,margin:0}}>Be the first to comment!</p>
              </div>
            ) : comments.map(c => (
              <div key={c.id} style={{display:"flex",gap:10,marginBottom:16}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"#FFE4DE",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
                  {c.author?.avatar_url
                    ? <img src={c.author.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    : <span style={{color:"#E8735A",fontWeight:"bold",fontSize:13}}>{c.author?.full_name?.[0] || "R"}</span>
                  }
                </div>
                <div style={{flex:1}}>
                  <div style={{background:"#f9fafb",borderRadius:"4px 16px 16px 16px",padding:"10px 14px"}}>
                    <p style={{fontWeight:700,fontSize:13,margin:"0 0 3px 0",color:"#E8735A"}}>{c.author?.full_name}</p>
                    <p style={{fontSize:14,margin:0,color:"#374151",lineHeight:1.5}}>{c.content}</p>
                  </div>
                  <button onClick={() => setReplyTo({ id: c.id, name: c.author?.full_name })}
                    style={{background:"none",border:"none",fontSize:12,color:"#9ca3af",cursor:"pointer",marginTop:4,fontWeight:600,padding:"2px 4px"}}>
                    Reply
                  </button>
                </div>
              </div>
            ))}
          </div>

          {replyTo && (
            <div style={{background:"#FFF7F5",padding:"8px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:"1px solid #FFE4DE",flexShrink:0}}>
              <p style={{fontSize:13,color:"#E8735A",margin:0,fontWeight:600}}>↩ Replying to {replyTo.name}</p>
              <button onClick={() => setReplyTo(null)}
                style={{background:"none",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:18}}>✕</button>
            </div>
          )}

          <form onSubmit={submitComment}
            style={{padding:"12px 16px",borderTop:"1px solid #f3f4f6",background:"white",display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
            <input
              style={{flex:1,border:"2px solid #f3f4f6",borderRadius:999,padding:"12px 18px",fontSize:14,outline:"none",background:"#fafafa"}}
              placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              autoFocus
            />
            <button type="submit"
              style={{width:46,height:46,background:"#E8735A",color:"white",border:"none",borderRadius:"50%",cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 8px rgba(232,115,90,0.4)"}}>
              ➤
            </button>
          </form>
        </div>
      )}

      <BottomNav />
    </div>
  );
}