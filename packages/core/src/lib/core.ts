import assert from 'assert';
import { Socket, TcpSocketConnectOpts } from 'net';
import { toVarInt } from './data_types';
import { parseServerPacket, readPackets } from './packets';
import { S0HandshakePacket } from './packets/SHandShake';
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

export class Client {
  socket: Socket;

  // @ts-ignore
  constructor(opts: ConnectOptions, socket?: Socket) {
    this.socket = socket || new Socket();
  }
  async connect() {
    await promiseConnect(this.socket, {
      host: 'localhost',
      port: 25565,
    });
  }
}
