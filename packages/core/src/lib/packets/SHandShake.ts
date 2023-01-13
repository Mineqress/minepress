import { RawServerPacket, ServerPacket } from '.';
import { parseString, parseUnsignedShort, parseVarInt } from '../data_types';
export enum NextState {
  Status = 1,
  Login = 2,
}
export class S0HandshakePacket implements ServerPacket {
  public id = 0x00;
  public raw: RawServerPacket = {
    id: 0x0,
    data: new Uint8Array(),
    was_compressed: false,
  };
  public protocol_version: number = 0;
  public server_address: string = '';
  public server_port: number = 0;
  public next_state: NextState = 0;
  public static fromRawPacket(raw: RawServerPacket): S0HandshakePacket {
    let handskake = new S0HandshakePacket();
    handskake.raw = raw;
    let offset = 0;
    {
      let { result, bytes_count } = parseVarInt(raw.data, offset);
      handskake.protocol_version = result;
      offset += bytes_count;
    }
    {
      let { result, bytes_count } = parseString(raw.data, offset);
      handskake.server_address = result;
      offset += bytes_count;
    }
    {
      let result = parseUnsignedShort(raw.data, offset);
      offset += 2;
      handskake.server_port = result;
    }
    {
      let { result, bytes_count } = parseVarInt(raw.data, offset);
      offset += bytes_count;
      if (result != 1 && result != 2) {
        throw new Error('Invalid next state on hand shake packet');
      }
      handskake.next_state = result;
    }
    return handskake;
  }
}
