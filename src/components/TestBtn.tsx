// components/NotifyButton.tsx
"use client";

export default function NotifyButton() {
  // Detect if user is on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  const handleNotify = async () => {
    console.log("🔔 Notification button clicked");
    console.log("📱 User Agent:", navigator.userAgent);
    console.log("🔒 Secure Context:", window.isSecureContext);
    console.log("🌐 Protocol:", window.location.protocol);
    
    // Check if browser supports notifications
    if (!("Notification" in window)) {
      console.log("❌ Browser doesn't support notifications");
      if (isIOS) {
        alert("📱 iPhone Safari doesn't support web notifications.\n\nTry using Chrome or Firefox on iPhone, or use the Share button to save this page to your home screen!");
      } else {
        alert("This browser does not support notifications.");
      }
      return;
    }

    console.log("✅ Browser supports notifications");

    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      console.log("❌ Not in secure context");
      alert("Notifications require HTTPS in production. Please use HTTPS or localhost.");
      return;
    }

    console.log("✅ In secure context");

    // Ask user for permission if not already granted
    let permission = Notification.permission;
    console.log("🔐 Current permission:", permission);
    
    if (permission === "default") {
      console.log("📝 Requesting permission...");
      permission = await Notification.requestPermission();
      console.log("🔐 New permission:", permission);
    }

    // If permission granted, show the notification
    if (permission === "granted") {
      console.log("🎉 Creating notification...");
      try {
        const notification = new Notification("🎉 Hello!", {
          body: "You clicked the button!",
          icon: "/favicon.ico"
        });
        console.log("✅ Notification created:", notification);
      } catch (error) {
        console.error("❌ Error creating notification:", error);
        alert("Error creating notification: " + (error instanceof Error ? error.message : String(error)));
      }
    } else {
      console.log("❌ Permission denied:", permission);
      alert("Please allow notifications to see them. Current permission: " + permission);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleNotify}
        className="p-2 bg-blue-500 text-white rounded-lg"
      >
        Show Notification
      </button>
      
      {isIOS && (
        <div className="text-sm text-gray-600 text-center max-w-xs">
          <p>📱 <strong>iPhone users:</strong></p>
          <p>Web notifications don&apos;t work in Safari. Try Chrome or Firefox, or add this page to your home screen!</p>
        </div>
      )}
    </div>
  );
}