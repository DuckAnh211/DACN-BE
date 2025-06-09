const mediasoup = require('mediasoup');

let worker, router;

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
    parameters: {}
  },
  {
    kind: 'video',
    mimeType: 'video/VP9',
    clockRate: 90000,
    parameters: {}
  },
  {
    kind: 'video',
    mimeType: 'video/h264',
    clockRate: 90000,
    parameters: {
      'packetization-mode': 1,
      'profile-level-id': '42e01f',
      'level-asymmetry-allowed': 1
    }
  }
];

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

// Store rooms, peers, and their associated resources
const rooms = new Map();

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      peers: new Map(),
      producers: []
    });
  }
  return rooms.get(roomId);
}

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

function handleSocket(socket, io) {
  const { roomId } = socket.handshake.query;
  const room = getOrCreateRoom(roomId);
  
  console.log(`🔌 New socket connected: ${socket.id} in room ${roomId}`);

  // Join the socket.io room
  socket.join(roomId);

  // Create a peer object to store client-specific data
  const peer = {
    socket,
    roomId,
    transports: [],
    producers: [],
    consumers: []
  };
  
  // Add peer to room
  room.peers.set(socket.id, peer);

  // Handle socket events
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
      kind
    });

    // Notify other peers in the room about the new producer
    socket.to(roomId).emit('new-producer', {
      producerId: producer.id,
      producerSocketId: socket.id,
      kind
    });

    producer.on('transportclose', () => {
      console.log('Producer transport closed');
      removeProducer(producer.id, room);
    });

    callback({ producerId: producer.id });
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
          producerSocketId: producerInfo ? producerInfo.socketId : null
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

  socket.on('chat-message', ({ roomId, message }) => {
    // Broadcast message to all users in the room except sender
    socket.to(roomId).emit('chat-message', {
      sender: `User ${socket.id.substring(0, 4)}`,
      message
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
