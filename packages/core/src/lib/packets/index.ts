// This module parses and sends packets to the server
// Packets starting with S are sent from the server
// And packets starting with C are sent from the client
import * as zlib from 'node:zlib';
import { Socket } from 'node:net';
import { parseVarInt, toVarInt } from '../data_types';
import assert from 'node:assert';
export interface ClientPacket {
  id: number;
  generatePacketData(): Uint8Array;
}
export function sendPacket(
  socket: Socket,
  packet: ClientPacket,
  enable_compression: boolean
): Promise<void> {
  if (enable_compression) {
    let data = packet.generatePacketData();
    let uncompressed_packet_data = Buffer.concat([toVarInt(packet.id), data]);
    let compressed_packet_data = zlib.deflateSync(uncompressed_packet_data);
    let packet_bin = Buffer.concat([
      toVarInt(uncompressed_packet_data.length),
      toVarInt(compressed_packet_data.length),
      compressed_packet_data,
    ]);
    return new Promise((resolve, reject) => {
      socket.write(packet_bin, (err) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
      socket.once('error', reject);
    });
  } else {
    let data = packet.generatePacketData();
    let packet_size = data.length;
    let packet_bin = Buffer.concat([
      toVarInt(packet_size),
      toVarInt(packet.id),
      data,
    ]);
    return new Promise((resolve, reject) => {
      socket.write(packet_bin, (err) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
      socket.once('error', reject);
    });
  }
}
export interface RawServerPacket {
  id: number;
  data: Uint8Array | Buffer;
  was_compressed: boolean;
}
export function readPackets(
  socket: Socket,
  enable_compression: boolean
): Promise<RawServerPacket[]> {
  // The server can send multiple packets at once one after another
  // so we need to read all of them
  // The first bytes are the size of the packet, which is a var int
  // The next bytes are the packet id, which is a var int too
  // The rest of the bytes are the packet data
  // Use parseVarInt function, which is already implemented, and receives a buffer and a offset
  return new Promise((resolve, reject) => {
    socket.once('data', (data) => {
      if (!enable_compression) {
        let packets: RawServerPacket[] = [];
        let offset = 0;
        while (offset < data.length) {
          let packet_size = parseVarInt(data, offset);
          offset += packet_size.bytes_count;
          let packet_id = parseVarInt(data, offset);
          offset += packet_id.bytes_count;
          let packet_data = data.slice(offset, offset + packet_size.result);
          offset += packet_size.result;
          packets.push({
            id: packet_id.result,
            data: packet_data,
            was_compressed: false,
          });
        }
        resolve(packets);
      } else {
        let packets: RawServerPacket[] = [];
        let offset = 0;
        while (offset < data.length) {
          let uncompressed_packet_size = parseVarInt(data, offset);
          offset += uncompressed_packet_size.bytes_count;
          let packet_size = parseVarInt(data, offset);
          offset += packet_size.bytes_count;
          let uncompressed_data = zlib.inflateSync(
            data.slice(offset, offset + packet_size.result)
          );
          offset += packet_size.result;
          assert(
            uncompressed_packet_size.result == uncompressed_data.length,
            'Uncompressed packet size does not match with actual uncompressed size'
          );
          let uncompressed_offset = 0;
          let packet_id = parseVarInt(uncompressed_data, uncompressed_offset);
          uncompressed_offset += packet_id.bytes_count;
          let packet_data = uncompressed_data.slice(uncompressed_offset);
          packets.push({
            id: packet_id.result,
            data: packet_data,
            was_compressed: true,
          });
        }
        resolve(packets);
      }
    });
    socket.once('error', reject);
  });
}
export interface ServerPacket {
  id: number;
  raw: RawServerPacket;
}
export function parseServerPacket(packet: RawServerPacket): ServerPacket {
  switch (packet.id) {
  }
  throw new Error('Not implemented');
}
export { C0HandshakePacket } from './CHandShake';
