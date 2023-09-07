use thiserror::Error;
#[derive(Debug, Copy, Clone, Eq, PartialEq, Ord, PartialOrd, Hash)]
pub struct VarInt(i32);
impl std::fmt::Display for VarInt {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{}", self.0)
  }
}

impl VarInt {
  pub fn new(value: i32) -> Self {
    VarInt(value)
  }
  pub fn into_inner(self) -> i32 {
    self.0
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
      let current_byte = next_byte().ok_or(DecodeError::Incomplete)?;
      value |= ((current_byte & SEGMENT_BITS) as i32) << position;
      if (current_byte & CONTINUE_BIT) == 0 {
        break Ok(Self(value));
      }
      position += 7;
      if position >= 32 {
        break Err(DecodeError::TooLarge);
      }
    }
  }
}

impl From<VarInt> for Vec<u8> {
  fn from(VarInt(varint): VarInt) -> Self {
    let mut bytes = Vec::new();
    let mut value = varint as u32;
    loop {
      if value & !(SEGMENT_BITS as u32) == 0 {
        bytes.push(value as u8);
        break bytes;
      }
      bytes.push(((value as u8) & SEGMENT_BITS) | CONTINUE_BIT);
      value >>= 7;
    }
  }
}
pub struct VarLong(i64);
impl VarLong {
  pub fn new(value: i64) -> Self {
    VarLong(value)
  }
  pub fn into_inner(self) -> i64 {
    self.0
  }
}
impl From<VarLong> for Vec<u8> {
  fn from(VarLong(varlong): VarLong) -> Self {
    let mut bytes = Vec::new();
    let mut value = varlong as u64;
    loop {
      if value & !(SEGMENT_BITS as u64) == 0 {
        bytes.push(value as u8);
        break bytes;
      }
      bytes.push(((value as u8) & SEGMENT_BITS) | CONTINUE_BIT);
      value >>= 7;
    }
  }
}
impl TryFrom<&[u8]> for VarLong {
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
      let current_byte = next_byte().ok_or(DecodeError::Incomplete)?;
      value |= ((current_byte & SEGMENT_BITS) as i64) << position;
      if (current_byte & CONTINUE_BIT) == 0 {
        break Ok(Self(value));
      }
      position += 7;
      if position >= 64 {
        break Err(DecodeError::TooLarge);
      }
    }
  }
}
#[cfg(test)]
mod tests {
  use super::*;
  #[test]
  fn test_varint() {
    #[derive(Debug, Copy, Clone)]
    struct TestCase {
      value: i32,
      bytes: &'static [u8],
    }
    const TEST_CASES: &[TestCase] = &[
      TestCase {
        value: 0,
        bytes: &[0x00],
      },
      TestCase {
        value: 1,
        bytes: &[0x01],
      },
      TestCase {
        value: 2,
        bytes: &[0x02],
      },
      TestCase {
        value: 127,
        bytes: &[0x7f],
      },
      TestCase {
        value: 128,
        bytes: &[0x80, 0x01],
      },
      TestCase {
        value: 255,
        bytes: &[0xff, 0x01],
      },
      TestCase {
        value: 25565,
        bytes: &[0xdd, 0xc7, 0x01],
      },
      TestCase {
        value: 2097151,
        bytes: &[0xff, 0xff, 0x7f],
      },
      TestCase {
        value: 2147483647,
        bytes: &[0xff, 0xff, 0xff, 0xff, 0x07],
      },
      TestCase {
        value: -1,
        bytes: &[0xff, 0xff, 0xff, 0xff, 0x0f],
      },
      TestCase {
        value: -2147483648,
        bytes: &[0x80, 0x80, 0x80, 0x80, 0x08],
      },
    ];
    for (i, test_case) in TEST_CASES.into_iter().enumerate().map(|(i, t)| (i+1, t)) {
      let varint = VarInt::new(test_case.value);
      let bytes = Vec::<u8>::from(varint);
      if bytes != test_case.bytes {
        panic!("Failed test case #{i}: {test_case:#?}");
      }
      let varint = VarInt::try_from(&bytes[..]).unwrap();
      if varint.0 != test_case.value {
        panic!("Failed test case #{i}: {test_case:#?}");
      }
    }
  }
  #[test]
  fn test_varlong() {
    #[derive(Debug, Copy, Clone)]
    struct TestCase {
      value: i64,
      bytes: &'static [u8],
    }
    const TEST_CASES: &[TestCase] = &[
      TestCase {
        value: 0,
        bytes: &[0x00],
      },
      TestCase {
        value: 1,
        bytes: &[0x01],
      },
      TestCase {
        value: 2,
        bytes: &[0x02],
      },
      TestCase {
        value: 127,
        bytes: &[0x7f],
      },
      TestCase {
        value: 128,
        bytes: &[0x80, 0x01],
      },
      TestCase {
        value: 255,
        bytes: &[0xff, 0x01],
      },
      TestCase {
        value: 2147483647,
        bytes: &[0xff, 0xff, 0xff, 0xff, 0x07],
      },
      TestCase {
        value: 9223372036854775807,
        bytes: &[0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7f],
      },
      TestCase {
        value: -1,
        bytes: &[0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01],
      },
      TestCase {
        value: -2147483648,
        bytes: &[0x80, 0x80, 0x80, 0x80, 0xf8, 0xff, 0xff, 0xff, 0xff, 0x01],
      },
      TestCase {
        value: -9223372036854775808,
        bytes: &[0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x01],
      },
    ];
    for (i, test_case) in TEST_CASES.into_iter().enumerate().map(|(i, t)| (i+1, t)) {
      let varlong = VarLong::new(test_case.value);
      let bytes = Vec::<u8>::from(varlong);
      if bytes != test_case.bytes {
        panic!("Failed test case #{i}: {test_case:#?}");
      }
      let varlong = VarLong::try_from(&bytes[..]).unwrap();
      if varlong.0 != test_case.value {
        panic!("Failed test case #{i}: {test_case:#?}");
      }
    }
  }
}
