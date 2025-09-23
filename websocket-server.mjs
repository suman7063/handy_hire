import { WebSocketServer } from 'ws';
import http from 'http';

// Create HTTP server
const server = http.createServer();
const wss = new WebSocketServer({ server });

// Store connected devices
const devices = new Map();
const publicUsers = new Set();

wss.on('connection', (ws) => {
  console.log('🔗 New device connected');
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'registerPublic':
          // Register as public user
          publicUsers.add(ws);
          console.log(`📢 Public user connected. Total: ${publicUsers.size}`);
          
          // Send current count to all public users
          broadcastPublicCount();
          break;
          
          
        case 'register':
          // Register new device
          devices.set(message.deviceId, {
            id: message.deviceId,
            name: message.deviceName,
            ws: ws,
            lastSeen: new Date()
          });
          
          console.log(`📱 Device registered: ${message.deviceName} (${message.deviceId})`);
          
          // Send updated device list to all devices
          broadcastDeviceList();
          break;
          
        case 'getDevices':
          // Send device list to requesting device
          ws.send(JSON.stringify({
            type: 'deviceList',
            devices: Array.from(devices.values()).map(d => ({
              id: d.id,
              name: d.name,
              lastSeen: d.lastSeen
            }))
          }));
          break;
          
          
        case 'sendPublicNotification':
          // Broadcast notification to ALL public users
          const publicMessage = JSON.stringify({
            type: 'publicNotification',
            message: message.message
          });
          
          let sentCount = 0;
          publicUsers.forEach(userWs => {
            if (userWs.readyState === WebSocket.OPEN) {
              userWs.send(publicMessage);
              sentCount++;
            }
          });
          
          console.log(`📢 Public notification broadcasted to ${sentCount} users: "${message.message}"`);
          break;
          
        case 'sendNotification':
          // Send notification to target device
          const targetDevice = devices.get(message.to);
          if (targetDevice && targetDevice.ws.readyState === WebSocket.OPEN) {
            targetDevice.ws.send(JSON.stringify({
              type: 'notification',
              message: message.message,
              from: message.from
            }));
            console.log(`📤 Notification sent from ${message.from} to ${message.to}`);
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Target device not found or offline'
            }));
          }
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 Device disconnected');
    
    // Remove from public users
    if (publicUsers.has(ws)) {
      publicUsers.delete(ws);
      console.log(`📢 Public user disconnected. Total: ${publicUsers.size}`);
      broadcastPublicCount();
    }
    
    
    // Remove device from list
    for (const [deviceId, device] of devices.entries()) {
      if (device.ws === ws) {
        devices.delete(deviceId);
        console.log(`📱 Device removed: ${device.name} (${deviceId})`);
        broadcastDeviceList();
        break;
      }
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function broadcastDeviceList() {
  const deviceList = Array.from(devices.values()).map(d => ({
    id: d.id,
    name: d.name,
    lastSeen: d.lastSeen
  }));
  
  const message = JSON.stringify({
    type: 'deviceList',
    devices: deviceList
  });
  
  // Send to all connected devices
  devices.forEach(device => {
    if (device.ws.readyState === WebSocket.OPEN) {
      device.ws.send(message);
    }
  });
}

function broadcastPublicCount() {
  const message = JSON.stringify({
    type: 'connectedCount',
    count: publicUsers.size
  });
  
  // Send to all public users
  publicUsers.forEach(userWs => {
    if (userWs.readyState === WebSocket.OPEN) {
      userWs.send(message);
    }
  });
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`📱 Connect to: ws://localhost:${PORT}`);
});
