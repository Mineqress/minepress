use thiserror::Error;

pub struct VarInt(i32);

impl VarInt {
    pub fn new(value: i32) -> Self {
        VarInt(value)
    }
}
static SEGMENT_BITS: u8 = 0x7F;
static CONTINUE_BIT: u8 = 0x80;
#[derive(Debug, Error)]
pub enum DecodeError {
    #[error("VarInt is too large")]
    TooLarge,
    #[error("VarInt is incomplete")]
    Incomplete,
}
impl TryFrom<&[u8]> for VarInt {
    type Error = DecodeError;

    fn try_from(bytes: &[u8]) -> Result<Self, Self::Error> {
        let mut value = 0;
        let mut position = 0u8;
        let mut cursor = 0usize;
        let mut next_byte = || {
            let old_c = cursor;
            cursor += 1;
            bytes.get(old_c).copied()
        };
        loop {
            let current_byte = next_byte().ok_or_else(|| DecodeError::Incomplete)?;
            value |= ((current_byte & SEGMENT_BITS) as i32) << position;
            if (current_byte & CONTINUE_BIT) == 0 {
                break Ok(Self(value));
            }
            position += 7;
            if position > 32 {
                break Err(DecodeError::TooLarge);
            }

        }
    }
}

impl From<VarInt> for Vec<u8> {
    fn from(VarInt(varint): VarInt) -> Self {
        const SEGMENT_BITS: i32 = 0b01111111;
        const CONTINUE_BIT: i32 = 0b10000000;
        let mut bytes = Vec::new();
        let mut value = varint;

        while (value & !SEGMENT_BITS) != 0 {
            let byte = (value & SEGMENT_BITS) | CONTINUE_BIT;
            bytes.push(byte as u8);
            value >>= 7;
        }
        bytes
    }
}
