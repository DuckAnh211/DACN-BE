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
  const { roomId, userName } = socket.handshake.query;
  const room = getOrCreateRoom(roomId);

  console.log(`🔌 New socket connected: ${socket.id} in room ${roomId}`);

  socket.join(roomId);

  const peer = {
    id: socket.id,
    socket,
    roomId,
    transports: [],
    producers: [],
    consumers: [],
    name: userName || 'Ẩn danh'
  };

  room.peers.set(socket.id, peer);
  const existingProducers = room.producers
    .filter(p => p.socketId !== socket.id)
    .map(p => ({
      producerId: p.id,
      producerSocketId: p.socketId,
      kind: p.kind,
      appData: p.appData
    }));
  if (existingProducers.length > 0) {
    socket.emit('existingProducers', existingProducers);
  }

  socket.on('joinRoom', ({ name }, callback) => {
    peer.name = name;
    if (typeof callback === 'function') {
      callback({ rtpCapabilities: router.rtpCapabilities });
    }
    io.to(roomId).emit('updateParticipants', getParticipants(room));
  });

  socket.on('getRtpCapabilities', (data, callback) => {
    if (typeof callback === 'function') {
      callback(router.rtpCapabilities);
    } else {
      console.warn('Client did not provide callback for getRtpCapabilities');
    }
  });

  socket.on('createWebRtcTransport', async ({ sender }, callback) => {
    try {
      const transport = await createWebRtcTransport();
      peer.transports.push(transport);

      if (typeof callback === 'function') {
        callback({
          params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters
          }
        });
      }
    } catch (error) {
      console.error('Error creating WebRTC transport:', error);
      if (typeof callback === 'function') {
        callback({ params: { error: error.message } });
      }
    }
  });

  socket.on('transport-connect', async ({ transportId, dtlsParameters }) => {
    const transport = peer.transports.find(t => t.id === transportId);
    if (transport) await transport.connect({ dtlsParameters });
  });

  socket.on('transport-produce', async ({ transportId, kind, rtpParameters, appData }, callback) => {
    const transport = peer.transports.find(t => t.id === transportId);
    if (!transport) {
      if (typeof callback === 'function') callback({ error: 'Transport not found' });
      return;
    }

    const producer = await transport.produce({ kind, rtpParameters, appData });
    peer.producers.push(producer);
    room.producers.push({ id: producer.id, socketId: socket.id, kind, appData });

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

    if (typeof callback === 'function') {
      callback({ id: producer.id });
    }
  });

  socket.on('consume', async ({ transportId, producerId, rtpCapabilities }, callback) => {
    try {
      if (!router.canConsume({ producerId, rtpCapabilities })) {
        if (typeof callback === 'function') callback({ params: { error: 'Cannot consume' } });
        return;
      }

      const transport = peer.transports.find(t => t.id === transportId);
      if (!transport) {
        if (typeof callback === 'function') callback({ params: { error: 'Transport not found' } });
        return;
      }
      const producerInfo = room.producers.find(p => p.producerId === producerId);
      const consumer = await transport.consume({
        producerId,
        rtpCapabilities,
        paused: true
      });
      if (producerInfo && producerInfo.appData && producerInfo.appData.mediaType === 'screen') 
        {
  try {
    await consumer.requestKeyFrame();
    console.log('Requested keyframe for screen share consumer');
  } catch (e) {
    console.warn('Failed to request keyframe:', e);
    }
        }

      peer.consumers.push(consumer);
      

      consumer.on('transportclose', () => console.log('Consumer transport closed'));

      consumer.on('producerclose', () => {
        console.log('Producer of this consumer closed');
        socket.emit('producer-closed', { remoteProducerId: producerId });
        peer.consumers = peer.consumers.filter(c => c.id !== consumer.id);
      });

      if (typeof callback === 'function') {
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
      }
    } catch (error) {
      console.error('Error creating consumer:', error);
      if (typeof callback === 'function') {
        callback({ params: { error: error.message } });
      }
    }
  });

  socket.on('consumer-resume', async ({ consumerId }) => {
    const consumer = peer.consumers.find(c => c.id === consumerId);
    if (consumer) await consumer.resume();
  });

  socket.on('closeProducer', ({ producerId }) => {
    const producer = peer.producers.find(p => p.id === producerId);
    if (producer) {
      producer.close();
      peer.producers = peer.producers.filter(p => p.id !== producerId);
      removeProducer(producerId, room);
      socket.to(roomId).emit('producer-closed', { remoteProducerId: producerId });
    }
  });

  socket.on('screenShare', ({ sharing, producerId }) => {
    socket.to(roomId).emit('screenShareStatus', {
      peerId: socket.id,
      sharing,
      producerId
    });
  });

  // Chat message handlers
  socket.on('chat-message', ({ message, sender }) => {
    console.log(`[CHAT] ${sender}: ${message}`);
    socket.to(roomId).emit('chat-message', {
      sender: sender || 'Ẩn danh',
      message,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('message', ({ text, sender }) => {
    console.log(`[CHAT] ${sender}: ${text}`);
    socket.to(roomId).emit('message', {
      sender: sender || 'Ẩn danh',
      message: text,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);

    for (const transport of peer.transports) transport.close();

    if (room) {
      room.peers.delete(socket.id);

      const producersToRemove = room.producers.filter(p => p.socketId === socket.id);
      for (const producer of producersToRemove) {
        socket.to(roomId).emit('producer-closed', { remoteProducerId: producer.id });
      }

      room.producers = room.producers.filter(p => p.socketId !== socket.id);

      if (room.peers.size === 0) rooms.delete(roomId);
      else io.to(roomId).emit('updateParticipants', getParticipants(room));
    }
  });
}

function removeProducer(producerId, room) {
  room.producers = room.producers.filter(p => p.id !== producerId);
}

function getParticipants(room) {
  return [...room.peers.values()].map(p => ({
    id: p.id,
    name: p.name || 'Ẩn danh'
  }));
}

module.exports = {
  createMediasoupWorker,
  handleSocket
};
