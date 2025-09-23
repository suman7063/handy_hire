"use client";
import { useState, useEffect } from "react";

export default function PublicNotify() {
  const [message, setMessage] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedCount, setConnectedCount] = useState(0);
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, timestamp: Date}>>([]);
  const [popups, setPopups] = useState<Array<{id: string, message: string, timestamp: Date}>>([]);
  const [closingPopups, setClosingPopups] = useState<Set<string>>(new Set());

  // Connect to WebSocket server
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://your-websocket-server.com' 
        : 'ws://localhost:8080';
      
      const websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        console.log('🔗 Connected to public notification server');
        setIsConnected(true);
        
        // Register as public user
        websocket.send(JSON.stringify({
          type: 'registerPublic'
        }));
      };

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connectedCount':
            setConnectedCount(data.count);
            break;
          case 'publicNotification':
            // Show notification to all users
            showNotification(data.message);
            // Add to notifications list
            setNotifications(prev => [...prev, {
              id: Date.now().toString(),
              message: data.message,
              timestamp: new Date()
            }]);
            break;
          case 'error':
            console.error('WebSocket error:', data.message);
            break;
        }
      };

      websocket.onclose = () => {
        console.log('🔌 Disconnected from server');
        setIsConnected(false);
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      setWs(websocket);
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const showNotification = (message: string) => {
    // Try browser notification first
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("📢 Public Notification", {
        body: message,
        icon: "/favicon.ico"
      });
    }
    
    // Add popup to stack (no auto-hide)
    const popupId = Date.now().toString();
    const newPopup = {
      id: popupId,
      message: message,
      timestamp: new Date()
    };
    
    setPopups(prev => [...prev, newPopup]);
  };

  const closePopup = (popupId: string) => {
    setClosingPopups(prev => new Set(prev).add(popupId));
    
    // Remove popup after animation completes
    setTimeout(() => {
      setPopups(prev => prev.filter(p => p.id !== popupId));
      setClosingPopups(prev => {
        const newSet = new Set(prev);
        newSet.delete(popupId);
        return newSet;
      });
    }, 500);
  };

  const sendPublicNotification = () => {
    if (!ws || !message.trim()) return;

    ws.send(JSON.stringify({
      type: 'sendPublicNotification',
      message: message.trim()
    }));

    setMessage("");
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        alert("✅ Notifications enabled! You'll now receive public notifications.");
      } else {
        alert("❌ Notifications blocked. You'll only see popup alerts.");
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg relative">
      <h2 className="text-3xl font-bold mb-6 text-center">
        📢 Public Notification System
      </h2>

      {/* Connection Status */}
      <div className={`p-3 rounded mb-6 text-center ${
        isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        <div className="text-lg font-semibold">
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
        <div className="text-sm">
          {connectedCount} people are currently online
        </div>
      </div>

      {/* Send Notification */}
      <div className="mb-6">
        <label className="block text-lg font-medium mb-3">
          Send a message to ALL connected devices:
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your public message..."
            className="flex-1 p-3 border rounded-lg text-lg"
            onKeyPress={(e) => e.key === 'Enter' && sendPublicNotification()}
          />
          <button
            onClick={sendPublicNotification}
            disabled={!isConnected || !message.trim()}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-red-600"
          >
            📢 BROADCAST
          </button>
        </div>
      </div>

      {/* Notification Permission */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">🔔 Enable Browser Notifications</h3>
        <p className="text-sm text-gray-600 mb-3">
          Allow browser notifications to receive alerts even when this tab is not active.
        </p>
        <button
          onClick={requestNotificationPermission}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Enable Notifications
        </button>
      </div>

      {/* Recent Notifications */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">📋 Recent Public Notifications</h3>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No notifications yet</p>
          ) : (
            notifications.slice(-10).reverse().map(notification => (
              <div key={notification.id} className="p-3 bg-gray-50 rounded border-l-4 border-red-500">
                <div className="font-medium">{notification.message}</div>
                <div className="text-xs text-gray-500">
                  {notification.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded">
        <h4 className="font-semibold mb-2">🚀 How it works:</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Anyone can type a message and click `BROADCAST`</li>
          <li>The message is sent to ALL devices viewing this page</li>
          <li>Everyone receives a browser notification + popup</li>
          <li>Perfect for announcements, alerts, or fun messages!</li>
        </ol>
      </div>

      {/* Popup Notifications Stack */}
      {popups.map((popup, index) => (
        <div 
          key={popup.id}
          className="fixed right-4 bg-red-500 text-white p-6 rounded-lg shadow-2xl z-50 max-w-sm transition-all duration-500 ease-in-out"
          style={{ 
            top: `${20 + (index * 120)}px`,
            zIndex: 50 + index,
            animation: closingPopups.has(popup.id) 
              ? 'slideOutToRight 0.5s ease-in forwards' 
              : 'slideInFromRight 0.5s ease-out'
          }}
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl">📢</div>
            <div className="flex-1">
              <div className="font-bold text-lg mb-2">Public Notification</div>
              <div className="text-sm leading-relaxed">{popup.message}</div>
              <div className="text-xs opacity-75 mt-1">
                {popup.timestamp.toLocaleTimeString()}
              </div>
            </div>
            <button
              onClick={() => closePopup(popup.id)}
              className="text-white hover:text-gray-200 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
