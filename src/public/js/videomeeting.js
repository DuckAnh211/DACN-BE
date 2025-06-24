// Global variables
let socket;
let device;
let rtpCapabilities;
let producerTransport;
let consumerTransport;
let videoProducer;
let audioProducer;
let screenShareProducer;
let consumers = [];
let consumerTransports = []; 
let isProducing = false;

// DOM elements
const localVideo = document.getElementById('localVideo');
const videoGrid = document.getElementById('videoGrid');
const micBtn = document.getElementById('micBtn');
const videoBtn = document.getElementById('videoBtn');
const screenShareBtn = document.getElementById('screenShareBtn');
const chatBtn = document.getElementById('chatBtn');
const leaveBtn = document.getElementById('leaveBtn');
const chatPanel = document.getElementById('chatPanel');
const closeChatBtn = document.getElementById('closeChatBtn');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const messages = document.getElementById('messages');
const roomCode = document.getElementById('roomCode');
const copyBtn = document.getElementById('copyBtn');

// Get room ID from URL or generate a random one
const roomId = new URLSearchParams(window.location.search).get('room') || generateRandomString(6);
roomCode.textContent = roomId;

// Initialize the application
async function init() {
  // Connect to socket.io server
  socket = io('/', {
    query: { roomId }
  });

  // Set up socket event listeners
  setupSocketListeners();
  
  // Get local media stream
  await getLocalStream();
  
  // Load mediasoup device
  await loadDevice();
  
  // Set up UI event listeners
  setupUIListeners();
}

// Set up socket event listeners
function setupSocketListeners() {
  socket.on('connect', async () => {
    console.log('Connected to server');
    
    // Get RTP capabilities from the server
    socket.emit('getRtpCapabilities', {}, async (rtpCaps) => {
      rtpCapabilities = rtpCaps;
      await loadDevice();
    });
  });

  socket.on('new-producer', async ({ producerId, producerSocketId, kind }) => {
    await consumeTrack(producerId, producerSocketId, kind);
  });

  socket.on('producer-closed', ({ remoteProducerId }) => {
    const producerToClose = consumers.find(consumer => consumer.producerId === remoteProducerId);
    if (producerToClose) {
      producerToClose.consumer.close();
      consumers = consumers.filter(consumer => consumer.producerId !== remoteProducerId);
      
      // Remove video element
      const videoEl = document.getElementById(`video-${producerToClose.socketId}`);
      if (videoEl) {
        const container = videoEl.parentElement;
        if (container) container.remove();
      }
    }
  });

  socket.on('chat-message', ({ sender, message }) => {
    addMessageToChat(sender, message);
  });
}

// Set up UI event listeners
function setupUIListeners() {
  micBtn.addEventListener('click', toggleMic);
  videoBtn.addEventListener('click', toggleVideo);
  screenShareBtn.addEventListener('click', toggleScreenShare);
  chatBtn.addEventListener('click', toggleChat);
  closeChatBtn.addEventListener('click', toggleChat);
  leaveBtn.addEventListener('click', leaveRoom);
  sendMessageBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  copyBtn.addEventListener('click', copyRoomCode);
}

// Get local media stream
async function getLocalStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = stream;
    
    // Store tracks for later use
    window.localStream = stream;
  } catch (error) {
    console.error('Error getting local stream:', error);
  }
}

// Load mediasoup device
async function loadDevice() {
  try {
    if (!rtpCapabilities) return;
    
    device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: rtpCapabilities });
    
    console.log('Device loaded');
    await createSendTransport();
  } catch (error) {
    console.error('Error loading device:', error);
  }
}

