declare module 'ws' {
  import type { EventEmitter } from 'node:events';

  interface WebSocket extends EventEmitter {
    close(): void;
    send(data: string | Buffer, cb?: (err?: Error) => void): void;
  }

  interface WebSocketServer extends EventEmitter {
    close(cb?: () => void): void;
  }

  interface WebSocketConstructor {
    new (address: string | URL, options?: Record<string, unknown>): WebSocket;
    readonly CONNECTING: 0;
    readonly OPEN: 1;
    readonly CLOSING: 2;
    readonly CLOSED: 3;
  }

  function WebSocket(address: string | URL, options?: Record<string, unknown>): WebSocket;
  namespace WebSocket {
    const CONNECTING: 0;
    const OPEN: 1;
    const CLOSING: 2;
    const CLOSED: 3;
  }

  export { WebSocket, WebSocketServer, WebSocketConstructor };
  export default WebSocket;
}
