"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Users, User, Plus } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", icon: Home, label: "Feed" },
    { href: "/chats", icon: MessageCircle, label: "Chats" },
    { href: "/groups", icon: Users, label: "Groups" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-md w-full bg-white border-t flex justify-around py-2 z-50 items-center">
      {items.map(({ href, icon: Icon, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-3 py-1">
            <Icon size={22} className={active ? "text-[#E8735A]" : "text-gray-400"} />
            <span className={`text-xs font-medium ${active ? "text-[#E8735A]" : "text-gray-400"}`}>
              {label}
            </span>
          </Link>
        );
      })}

      {/* Floating Post Button */}
      <Link href="/create"
        className="w-12 h-12 bg-[#E8735A] text-white rounded-full flex items-center justify-center shadow-lg -mt-6">
        <Plus size={22} />
      </Link>
    </div>
  );
}
