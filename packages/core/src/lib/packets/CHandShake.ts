import { ClientPacket } from '.';
import { toProtocolString, toUnsignedShort, toVarInt } from '../data_types';
export enum NextState {
  Status = 1,
  Login = 2,
}
export class C0HandshakePacket implements ClientPacket {
  generatePacketData(): Uint8Array {
    return new Uint8Array([
      ...toVarInt(this.protocol_version),
      ...toProtocolString(this.server_address),
      ...toUnsignedShort(this.server_port),
      ...toVarInt(this.next_state),
    ]);
  }
  constructor(opts: Partial<C0HandshakePacket>) {
    Object.assign(this, opts);
  }
  public id = 0x00;
  public protocol_version: number = 0;
  public server_address: string = '';
  public server_port: number = 0;
  public next_state: NextState = 0;
}
