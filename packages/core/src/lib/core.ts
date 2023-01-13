import { Socket, TcpSocketConnectOpts } from 'net';
import { parseServerPacket, readPackets } from './packets';
interface OfflineLoginOptions {
  type: 'offline';
  username?: string;
}
interface MicrosoftLoginOptions {
  type: 'microsoft';
}
interface MojangLoginOptions {
  type: 'mojang';
  email: string;
  password: string;
}
interface ConnectOptions {
  host: string;
  port?: number;
  account: OfflineLoginOptions | MicrosoftLoginOptions | MojangLoginOptions;
}
function promiseConnect(
  socket: Socket,
  opts: TcpSocketConnectOpts
): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.connect(opts, resolve);
    socket.once('error', reject);
  });
}
// @ts-ignore
function recv(socket: Socket): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    socket.once('data', resolve);
    socket.once('error', reject);
  });
}
export * as packets from './packets';
export interface ConnectionState {
  compressed: boolean;
}
export class Client {
  socket: Socket;
  client_state: ConnectionState;
  opts: ConnectOptions;
  constructor(opts: ConnectOptions, socket?: Socket) {
    this.socket = socket || new Socket();
    this.opts = opts;
    this.client_state = {
      compressed: false,
    };
  }
  async connect() {
    await promiseConnect(this.socket, {
      host: this.opts.host,
      port: this.opts.port || 25565,
    });
  }

  async readPacketsAndReact() {
    let raw_packets = await readPackets(
      this.socket,
      this.client_state.compressed
    );
    for (let raw_packet of raw_packets) {
      let packet = parseServerPacket(raw_packet);
      switch (packet.id) {
      }
    }
  }
}
