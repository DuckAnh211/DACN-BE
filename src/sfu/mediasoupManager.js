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
  }
];

async function createMediasoupWorker() {
  worker = await mediasoup.createWorker();
  router = await worker.createRouter({ mediaCodecs });
  console.log('✅ Mediasoup worker/router ready');
}

const peers = new Map();

function handleSocket(socket, io) {
  console.log('🔌 New socket connected:', socket.id);

  const peer = {
    socket,
    transports: [],
    producers: [],
    consumers: []
  };
  peers.set(socket.id, peer);

  socket.on('getRtpCapabilities', (data, callback) => {
    callback(router.rtpCapabilities);
  });

  // Phù hợp với FE gọi 'createWebRtcTransport' và truyền { sender: true/false }
  socket.on('createWebRtcTransport', async ({ sender }, callback) => {
    const transport = await createWebRtcTransport();
    peer.transports.push(transport);

    transport.appData = { socketId: socket.id, sender };

    transport.on('dtlsstatechange', (state) => {
      if (state === 'closed') {
        transport.close();
      }
    });

    callback({
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters
    });
  });

  socket.on('connectTransport', async ({ transportId, dtlsParameters }) => {
    const transport = peer.transports.find(t => t.id === transportId);
    if (!transport) {
      console.error('Transport not found:', transportId);
      return;
    }
    await transport.connect({ dtlsParameters });
  });

  socket.on('produce', async ({ transportId, kind, rtpParameters }, callback) => {
    const transport = peer.transports.find(t => t.id === transportId);
    if (!transport) {
      console.error('Transport not found:', transportId);
      return;
    }
    const producer = await transport.produce({ kind, rtpParameters });
    peer.producers.push(producer);

    // Thông báo cho tất cả clients trừ người gửi có producer mới
    socket.broadcast.emit('newProducer', {
      producerId: producer.id,
      socketId: socket.id,
      kind: producer.kind
    });

    callback({ id: producer.id });
  });

  socket.on('consume', async ({ rtpCapabilities, transportId, producerId }, callback) => {
    if (!router.canConsume({ producerId, rtpCapabilities })) {
      console.error('❌ Cannot consume');
      callback({ params: null });
      return;
    }

    const transport = peer.transports.find(t => t.id === transportId);
    if (!transport) {
      console.error('Transport not found:', transportId);
      callback({ params: null });
      return;
    }

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: false
    });

    peer.consumers.push(consumer);

    callback({
      id: consumer.id,
      producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters
    });
  });

  socket.on('consumer-resume', async ({ consumerId }) => {
    const consumer = peer.consumers.find(c => c.id === consumerId);
    if (consumer) await consumer.resume();
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
    const p = peers.get(socket.id);
    if (p) {
      p.transports.forEach(t => t.close());
      p.producers.forEach(p => p.close());
      p.consumers.forEach(c => c.close());
      peers.delete(socket.id);
    }
  });
}

async function createWebRtcTransport() {
  const transport = await router.createWebRtcTransport({
    listenIps: [{ ip: '0.0.0.0', announcedIp: null }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });
  return transport;
}

module.exports = {
  createMediasoupWorker,
  handleSocket
};
