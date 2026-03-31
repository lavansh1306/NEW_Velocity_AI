/**
 * MultiModalLiveService.ts
 * Integrates the Gemini Multimodal Live (BidiRealtime) API.
 * Captures 16kHz PCM audio and plays back Gemini's response.
 */

export interface MultiModalEvent {
  type: string;
  data?: any;
}

class MultiModalLiveService {
  private socket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private onEventCallback: ((event: MultiModalEvent) => void) | null = null;
  
  // Audio Playback
  private nextStreamTime = 0;
  private isConnecting = false;

  async connect(onEvent: (event: MultiModalEvent) => void) {
    if (this.isConnecting || this.socket) {
      console.warn('[MultiModalLive] Already connecting or connected');
      return;
    }
    
    this.isConnecting = true;
    this.onEventCallback = onEvent;

    try {
      // 1. Establish WebSocket connection to backend proxy
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/voice-live`;
      
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('[MultiModalLive] Socket connected');
        this.sendSetup();
        this.onEventCallback?.({ type: 'connected' });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (e) {
          console.error('[MultiModalLive] Failed to parse message:', e);
        }
      };

      this.socket.onerror = (err) => {
        console.error('[MultiModalLive] Socket error:', err);
        this.onEventCallback?.({ type: 'error', data: err });
      };

      this.socket.onclose = () => {
        console.log('[MultiModalLive] Socket closed');
        this.stop();
        this.onEventCallback?.({ type: 'disconnected' });
      };

      // 2. Start Audio Capture (16kHz Mono PCM)
      await this.startAudioCapture();
    } finally {
      this.isConnecting = false;
    }
  }

  private sendSetup() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    const setupMessage = {
      setup: {
        model: "models/gemini-1.5-flash",
        generation_config: { 
          response_modalities: ["AUDIO"] 
        },
        tools: [{
          function_declarations: [
            {
              name: "navigate",
              description: "Navigate to a different page on the platform",
              parameters: {
                type: "OBJECT",
                properties: {
                  target: { type: "string", enum: ["/dashboard", "/projects", "/people", "/plan", "/settings", "/velocity-ai"] }
                },
                required: ["target"]
              }
            },
            {
              name: "create_task",
              description: "Create a new project task",
              parameters: {
                type: "OBJECT",
                properties: {
                  title: { type: "string" }
                },
                required: ["title"]
              }
            }
          ]
        }]
      }
    };

    this.socket.send(JSON.stringify(setupMessage));
  }

  private async startAudioCapture() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      // Safety check: if stop() was called during getUserMedia await
      if (!this.audioContext || !this.mediaStream) return;

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }

        const base64 = this.arrayBufferToBase64(pcmData.buffer);
        this.socket.send(JSON.stringify({ 
          realtime_input: { 
            media_chunks: [{ 
              data: base64, 
              mime_type: "audio/pcm" 
            }] 
          } 
        }));
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (err) {
      console.error('[MultiModalLive] Failed to start audio capture:', err);
      throw err;
    }
  }

  private handleMessage(message: any) {
    if (message.serverContent) {
      const { modelDraft, turnComplete } = message.serverContent;
      if (modelDraft && modelDraft.parts) {
        for (const part of modelDraft.parts) {
          if (part.inlineData) {
            this.playAudioChunk(part.inlineData.data);
          }
          if (part.text) {
            this.onEventCallback?.({ type: 'transcript', data: part.text });
          }
        }
      }
      if (turnComplete) {
        this.onEventCallback?.({ type: 'turn_complete' });
      }
    }

    if (message.toolCall) {
      this.onEventCallback?.({ type: 'tool_call', data: message.toolCall });
    }
  }

  private async playAudioChunk(base64Data: string) {
    if (!this.audioContext) return;

    try {
      const binary = window.atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      this.schedulePlayback(float32);
    } catch (e) {
      console.error('[MultiModalLive] Playback error:', e);
    }
  }

  sendToolResponse(toolCall: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    for (const call of toolCall.functionCalls) {
      const { name, id } = call;
      const response = {
        tool_response: {
          function_responses: [{
            name,
            id,
            response: { output: { success: true } }
          }]
        }
      };
      this.socket.send(JSON.stringify(response));
    }
  }

  private schedulePlayback(float32: Float32Array) {
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000); 
    audioBuffer.getChannelData(0).set(float32);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    const startTime = Math.max(this.audioContext.currentTime, this.nextStreamTime);
    source.start(startTime);
    this.nextStreamTime = startTime + audioBuffer.duration;
  }

  stop() {
    this.socket?.close();
    this.socket = null;
    this.mediaStream?.getTracks().forEach(track => track.stop());
    this.mediaStream = null;
    this.processor?.disconnect();
    this.processor = null;
    this.audioContext?.close();
    this.audioContext = null;
    this.nextStreamTime = 0;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

export const multiModalLiveService = new MultiModalLiveService();
