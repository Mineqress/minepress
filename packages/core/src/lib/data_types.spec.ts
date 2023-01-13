import {
  parseString,
  parseUnsignedShort,
  parseVarInt,
  toUnsignedShort,
  toVarInt,
} from './data_types';

describe('Data Types', () => {
  describe('Big-Endian Unsigned Short', () => {
    it('Parse Buffer', () => {
      expect(parseUnsignedShort(Buffer.from([0xde, 0xad]), 0)).toBe(0xdead);
      expect(
        parseUnsignedShort(
          Buffer.from([(25565 & 0xff00) >> 8, 25565 & 0xff]),
          0
        )
      ).toBe(25565);
    });
    it('Parse UInt8Array', () => {
      expect(parseUnsignedShort(new Uint8Array([0xde, 0xad]), 0)).toBe(0xdead);
      expect(
        parseUnsignedShort(
          new Uint8Array([(25565 & 0xff00) >> 8, 25565 & 0xff]),
          0
        )
      ).toBe(25565);
    });
    it('From number', () => {
      expect(toUnsignedShort(25565)).toStrictEqual(
        new Uint8Array([(25565 & 0xff00) >> 8, 25565 & 0xff])
      );
    });
  });
  describe('String', () => {
    // Strings in the minecraft protocol are encoded in UTF-8, and prefixed with its size in var int
    // The size is the number of characters not bytes
    // The string "Hello" is encoded as 0x05 0x48 0x65 0x6c 0x6c 0x6f
    describe('Parse Buffer', () => {
      it('parses string correctly', () => {
        expect(
          parseString(Buffer.from([0x05, 0x48, 0x65, 0x6c, 0x6c, 0x6f]), 0)
        ).toStrictEqual({ result: 'Hello', bytes_count: 6 });
      });
      it('parses empty string correctly', () => {
        expect(parseString(Buffer.from([0x00]), 0)).toStrictEqual({
          result: '',
          bytes_count: 1,
        });
      });
      it('parses string with special characters correctly', () => {
        expect(
          parseString(
            Buffer.from([
              0x0c, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f, 0x72, 0x6c,
              0x64, 0x21,
            ]),
            0
          )
        ).toStrictEqual({ result: 'Hello World!', bytes_count: 13 });
      });
      it('parses string with emojis correctly', () => {
        expect(
          parseString(
            Buffer.from([
              0x0c, 0xf0, 0x9f, 0x98, 0x80, 0xf0, 0x9f, 0x98, 0x80, 0xf0, 0x9f,
              0x98, 0x80,
            ]),
            0
          )
        ).toStrictEqual({ result: '😀😀😀', bytes_count: 13 });
      });
      it('Throws error parsing string with negative size', () => {
        expect(() =>
          parseString(Buffer.from([0xff, 0xff, 0xff, 0xff, 0x0f]), 0)
        ).toThrowError('String size is negative');
      });
    });
    // Parses UINT8Array too
    describe('Parse UInt8Array', () => {
      it('parses string correctly', () => {
        expect(
          parseString(new Uint8Array([0x05, 0x48, 0x65, 0x6c, 0x6c, 0x6f]), 0)
        ).toStrictEqual({ result: 'Hello', bytes_count: 6 });
      });
      it('parses empty string correctly', () => {
        expect(parseString(new Uint8Array([0x00]), 0)).toStrictEqual({
          result: '',
          bytes_count: 1,
        });
      });
      it('parses string with special characters correctly', () => {
        expect(
          parseString(
            new Uint8Array([
              0x0c, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f, 0x72, 0x6c,
              0x64, 0x21,
            ]),
            0
          )
        ).toStrictEqual({ result: 'Hello World!', bytes_count: 13 });
      });
      it('parses string with emojis correctly', () => {
        expect(
          parseString(
            new Uint8Array([
              0x0c, 0xf0, 0x9f, 0x98, 0x80, 0xf0, 0x9f, 0x98, 0x80, 0xf0, 0x9f,
              0x98, 0x80,
            ]),
            0
          )
        ).toStrictEqual({ result: '😀😀😀', bytes_count: 13 });
      });
      it('Throws error parsing string with negative size', () => {
        expect(() =>
          parseString(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0x0f]), 0)
        ).toThrowError('String size is negative');
      });
    });
    describe('VarInt', () => {
      describe('Parse Buffer', () => {
        it('parses var int correctly', () => {
          expect(parseVarInt(Buffer.from([0xdd, 0xc7, 0x01]), 0)).toStrictEqual(
            { result: 25565, bytes_count: 3 }
          );
        });
        it('Parses negative numbers correctly', () => {
          expect(
            parseVarInt(Buffer.from([0xff, 0xff, 0xff, 0xff, 0x0f]), 0)
          ).toStrictEqual({ result: -1, bytes_count: 5 });
        });
        it('throw error if the int is too big', () => {
          expect(() =>
            parseVarInt(
              Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x0f]),
              0
            )
          ).toThrowError('Varint is too big');
        });
      });
      describe('Parse UInt8Array', () => {
        it('parses var int correctly on UInt8Array', () => {
          expect(
            parseVarInt(new Uint8Array([0xdd, 0xc7, 0x01]), 0)
          ).toStrictEqual({ result: 25565, bytes_count: 3 });
        });
        it('Parses negative numbers correctly', () => {
          expect(
            parseVarInt(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0x0f]), 0)
          ).toStrictEqual({ result: -1, bytes_count: 5 });
        });
        it('throw error if the int is too big', () => {
          expect(() =>
            parseVarInt(
              new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x0f]),
              0
            )
          ).toThrowError('Varint is too big');
        });
      });
      describe('Convert Number to VarInt', () => {
        it('converts numbers to var int correctly', () => {
          expect(toVarInt(25565)).toStrictEqual(
            new Uint8Array([0xdd, 0xc7, 0x01])
          );
        });
        it('converts negative numbers to var int correctly', () => {
          expect(toVarInt(-1)).toStrictEqual(
            new Uint8Array([0xff, 0xff, 0xff, 0xff, 0x0f])
          );
        });
        it("throws error when the number doesn't fit in 32 bits", () => {
          expect(() => toVarInt(0xffffffffffffffff)).toThrowError(
            "Number doesn't fit into 32 bits"
          );
          expect(() => toVarInt(-0xffffffffffffffff)).toThrowError(
            "Number doesn't fit into 32 bits"
          );
        });
      });
    });
  });
});
