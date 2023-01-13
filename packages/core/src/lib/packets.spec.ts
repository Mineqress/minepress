import { Socket } from 'net';
import { toUnsignedShort, toVarInt } from './data_types';
import { parseServerPacket, readPackets, sendPacket } from './packets';
import { S0HandshakePacket, NextState } from './packets/SHandShake';
describe('Packet Compression', () => {
  test('Sends compressed packets correctly', async () => {
    let socketMock = {
      write: jest.fn((_, cb) => {
        cb();
      }),
    };
    let packet = {
      id: 0,
      generatePacketData: jest.fn(
        () => new Uint8Array([0xde, 0xad, 0xbe, 0xaf])
      ),
    };
    await sendPacket(socketMock as unknown as Socket, packet, true);
    expect(socketMock.write).toBeCalledWith(
      Buffer.from([
        5, 13, 120, 156, 99, 184, 183, 118, 223, 122, 0, 7, 175, 2, 249,
      ]),
      expect.any(Function)
    );
  });
  test('Reads compressed packets correctly', async () => {
    let compressed = Buffer.from([
      5, 13, 120, 156, 99, 184, 183, 118, 223, 122, 0, 7, 175, 2, 249,
    ]);
    let socketMock = {
      once: (e: string, cb: (buffer: Buffer) => void) => {
        if (e == 'data') {
          cb(compressed);
        }
      },
    };
    await expect(readPackets(socketMock as any, true)).resolves.toStrictEqual([
      {
        id: 0,
        data: Buffer.from([0xde, 0xad, 0xbe, 0xaf]),
        was_compressed: true,
      },
    ]);
  });
});
it('Sends packets correctly', async () => {
  let socketMock = {
    write: jest.fn((_, cb) => {
      cb();
    }),
  };
  let packet = {
    id: 0,
    generatePacketData: jest.fn(() => new Uint8Array([0xde, 0xad, 0xbe, 0xaf])),
  };
  await sendPacket(socketMock as unknown as Socket, packet, false);
  expect(socketMock.write).toBeCalledWith(
    Buffer.from([0x04, 0x00, 0xde, 0xad, 0xbe, 0xaf]),
    expect.any(Function)
  );
  expect(packet.generatePacketData).toBeCalled();
});
it('Throws error when the packet id occupies more than 5 bytes', () => {
  let packet = {
    id: 0x1ffffffff,
    generatePacketData: jest.fn(() => new Uint8Array([0xde, 0xad, 0xbe, 0xaf])),
  };
  expect(() => sendPacket({} as unknown as Socket, packet, false)).toThrow(
    "Number doesn't fit into 32 bits"
  );
});
it('Reads packets correctly', async () => {
  let socketMock = {
    once: (e: string, cb: (buffer: Buffer) => void) => {
      if (e == 'data') {
        cb(Buffer.from([0x04, 0x00, 0xde, 0xad, 0xbe, 0xaf]));
      }
    },
  };
  await expect(readPackets(socketMock as any, false)).resolves.toStrictEqual([
    {
      id: 0,
      data: Buffer.from([0xde, 0xad, 0xbe, 0xaf]),
      was_compressed: false,
    },
  ]);
});

it('Reads multiple packets correctly', async () => {
  let socketMock = {
    once: (e: string, cb: (buffer: Buffer) => void) => {
      if (e == 'data') {
        cb(
          Buffer.from([
            0x04, 0x00, 0xde, 0xad, 0xbe, 0xaf, 0x04, 0x00, 0xde, 0xad, 0xbe,
            0xaf,
          ])
        );
      }
    },
  };
  await expect(readPackets(socketMock as any, false)).resolves.toStrictEqual([
    {
      id: 0,
      data: Buffer.from([0xde, 0xad, 0xbe, 0xaf]),
      was_compressed: false,
    },
    {
      id: 0,
      data: Buffer.from([0xde, 0xad, 0xbe, 0xaf]),
      was_compressed: false,
    },
  ]);
});
describe('Server Packet Parser', () => {
  test('S0HandShake', () => {
    let raw_packet = {
      id: 0,
      data: new Uint8Array([
        ...toVarInt(760),
        ...toVarInt(9),
        ...'127.0.0.1'.split('').map((c) => c.charCodeAt(0)),
        ...toUnsignedShort(25565),
        ...toVarInt(NextState.Status),
      ]),
      was_compressed: false,
    };
    let parsed_packet = parseServerPacket(raw_packet) as S0HandshakePacket;
    expect(parsed_packet).toBeInstanceOf(S0HandshakePacket);
    expect(parsed_packet.id).toBe(0);
    expect(parsed_packet.raw).toBe(raw_packet);
    expect(parsed_packet.protocol_version).toBe(760);
    expect(parsed_packet.server_address).toBe('127.0.0.1');
    expect(parsed_packet.server_port).toBe(25565);
    expect(parsed_packet.next_state).toBe(NextState.Status);
  });
});
