const mediasoup = require('mediasoup');

// Store workers, routers, rooms, and peers
let worker;
let router;
const rooms = new Map();

// Media codecs configuration
const mediaCodecs = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000
    }
  },
  {
    kind: 'video',
    mimeType: 'video/H264',
    clockRate: 90000,
    parameters: {
      'packetization-mode': 1,
      'profile-level-id': '4d0032',
      'level-asymmetry-allowed': 1
    }
  }
];

// Initialize mediasoup worker and router
async function createMediasoupWorker() {
  worker = await mediasoup.createWorker({
    logLevel: 'warn',
    rtcMinPort: 10000,
    rtcMaxPort: 10100
  });

  worker.on('died', () => {
    console.error('Mediasoup worker died, exiting...');
    process.exit(1);
  });

  router = await worker.createRouter({ mediaCodecs });
  console.log('✅ Mediasoup worker/router ready');
}

// Get or create room
function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      peers: new Map(),
      producers: []
    });
  }
  return rooms.get(roomId);
}

// Create WebRTC transport
async function createWebRtcTransport() {
  const transport = await router.createWebRtcTransport({
    listenIps: [
      {
        ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
        announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1'
      }
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: 1000000
  });

  return transport;
}

// Handle socket connections
function handleSocket(socket, io) {
  const { roomId } = socket.handshake.query;
  const room = getOrCreateRoom(roomId);
  
  console.log(`🔌 New socket connected: ${socket.id} in room ${roomId}`);

  // Join the socket.io room
  socket.join(roomId);

  // Create a peer object to store client-specific data
  const peer = {
    id: socket.id,
    socket,
    roomId,
    transports: [],
    producers: [],
    consumers: []
  };
  
  // Add peer to room
  room.peers.set(socket.id, peer);

  // Handle socket events
  socket.on('joinRoom', (data, callback) => {
    callback({ rtpCapabilities: router.rtpCapabilities });
  });

  socket.on('getRtpCapabilities', (data, callback) => {
    callback(router.rtpCapabilities);
  });

  socket.on('createWebRtcTransport', async ({ sender }, callback) => {
    try {
      const transport = await createWebRtcTransport();
      peer.transports.push(transport);

      callback({
        params: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters
        }
      });
    } catch (error) {
      console.error('Error creating WebRTC transport:', error);
      callback({ params: { error: error.message } });
    }
  });

  socket.on('transport-connect', async ({ transportId, dtlsParameters }) => {
    const transport = peer.transports.find(t => t.id === transportId);
    if (transport) {
      await transport.connect({ dtlsParameters });
    }
  });

  socket.on('transport-produce', async ({ transportId, kind, rtpParameters, appData }, callback) => {
    const transport = peer.transports.find(t => t.id === transportId);
    if (!transport) {
      callback({ error: 'Transport not found' });
      return;
    }

    const producer = await transport.produce({
      kind,
      rtpParameters,
      appData
    });

    peer.producers.push(producer);
    room.producers.push({
      id: producer.id,
      socketId: socket.id,
      kind,
      appData
    });

    // Notify other peers
    socket.to(roomId).emit('new-producer', {
      producerId: producer.id,
      producerSocketId: socket.id,
      kind,
      appData
    });

    producer.on('transportclose', () => {
      console.log('Producer transport closed');
      removeProducer(producer.id, room);
    });

    callback({ id: producer.id });
  });

  socket.on('consume', async ({ transportId, producerId, rtpCapabilities }, callback) => {
    try {
      // Check if the consumer can consume the producer
      if (!router.canConsume({ producerId, rtpCapabilities })) {
        callback({ params: { error: 'Cannot consume' } });
        return;
      }

      // Find the transport
      const transport = peer.transports.find(t => t.id === transportId);
      if (!transport) {
        callback({ params: { error: 'Transport not found' } });
        return;
      }

      // Create consumer
      const consumer = await transport.consume({
        producerId,
        rtpCapabilities,
        paused: true
      });

      peer.consumers.push(consumer);

      // Find producer info
      const producerInfo = room.producers.find(p => p.id === producerId);
      
      consumer.on('transportclose', () => {
        console.log('Consumer transport closed');
      });

      consumer.on('producerclose', () => {
        console.log('Producer of this consumer closed');
        socket.emit('producer-closed', { remoteProducerId: producerId });
        
        // Remove consumer
        peer.consumers = peer.consumers.filter(c => c.id !== consumer.id);
      });

      callback({
        params: {
          id: consumer.id,
          producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          producerSocketId: producerInfo ? producerInfo.socketId : null,
          appData: producerInfo ? producerInfo.appData : null
        }
      });
    } catch (error) {
      console.error('Error creating consumer:', error);
      callback({ params: { error: error.message } });
    }
  });

  socket.on('consumer-resume', async ({ consumerId }) => {
    const consumer = peer.consumers.find(c => c.id === consumerId);
    if (consumer) {
      await consumer.resume();
    }
  });

  socket.on('closeProducer', ({ producerId }) => {
    const producer = peer.producers.find(p => p.id === producerId);
    if (producer) {
      producer.close();
      // Remove from peer's producers
      peer.producers = peer.producers.filter(p => p.id !== producerId);
      // Remove from room's producers
      removeProducer(producerId, room);
      // Notify other peers
      socket.to(roomId).emit('producer-closed', { remoteProducerId: producerId });
    }
  });

  socket.on('screenShare', ({ sharing, producerId }) => {
    // Notify other peers about screen sharing status
    socket.to(roomId).emit('screenShareStatus', {
      peerId: socket.id,
      sharing,
      producerId
    });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    // Close all transports
    for (const transport of peer.transports) {
      transport.close();
    }
    
    // Remove peer from room
    if (room) {
      room.peers.delete(socket.id);
      
      // Remove all producers associated with this peer
      const producersToRemove = room.producers.filter(p => p.socketId === socket.id);
      for (const producer of producersToRemove) {
        socket.to(roomId).emit('producer-closed', { remoteProducerId: producer.id });
      }
      
      room.producers = room.producers.filter(p => p.socketId !== socket.id);
      
      // If room is empty, remove it
      if (room.peers.size === 0) {
        rooms.delete(roomId);
      }
    }
  });
}

function removeProducer(producerId, room) {
  room.producers = room.producers.filter(p => p.id !== producerId);
}

module.exports = {
  createMediasoupWorker,
  handleSocket
};
