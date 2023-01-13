const SEGMENT_BITS = 0x7f;
const CONTINUE_BIT = 0x80;
export function parseVarInt(
  buffer: Buffer | Uint8Array,
  start_position: number
): { result: number; bytes_count: number } {
  let result = 0;
  let bit = 0;
  let cursor = 0;
  while (true) {
    let current_byte =
      buffer instanceof Buffer
        ? buffer.readInt8(start_position + cursor)
        : buffer[start_position + cursor];
    cursor++;
    result |= (current_byte & SEGMENT_BITS) << bit;
    if ((current_byte & CONTINUE_BIT) == 0) break;
    bit += 7;
    if (bit >= 32) throw new Error('Varint is too big');
  }
  if (~result << bit) {
    let twos_complement = ~result + 1;
    return {
      result: twos_complement ? -twos_complement : twos_complement,
      bytes_count: cursor,
    };
  }
  return { result, bytes_count: cursor };
}
export function toVarInt(n: number): Uint8Array {
  let result = [];
  if (n > 0x7fffffff || n < -0x7fffffff) {
    throw new Error("Number doesn't fit into 32 bits");
  }

  while (true) {
    if ((n & ~SEGMENT_BITS) == 0) {
      result.push(n);
      break;
    }
    result.push((n & SEGMENT_BITS) | CONTINUE_BIT);
    n >>>= 7;
  }
  return new Uint8Array(result);
}
export function toProtocolString(str: string): Uint8Array {
  return new Uint8Array([
    ...toVarInt(str.length),
    ...str.split('').map((c) => c.charCodeAt(0)),
  ]);
}
export function parseString(
  buffer: Buffer | Uint8Array,
  start_position: number
): { result: string; bytes_count: number } {
  let { result: string_length, bytes_count: length_bytes_count } = parseVarInt(
    buffer,
    start_position
  );
  if (string_length < 0) {
    throw new Error('String size is negative');
  }
  let string_bytes = buffer.slice(
    start_position + length_bytes_count,
    start_position + length_bytes_count + string_length
  );
  let result = Buffer.from(string_bytes).toString();
  return { result, bytes_count: length_bytes_count + string_length };
}
export function parseUnsignedShort(
  buffer: Buffer | Uint8Array,
  start_position: number
): number {
  let low_byte =
    buffer instanceof Buffer
      ? buffer.at(start_position)!
      : buffer[start_position];
  let high_byte =
    buffer instanceof Buffer
      ? buffer.at(start_position + 1)!
      : buffer[start_position + 1];

  return high_byte | (low_byte << 8);
}
export function toUnsignedShort(n: number): Uint8Array {
  let low_byte = n & 0xff;
  let high_byte = (n & 0xff00) >> 8;
  return new Uint8Array([high_byte, low_byte]);
}
