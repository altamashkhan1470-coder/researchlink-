"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";

const FIELDS = ["All","Medical","Engineering","Psychology","Business","Technology","Biology","Chemistry","Physics","Mathematics","Law"];

export default function SearchPage() {
  const router = useRouter();
  const [tab, setTab] = useState("research");
  const [query, setQuery] = useState("");
  const [selectedField, setSelectedField] = useState("All");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    setResults([]);

    if (tab === "people") {
      let q = supabase.from("profiles").select("id, full_name, institution, position, degree, interests").limit(30);
      if (query.trim()) q = q.ilike("full_name", "%" + query.trim() + "%");
      if (selectedField !== "All") q = q.contains("interests", [selectedField]);
      const { data } = await q;
      setResults(data || []);

    } else if (tab === "groups") {
      let q = supabase.from("groups").select("*").limit(30);
      if (query.trim()) q = q.ilike("name", "%" + query.trim() + "%");
      if (selectedField !== "All") q = q.eq("field", selectedField);
      const { data } = await q;
      setResults(data || []);

    } else if (tab === "research") {
      let q = supabase.from("posts").select("*, author:profiles(full_name, institution)").eq("type", "Research Article").limit(30);
      if (query.trim()) q = q.ilike("title", "%" + query.trim() + "%");
      if (selectedField !== "All") q = q.eq("field", selectedField);
      const { data } = await q;
      setResults(data || []);

    } else if (tab === "collaboration") {
      let q = supabase.from("posts").select("*, author:profiles(full_name, institution)").eq("type", "Collaboration").limit(30);
      if (query.trim()) q = q.ilike("title", "%" + query.trim() + "%");
      if (selectedField !== "All") q = q.eq("field", selectedField);
      const { data } = await q;
      setResults(data || []);
    }

    setLoading(false);
  }

  async function loadAll() {
    setLoading(true);
    setSearched(true);
    setResults([]);
    if (tab === "research" || tab === "collaboration") {
      const typeVal = tab === "research" ? "Research Article" : "Collaboration";
      let q = supabase.from("posts").select("*, author:profiles(full_name, institution)").eq("type", typeVal).limit(30);
      if (selectedField !== "All") q = q.eq("field", selectedField);
      const { data } = await q;
      setResults(data || []);
    } else if (tab === "people") {
      const { data } = await supabase.from("profiles").select("id, full_name, institution, position, degree, interests").limit(30);
      setResults(data || []);
    } else if (tab === "groups") {
      const { data } = await supabase.from("groups").select("*").limit(30);
      setResults(data || []);
    }
    setLoading(false);
  }

  const tabs = [
    { key:"research", label:"📄 Research" },
    { key:"collaboration", label:"🤝 Collab" },
    { key:"people", label:"👤 People" },
    { key:"groups", label:"👥 Groups" },
  ];

  const authorStyle = {cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,marginTop:4};
  const avatarSmall = {width:24,height:24,borderRadius:"50%",background:"#FFE4DE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:"bold",color:"#E8735A"};

  return (
    <div>
      <TopBar />
      <div style={{padding:"16px 16px 100px 16px"}}>
        <h1 style={{fontSize:22,fontWeight:"bold",marginBottom:4}}>Search</h1>
        <p style={{color:"#9ca3af",fontSize:13,marginBottom:16}}>Find researchers, research and groups</p>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",background:"#f3f4f6",borderRadius:12,padding:4,marginBottom:16,gap:4}}>
          {tabs.map(t => (
            <button key={t.key}
              onClick={() => { setTab(t.key); setResults([]); setSearched(false); setQuery(""); }}
              style={{padding:"7px 4px",borderRadius:10,border:"none",fontWeight:600,fontSize:11,cursor:"pointer",background:tab===t.key?"white":"transparent",color:tab===t.key?"#E8735A":"#6b7280",whiteSpace:"nowrap"}}>
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} style={{display:"flex",gap:8,marginBottom:12}}>
          <div style={{position:"relative",flex:1}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16}}>🔍</span>
            <input
              style={{width:"100%",border:"2px solid #f3f4f6",borderRadius:14,padding:"12px 16px 12px 40px",fontSize:14,outline:"none",boxSizing:"border-box",background:"#fafafa"}}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={
                tab==="people" ? "Search by name..." :
                tab==="groups" ? "Search groups..." :
                tab==="collaboration" ? "Search collaborations..." :
                "Search research..."
              }
            />
          </div>
          <button type="submit" style={{background:"#E8735A",color:"white",border:"none",borderRadius:12,padding:"0 20px",fontWeight:700,fontSize:14,cursor:"pointer"}}>
            Go
          </button>
        </form>

        <button onClick={loadAll}
          style={{width:"100%",padding:"10px",background:"white",border:"2px solid #f3f4f6",borderRadius:12,fontWeight:600,fontSize:13,color:"#6b7280",cursor:"pointer",marginBottom:12}}>
          Show All {tab==="research"?"Research":tab==="collaboration"?"Collaborations":tab==="people"?"People":"Groups"}
        </button>

        {(tab==="research" || tab==="collaboration" || tab==="groups") && (
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:16}}>
            {FIELDS.map(f => (
              <button key={f} onClick={() => setSelectedField(f)}
                style={{flexShrink:0,padding:"6px 14px",borderRadius:999,fontSize:12,fontWeight:600,border:selectedField===f?"none":"1px solid #d1d5db",background:selectedField===f?"#E8735A":"white",color:selectedField===f?"white":"#6b7280",cursor:"pointer"}}>
                {f}
              </button>
            ))}
          </div>
        )}

        {loading && <p style={{textAlign:"center",color:"#9ca3af",padding:32}}>Searching...</p>}

        {!loading && searched && results.length === 0 && (
          <div style={{textAlign:"center",padding:"48px 20px",color:"#9ca3af"}}>
            <p style={{fontSize:32,marginBottom:8}}>🔍</p>
            <p style={{fontWeight:600}}>No results found</p>
            <p style={{fontSize:13}}>Try different keywords or press Show All</p>
          </div>
        )}

        {/* PEOPLE */}
        {!loading && tab==="people" && results.map(person => (
          <div key={person.id} onClick={() => router.push("/user/" + person.id)}
            style={{background:"white",borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.04)",border:"1px solid #f3f4f6",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:"#FFE4DE",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{color:"#E8735A",fontWeight:"bold",fontSize:18}}>{person.full_name?.[0] || "R"}</span>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontWeight:600,color:"#111827",margin:0}}>{person.full_name}</p>
              <p style={{fontSize:12,color:"#6b7280",margin:"2px 0"}}>
                {person.degree || person.position}{person.institution ? " · " + person.institution : ""}
              </p>
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:4}}>
                {(person.interests || []).slice(0,3).map(i => (
                  <span key={i} style={{background:"#FFE4DE",color:"#E8735A",fontSize:11,fontWeight:600,padding:"2px 10px",borderRadius:999}}>{i}</span>
                ))}
              </div>
            </div>
            <span style={{color:"#9ca3af",fontSize:18}}>›</span>
          </div>
        ))}

        {/* GROUPS */}
        {!loading && tab==="groups" && results.map(group => (
          <div key={group.id}
            style={{background:"white",borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.04)",border:"1px solid #f3f4f6",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:48,height:48,borderRadius:12,background:"#FFE4DE",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:22}}>
              👥
            </div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontWeight:600,color:"#111827",margin:0}}>{group.name}</p>
              {group.field && <span style={{background:"#dbeafe",color:"#2563eb",fontSize:11,fontWeight:600,padding:"2px 10px",borderRadius:999}}>{group.field}</span>}
              <p style={{fontSize:12,color:"#6b7280",margin:"4px 0 0 0",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{group.description}</p>
              <p style={{fontSize:11,color:"#9ca3af",margin:0}}>{group.members_count} members</p>
            </div>
          </div>
        ))}

        {/* RESEARCH */}
        {!loading && tab==="research" && results.map(post => (
          <div key={post.id}
            style={{background:"white",borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.04)",border:"1px solid #f3f4f6"}}>
            <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
              <span style={{background:"#dcfce7",color:"#16a34a",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999}}>📄 Research</span>
              {post.field && <span style={{background:"#dbeafe",color:"#2563eb",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999}}>{post.field}</span>}
            </div>
            <h4 style={{fontWeight:600,margin:"0 0 4px 0",fontSize:15}}>{post.title}</h4>
            <p style={{fontSize:13,color:"#6b7280",margin:"0 0 6px 0"}}>{post.description}</p>
            <div onClick={() => router.push("/user/" + post.author_id)} style={authorStyle}>
              <div style={avatarSmall}>{post.author?.full_name?.[0] || "R"}</div>
              <p style={{fontSize:12,color:"#E8735A",margin:0,fontWeight:600}}>{post.author?.full_name}</p>
            </div>
          </div>
        ))}

        {/* COLLABORATION */}
        {!loading && tab==="collaboration" && results.map(post => (
          <div key={post.id}
            style={{background:"white",borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.04)",border:"1px solid #f3f4f6"}}>
            <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
              <span style={{background:"#FFE4DE",color:"#E8735A",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999}}>🤝 Collaboration</span>
              {post.field && <span style={{background:"#dbeafe",color:"#2563eb",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999}}>{post.field}</span>}
            </div>
            <h4 style={{fontWeight:600,margin:"0 0 4px 0",fontSize:15}}>{post.title}</h4>
            <p style={{fontSize:13,color:"#6b7280",margin:"0 0 6px 0"}}>{post.description}</p>
            <div onClick={() => router.push("/user/" + post.author_id)} style={authorStyle}>
              <div style={avatarSmall}>{post.author?.full_name?.[0] || "R"}</div>
              <p style={{fontSize:12,color:"#E8735A",margin:0,fontWeight:600}}>{post.author?.full_name}</p>
            </div>
          </div>
        ))}

      </div>
      <BottomNav />
    </div>
  );
}