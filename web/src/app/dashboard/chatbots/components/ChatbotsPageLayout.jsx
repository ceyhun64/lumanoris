export default function ChatbotsPageLayout({ children, className = "" }) {
  return (
    <div className={`min-h-screen bg-[#070709] text-white p-6 md:p-10 ${className}`}>
      {children}
    </div>
  );
}
