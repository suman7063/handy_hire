// components/NotifyButton.tsx
"use client";

export default function NotifyButton() {
  // Detect if user is on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  const handleNotify = async () => {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
      if (isIOS) {
        alert("📱 iPhone Safari doesn't support web notifications.\n\nTry using Chrome or Firefox on iPhone, or use the Share button to save this page to your home screen!");
      } else {
        alert("This browser does not support notifications.");
      }
      return;
    }

    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      alert("Notifications require HTTPS in production. Please use HTTPS or localhost.");
      return;
    }

    // Ask user for permission if not already granted
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    // If permission granted, show the notification
    if (permission === "granted") {
      new Notification("🎉 Hello!", {
        body: "You clicked the button!",
      });
    } else {
      alert("Please allow notifications to see them.");
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