// Create send transport
async function createSendTransport() {
  socket.emit('createWebRtcTransport', { sender: true }, async ({ params }) => {
    if (params.error) {
      console.error(params.error);
      return;
    }

    producerTransport = device.createSendTransport(params);

    producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await socket.emit('transport-connect', {
          transportId: producerTransport.id,
          dtlsParameters
        });
        callback();
      } catch (error) {
        errback(error);
      }
    });

    producerTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
      try {
        const { producerId } = await new Promise((resolve, reject) => {
          socket.emit('transport-produce', {
            transportId: producerTransport.id,
            kind,
            rtpParameters,
            appData: {}
          }, resolve);
        });
        
        callback({ id: producerId });
      } catch (error) {
        errback(error);
      }
    });

    // Once the transport is created, produce audio and video
    await produceVideo();
    await produceAudio();
  });
}

// Produce video
async function produceVideo() {
  if (!device.canProduce('video') || !window.localStream) return;

  const videoTrack = window.localStream.getVideoTracks()[0];
  if (!videoTrack) return;

  videoProducer = await producerTransport.produce({
    track: videoTrack,
    encodings: [
      { maxBitrate: 100000 },
      { maxBitrate: 300000 },
      { maxBitrate: 900000 }
    ],
    codecOptions: {
      videoGoogleStartBitrate: 1000
    }
  });

  videoProducer.on('trackended', () => {
    console.log('Video track ended');
  });

  videoProducer.on('transportclose', () => {
    console.log('Video transport closed');
    videoProducer = null;
  });
}

// Produce audio
async function produceAudio() {
  if (!device.canProduce('audio') || !window.localStream) return;

  const audioTrack = window.localStream.getAudioTracks()[0];
  if (!audioTrack) return;

  audioProducer = await producerTransport.produce({
    track: audioTrack
  });

  audioProducer.on('trackended', () => {
    console.log('Audio track ended');
  });

  audioProducer.on('transportclose', () => {
    console.log('Audio transport closed');
    audioProducer = null;
  });
}

// Consume a remote track
async function consumeTrack(producerId, producerSocketId, kind) {
  // Create a new transport for consuming
  socket.emit('createWebRtcTransport', { sender: false }, async ({ params }) => {
    if (params.error) {
      console.error(params.error);
      return;
    }

    const consumerTransport = device.createRecvTransport(params);
    consumerTransports.push(consumerTransport);

    consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await socket.emit('transport-connect', {
          transportId: consumerTransport.id,
          dtlsParameters
        });
        callback();
      } catch (error) {
        errback(error);
      }
    });

    // Once the consumer transport is created, consume the track
    socket.emit('consume', {
      transportId: consumerTransport.id,
      producerId,
      rtpCapabilities: device.rtpCapabilities
    }, async ({ params }) => {
      if (params.error) {
        console.error(params.error);
        return;
      }

      const consumer = await consumerTransport.consume({
        id: params.id,
        producerId: params.producerId,
        kind: params.kind,
        rtpParameters: params.rtpParameters
      });

      consumers.push({
        consumer,
        socketId: producerSocketId,
        producerId
      });

      const { track } = consumer;
      
      // Create a new video element for the remote stream
      if (kind === 'video') {
        createRemoteVideo(track, producerSocketId);
      } else {
        // For audio tracks, add them to existing video elements
        const videoEl = document.getElementById(`video-${producerSocketId}`);
        if (videoEl) {
          const stream = videoEl.srcObject || new MediaStream();
          stream.addTrack(track);
          videoEl.srcObject = stream;
        } else {
          // If video element doesn't exist yet, create a placeholder
          createRemoteVideo(track, producerSocketId);
        }
      }

      socket.emit('consumer-resume', { consumerId: consumer.id });
    });
  });
}

// Create a remote video element
function createRemoteVideo(track, socketId) {
  const stream = new MediaStream([track]);
  
  // Check if container already exists
  let container = document.getElementById(`container-${socketId}`);
  let videoEl = document.getElementById(`video-${socketId}`);
  
  if (!container) {
    container = document.createElement('div');
    container.id = `container-${socketId}`;
    container.className = 'video-container';
    
    videoEl = document.createElement('video');
    videoEl.id = `video-${socketId}`;
    videoEl.autoplay = true;
    videoEl.playsInline = true;
    
    const label = document.createElement('div');
    label.className = 'absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm';
    label.textContent = `User ${socketId.substring(0, 4)}`;
    
    container.appendChild(videoEl);
    container.appendChild(label);
    videoGrid.appendChild(container);
  }
  
  if (track.kind === 'video') {
    videoEl.srcObject = stream;
  } else if (track.kind === 'audio' && videoEl.srcObject) {
    videoEl.srcObject.addTrack(track);
  } else {
    videoEl.srcObject = stream;
  }
}

