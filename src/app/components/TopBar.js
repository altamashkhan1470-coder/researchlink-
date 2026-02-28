"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search } from "lucide-react";

export default function TopBar() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", borderBottom:"1px solid #f3f4f6", background:"#FFF7F5", position:"sticky", top:0, zIndex:10 }}>

      {/* Logo only - no text */}
      <Link href="/dashboard">
        <img
          src="/logo.png"
          alt="ResearchLink"
          style={{ height:40, width:"auto", objectFit:"contain" }}
        />
      </Link>

      {/* Search */}
      <Link href="/search"
        style={{ display:"flex", alignItems:"center", gap:8, background:"white", borderRadius:999, padding:"7px 16px", border:"1px solid #e5e7eb", flex:1, margin:"0 12px", textDecoration:"none" }}>
        <Search size={14} color="#9ca3af" />
        <span style={{ fontSize:14, color:"#9ca3af" }}>Search</span>
      </Link>

      {/* Bell + Profile */}
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <Link href="/notifications" style={{ position:"relative", textDecoration:"none" }}>
          <Bell size={22} color="#6b7280" />
          <span style={{ position:"absolute", top:-4, right:-4, width:16, height:16, background:"#E8735A", color:"white", fontSize:10, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"bold" }}>
            3
          </span>
        </Link>
        <Link href="/profile">
          <div style={{ width:32, height:32, borderRadius:"50%", background:"#FFE4DE", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"#E8735A", fontWeight:"bold", fontSize:13 }}>Me</span>
          </div>
        </Link>
      </div>

    </div>
  );
}