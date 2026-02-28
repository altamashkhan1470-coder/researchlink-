import "./globals.css";

export const metadata = {
  title: "ResearchLink",
  description: "Connect researchers worldwide",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#FFF7F5] text-gray-900">
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl relative">
          {children}
        </div>
      </body>
    </html>
  );
}
