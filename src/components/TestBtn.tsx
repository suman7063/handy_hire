// components/NotifyButton.tsx
"use client";

export default function NotifyButton() {
  const handleNotify = async () => {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
      alert("This browser does not support notifications.");
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
    <button
      onClick={handleNotify}
      className="p-2 bg-blue-500 text-white rounded-lg"
    >
      Show Notification
    </button>
  );
}