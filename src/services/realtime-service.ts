// ============================================================================
// REALTIME SERVICE — WebSocket + SSE with auto-reconnect
// ============================================================================

type MessageHandler = (data: unknown) => void;

interface WsEnvelope {
  channel: string;
  data: unknown;
}

const MAX_RECONNECT_DELAY = 30_000;
const BASE_RECONNECT_DELAY = 1_000;

export class RealtimeService {
  private ws: WebSocket | null = null;
  private wsUrl: string | null = null;
  private sse: EventSource | null = null;
  private wsListeners = new Map<string, Set<MessageHandler>>();
  private sseListeners = new Map<string, Set<MessageHandler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = BASE_RECONNECT_DELAY;
  private intentionalClose = false;

  // -------------------------------------------------------------------------
  // WebSocket
  // -------------------------------------------------------------------------

  /**
   * Open a WebSocket connection. If one is already open it is closed first.
   */
  connectWs(url: string): void {
    this.closeWs();
    this.wsUrl = url;
    this.intentionalClose = false;
    this.reconnectDelay = BASE_RECONNECT_DELAY;

    this.ws = new WebSocket(url);

    this.ws.addEventListener('message', (event: MessageEvent) => {
      this.handleWsMessage(event);
    });

    this.ws.addEventListener('close', () => {
      this.handleWsClose();
    });

    this.ws.addEventListener('error', () => {
      this.handleWsError();
    });
  }

  /**
   * Subscribe to messages on a specific WebSocket channel.
   * Returns an unsubscribe function.
   */
  onWsMessage<T>(channel: string, handler: (data: T) => void): () => void {
    let set = this.wsListeners.get(channel);
    if (!set) {
      set = new Set();
      this.wsListeners.set(channel, set);
    }
    const wrapped = handler as MessageHandler;
    set.add(wrapped);

    return () => {
      set!.delete(wrapped);
      if (set!.size === 0) {
        this.wsListeners.delete(channel);
      }
    };
  }

  /**
   * Send a message on a channel through the WebSocket.
   */
  sendWs(channel: string, data: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[RealtimeService] WebSocket is not open; message dropped.');
      return;
    }

    const envelope: WsEnvelope = { channel, data };
    this.ws.send(JSON.stringify(envelope));
  }

  // -------------------------------------------------------------------------
  // SSE
  // -------------------------------------------------------------------------

  /**
   * Open a Server-Sent Events connection. If one is already open it is
   * closed first.
   */
  connectSse(url: string): void {
    this.closeSse();

    this.sse = new EventSource(url);

    this.sse.addEventListener('error', () => {
      console.warn('[RealtimeService] SSE connection error; browser will auto-reconnect.');
    });
  }

  /**
   * Subscribe to a specific SSE event type.
   * Returns an unsubscribe function.
   */
  onSseEvent<T>(eventType: string, handler: (data: T) => void): () => void {
    if (!this.sse) {
      console.warn('[RealtimeService] No SSE connection; call connectSse() first.');
    }

    let set = this.sseListeners.get(eventType);
    if (!set) {
      set = new Set();
      this.sseListeners.set(eventType, set);
    }

    const wrapped = handler as MessageHandler;
    set.add(wrapped);

    // Attach the native listener on the EventSource so the browser routes
    // events to our handler even if connectSse is called after onSseEvent.
    const nativeHandler = (event: Event) => {
      const messageEvent = event as MessageEvent;
      try {
        const parsed = JSON.parse(messageEvent.data) as T;
        handler(parsed);
      } catch {
        handler(messageEvent.data as T);
      }
    };

    // Store reference for cleanup
    (wrapped as MessageHandler & { __native?: EventListener }).__native = nativeHandler;

    this.sse?.addEventListener(eventType, nativeHandler);

    return () => {
      set!.delete(wrapped);
      this.sse?.removeEventListener(eventType, nativeHandler);
      if (set!.size === 0) {
        this.sseListeners.delete(eventType);
      }
    };
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  /**
   * Disconnect all WebSocket and SSE connections and clear listeners.
   */
  disconnect(): void {
    this.intentionalClose = true;
    this.clearReconnectTimer();
    this.closeWs();
    this.closeSse();
    this.wsListeners.clear();
    this.sseListeners.clear();
  }

  // -------------------------------------------------------------------------
  // Internals — reconnection
  // -------------------------------------------------------------------------

  private handleWsMessage(event: MessageEvent): void {
    let envelope: WsEnvelope;
    try {
      envelope = JSON.parse(event.data as string) as WsEnvelope;
    } catch {
      console.warn('[RealtimeService] Received non-JSON WebSocket message.');
      return;
    }

    const set = this.wsListeners.get(envelope.channel);
    if (!set) return;

    for (const handler of [...set]) {
      try {
        handler(envelope.data);
      } catch (err) {
        console.error(
          `[RealtimeService] WS handler error on "${envelope.channel}":`,
          err,
        );
      }
    }
  }

  private handleWsClose(): void {
    if (this.intentionalClose) return;
    this.scheduleReconnect();
  }

  private handleWsError(): void {
    // The browser fires an error event before close. The close handler will
    // take care of reconnection; we just log here.
    console.warn('[RealtimeService] WebSocket error.');
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) return;
    if (!this.wsUrl) return;

    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY);

    console.info(
      `[RealtimeService] Reconnecting WebSocket in ${delay}ms...`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.wsUrl && !this.intentionalClose) {
        this.connectWs(this.wsUrl);
      }
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private closeWs(): void {
    if (this.ws) {
      // Prevent the close handler from triggering reconnection.
      const socket = this.ws;
      this.ws = null;
      try {
        socket.close();
      } catch {
        // Already closed.
      }
    }
  }

  private closeSse(): void {
    if (this.sse) {
      this.sse.close();
      this.sse = null;
    }
  }
}