// Toggle microphone
async function toggleMic() {
  if (audioProducer) {
    if (audioProducer.paused) {
      await audioProducer.resume();
      micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      micBtn.classList.remove('bg-red-600');
      micBtn.classList.add('bg-gray-700');
    } else {
      await audioProducer.pause();
      micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
      micBtn.classList.remove('bg-gray-700');
      micBtn.classList.add('bg-red-600');
    }
  }
}

// Toggle video
async function toggleVideo() {
  if (videoProducer) {
    if (videoProducer.paused) {
      await videoProducer.resume();
      videoBtn.innerHTML = '<i class="fas fa-video"></i>';
      videoBtn.classList.remove('bg-red-600');
      videoBtn.classList.add('bg-gray-700');
      localVideo.style.display = 'block';
    } else {
      await videoProducer.pause();
      videoBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
      videoBtn.classList.remove('bg-gray-700');
      videoBtn.classList.add('bg-red-600');
      localVideo.style.display = 'none';
    }
  }
}

// Toggle screen sharing
async function toggleScreenShare() {
  if (screenShareProducer) {
    // Stop screen sharing
    screenShareProducer.close();
    screenShareProducer = null;
    screenShareBtn.classList.remove('bg-blue-600');
    screenShareBtn.classList.add('bg-gray-700');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const track = stream.getVideoTracks()[0];
    
    screenShareProducer = await producerTransport.produce({
      track,
      encodings: [
        { maxBitrate: 1500000 }
      ],
      appData: { mediaType: 'screen' }
    });

    screenShareBtn.classList.remove('bg-gray-700');
    screenShareBtn.classList.add('bg-blue-600');

    track.onended = () => {
      screenShareProducer.close();
      screenShareProducer = null;
      screenShareBtn.classList.remove('bg-blue-600');
      screenShareBtn.classList.add('bg-gray-700');
    };
  } catch (error) {
    console.error('Error sharing screen:', error);
  }
}

// Toggle chat panel
function toggleChat() {
  chatPanel.classList.toggle('translate-x-full');
}

// Send a chat message
function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;
  
  socket.emit('chat-message', { roomId, message });
  addMessageToChat('You', message);
  messageInput.value = '';
}

// Add a message to the chat panel
function addMessageToChat(sender, message) {
  const messageEl = document.createElement('div');
  messageEl.className = 'mb-3';
  
  const senderEl = document.createElement('div');
  senderEl.className = 'font-semibold text-sm';
  senderEl.textContent = sender;
  
  const contentEl = document.createElement('div');
  contentEl.className = 'bg-gray-700 rounded p-2 mt-1';
  contentEl.textContent = message;
  
  messageEl.appendChild(senderEl);
  messageEl.appendChild(contentEl);
  messages.appendChild(messageEl);
  
  // Scroll to bottom
  messages.scrollTop = messages.scrollHeight;
}

// Leave the room
function leaveRoom() {
  if (confirm('Are you sure you want to leave the meeting?')) {
    if (socket) socket.disconnect();
    window.location.href = '/';
  }
}

// Copy room code to clipboard
function copyRoomCode() {
  const meetingUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
  navigator.clipboard.writeText(meetingUrl)
    .then(() => {
      alert('Meeting link copied to clipboard!');
    })
    .catch(err => {
      console.error('Failed to copy:', err);
    });
}

// Generate a random string for room ID
function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Start the application when the page loads
window.addEventListener('DOMContentLoaded', init);
