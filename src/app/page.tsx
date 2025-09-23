import TestBtn from "@/components/TestBtn";
import CrossDeviceNotify from "@/components/CrossDeviceNotify";
import PublicNotify from "@/components/PublicNotify";

export default function Home() {
  return (
    <div className="font-sans min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          📱 Notification System
        </h1>
        
        {/* Public Notification System */}
        <div className="mb-12">
          <PublicNotify />
        </div>
        
        {/* Cross-Device Notifications */}
        <div className="mb-12">
          <CrossDeviceNotify />
        </div>
        
        {/* Single Device Notifications */}
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Single Device Notifications</h2>
          <TestBtn />
        </div>
      </div>
    </div>
  );
}
