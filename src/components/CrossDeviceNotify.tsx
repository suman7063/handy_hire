"use client";
import { useState, useEffect } from "react";

interface Device {
  id: string;
  name: string;
  lastSeen: Date;
}

export default function CrossDeviceNotify() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [message, setMessage] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [popups, setPopups] = useState<Array<{id: string, message: string, from: string, timestamp: Date}>>([]);
  const [closingPopups, setClosingPopups] = useState<Set<string>>(new Set());

  const [deviceId, setDeviceId] = useState('');

  // Generate unique device ID on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('deviceId');
      if (!id) {
        id = Math.random().toString(36).substr(2, 9);
        localStorage.setItem('deviceId', id);
      }
      setDeviceId(id);
    }
  }, []);

  // Connect to WebSocket server
  useEffect(() => {
    if (!deviceId) return; // Don't connect until deviceId is set
    
    const connectWebSocket = () => {
      // For development, use local WebSocket server
      // In production, replace with your WebSocket server URL
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://your-websocket-server.com' 
        : 'ws://localhost:8080';
      
      const websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        console.log('🔗 Connected to WebSocket server');
        setIsConnected(true);
        
        // Register this device
        websocket.send(JSON.stringify({
          type: 'register',
          deviceId,
          deviceName: deviceName || `Device ${deviceId.slice(0, 4)}`
        }));
      };

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'deviceList':
            setDevices(data.devices);
            break;
          case 'notification':
            // Show notification on this device
            showNotification(data.message, data.from);
            break;
          case 'error':
            console.error('WebSocket error:', data.message);
            break;
        }
      };

      websocket.onclose = () => {
        console.log('🔌 Disconnected from WebSocket server');
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
  }, [deviceId]);

  const showNotification = (message: string, from: string) => {
    // Try browser notification first
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`📱 From ${from}`, {
        body: message,
        icon: "/favicon.ico"
      });
    }
    
    // Add popup to stack (no auto-hide)
    const popupId = Date.now().toString();
    const newPopup = {
      id: popupId,
      message: message,
      from: from,
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

  const sendNotification = () => {
    if (!ws || !selectedDevice || !message.trim()) return;

    ws.send(JSON.stringify({
      type: 'sendNotification',
      to: selectedDevice,
      message: message.trim(),
      from: deviceName || `Device ${deviceId.slice(0, 4)}`
    }));

    setMessage("");
  };

  const requestDeviceList = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'getDevices' }));
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg relative">
      <h2 className="text-2xl font-bold mb-4 text-center">
        📱 Cross-Device Notifications
      </h2>

      {/* Connection Status */}
      <div className={`p-2 rounded mb-4 text-center ${
        isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      {/* Device Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Your Device Name:</label>
        <input
          type="text"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
          placeholder="Enter device name"
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Device List */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium">Send to Device:</label>
          <button
            onClick={requestDeviceList}
            className="text-blue-500 text-sm hover:underline"
          >
            🔄 Refresh
          </button>
        </div>
        <select
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Select a device...</option>
          {devices
            .filter(device => device.id !== deviceId)
            .map(device => (
              <option key={device.id} value={device.id}>
                {device.name} ({device.id.slice(0, 4)})
              </option>
            ))}
        </select>
      </div>

      {/* Message Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Message:</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="w-full p-2 border rounded h-20"
        />
      </div>

      {/* Send Button */}
      <button
        onClick={sendNotification}
        disabled={!isConnected || !selectedDevice || !message.trim()}
        className="w-full p-3 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        📤 Send Notification
      </button>

      {/* Device Info */}
      <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
        <p><strong>Your Device ID:</strong> {deviceId}</p>
        <p><strong>Connected Devices:</strong> {devices.length}</p>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-600">
        <p><strong>How to use:</strong></p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Open this page on multiple devices</li>
          <li>Give each device a unique name</li>
          <li>Select a device and send a message</li>
          <li>The other device will receive a notification!</li>
        </ol>
      </div>

      {/* Popup Notifications Stack */}
      {popups.map((popup, index) => (
        <div 
          key={popup.id}
          className="fixed right-4 bg-blue-500 text-white p-6 rounded-lg shadow-2xl z-50 max-w-sm transition-all duration-500 ease-in-out"
          style={{ 
            top: `${20 + (index * 120)}px`,
            zIndex: 50 + index,
            animation: closingPopups.has(popup.id) 
              ? 'slideOutToRight 0.5s ease-in forwards' 
              : 'slideInFromRight 0.5s ease-out'
          }}
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl">📱</div>
            <div className="flex-1">
              <div className="font-bold text-lg mb-2">Message from {popup.from}</div>
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
