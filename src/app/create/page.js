"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { useRouter } from "next/navigation";

const FIELDS = ["Medical","Engineering","Psychology","Business","Technology","Biology","Chemistry","Physics","Mathematics","Law"];

export default function CreatePost() {
  const router = useRouter();
  const [postType, setPostType] = useState("Research Article");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [field, setField] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title || !description || !field) { setError("Please fill all required fields"); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not logged in"); setLoading(false); return; }

    const { error: err } = await supabase.from("posts").insert({
      author_id: user.id,
      type: postType,
      title,
      description,
      article_url: articleUrl || null,
      field,
    });

    if (err) { setError(err.message); setLoading(false); return; }
    router.push("/dashboard");
  }

  const isResearch = postType === "Research Article";

  return (
    <div>
      <TopBar />
      <div style={{ padding:"16px 16px 100px 16px" }}>

        {/* Header */}
        <h1 style={{ fontSize:22, fontWeight:"bold", marginBottom:4 }}>Create Post</h1>
        <p style={{ color:"#9ca3af", fontSize:13, marginBottom:20 }}>Share your research with the world</p>

        {/* Post Type Toggle — Beautiful pill design */}
        <div style={{ display:"flex", gap:10, marginBottom:24 }}>
          <button
            onClick={() => setPostType("Research Article")}
            style={{
              flex:1, padding:"14px 10px", borderRadius:16, border:"none", cursor:"pointer", fontWeight:700, fontSize:14,
              background: isResearch ? "linear-gradient(135deg, #E8735A, #ff9a7c)" : "white",
              color: isResearch ? "white" : "#9ca3af",
              boxShadow: isResearch ? "0 4px 15px rgba(232,115,90,0.4)" : "0 2px 8px rgba(0,0,0,0.06)",
              transition:"all 0.2s"
            }}
          >
            📄 Research Post
          </button>
          <button
            onClick={() => setPostType("Collaboration")}
            style={{
              flex:1, padding:"14px 10px", borderRadius:16, border:"none", cursor:"pointer", fontWeight:700, fontSize:14,
              background: !isResearch ? "linear-gradient(135deg, #E8735A, #ff9a7c)" : "white",
              color: !isResearch ? "white" : "#9ca3af",
              boxShadow: !isResearch ? "0 4px 15px rgba(232,115,90,0.4)" : "0 2px 8px rgba(0,0,0,0.06)",
              transition:"all 0.2s"
            }}
          >
            🤝 Collaboration
          </button>
        </div>

        {/* Info banner */}
        <div style={{ background: isResearch ? "#f0fdf4" : "#fff7f5", borderRadius:14, padding:"12px 16px", marginBottom:20, borderLeft:"4px solid", borderLeftColor: isResearch ? "#16a34a" : "#E8735A" }}>
          <p style={{ fontSize:13, color: isResearch ? "#16a34a" : "#E8735A", margin:0, fontWeight:600 }}>
            {isResearch ? "📄 Share your research findings, papers or articles" : "🤝 Looking for a collaborator? Post your requirement here"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Title */}
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:700, color:"#374151", display:"block", marginBottom:6 }}>
              Title <span style={{ color:"#E8735A" }}>*</span>
            </label>
            <input
              style={{ width:"100%", border:"2px solid #f3f4f6", borderRadius:14, padding:"13px 16px", fontSize:14, outline:"none", boxSizing:"border-box", background:"#fafafa" }}
              placeholder="Enter title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              onFocus={e => e.target.style.borderColor = "#E8735A"}
              onBlur={e => e.target.style.borderColor = "#f3f4f6"}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:700, color:"#374151", display:"block", marginBottom:6 }}>
              {isResearch ? "Abstract / Description" : "What kind of collaborator do you need?"} <span style={{ color:"#E8735A" }}>*</span>
            </label>
            <textarea
              style={{ width:"100%", border:"2px solid #f3f4f6", borderRadius:14, padding:"13px 16px", fontSize:14, outline:"none", resize:"none", boxSizing:"border-box", background:"#fafafa", minHeight:120 }}
              placeholder={isResearch ? "Describe your research..." : "Describe your project and skills needed..."}
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              onFocus={e => e.target.style.borderColor = "#E8735A"}
              onBlur={e => e.target.style.borderColor = "#f3f4f6"}
            />
          </div>

          {/* Field */}
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:700, color:"#374151", display:"block", marginBottom:6 }}>
              Research Field <span style={{ color:"#E8735A" }}>*</span>
            </label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {FIELDS.map(f => (
                <button
                  key={f} type="button" onClick={() => setField(f)}
                  style={{
                    padding:"8px 16px", borderRadius:999, fontSize:12, fontWeight:600, cursor:"pointer",
                    border: field === f ? "none" : "1px solid #e5e7eb",
                    background: field === f ? "#E8735A" : "white",
                    color: field === f ? "white" : "#6b7280",
                    boxShadow: field === f ? "0 2px 8px rgba(232,115,90,0.3)" : "none"
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Article URL — only for research */}
          {isResearch && (
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:13, fontWeight:700, color:"#374151", display:"block", marginBottom:6 }}>
                Article / PDF Link <span style={{ color:"#9ca3af", fontWeight:400 }}>(optional)</span>
              </label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16 }}>🔗</span>
                <input
                  style={{ width:"100%", border:"2px solid #f3f4f6", borderRadius:14, padding:"13px 16px 13px 40px", fontSize:14, outline:"none", boxSizing:"border-box", background:"#fafafa" }}
                  placeholder="https://arxiv.org/..."
                  value={articleUrl}
                  onChange={e => setArticleUrl(e.target.value)}
                  onFocus={e => e.target.style.borderColor = "#E8735A"}
                  onBlur={e => e.target.style.borderColor = "#f3f4f6"}
                />
              </div>
            </div>
          )}

          {error && (
            <div style={{ background:"#fef2f2", color:"#ef4444", padding:"10px 16px", borderRadius:12, marginBottom:16, fontSize:13 }}>
              {error}
            </div>
          )}

          {/* Submit Button — Beautiful gradient */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width:"100%", padding:"16px", borderRadius:16, border:"none", cursor:"pointer",
              background: loading ? "#f3f4f6" : "linear-gradient(135deg, #E8735A, #ff9a7c)",
              color: loading ? "#9ca3af" : "white",
              fontSize:16, fontWeight:700,
              boxShadow: loading ? "none" : "0 4px 20px rgba(232,115,90,0.4)",
              marginBottom:12
            }}
          >
            {loading ? "Posting..." : isResearch ? "🚀 Share Research" : "🤝 Post Requirement"}
          </button>

          {/* Cancel */}
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            style={{ width:"100%", padding:"14px", borderRadius:16, border:"2px solid #f3f4f6", cursor:"pointer", background:"white", color:"#9ca3af", fontSize:14, fontWeight:600 }}
          >
            Cancel
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}