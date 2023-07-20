import { SBFBodyData } from "./types"

export const SYNC_FLAG_ASCII = '$@'
export const SYNC_FLAG_DECIMAL = [36, 64]
export const SYNC_FLAG_HEX = [0x24, 0x40]
export const SYNC_FLAG_BUFFER = Buffer.from([36, 64])

export const SYNC_LENGTH = 2

export const CRC_INDEX = 2
export const CRC_LENGTH = 2

export const ID_INDEX = 4
export const ID_LENGTH = 2

export const LENGTH_INDEX = 6
export const LENGTH_LENGTH = 2

export const TOW_INDEX = 8
export const TOW_LENGTH = 4
export const WNC_INDEX = 12
export const WNC_LENGTH = 2

export const BODY_INDEX = 14

export const HEADER_LENGTH = SYNC_LENGTH + CRC_LENGTH + ID_LENGTH + LENGTH_LENGTH
export const TIME_LENGTH = TOW_LENGTH + WNC_LENGTH

export const MINIMAL_FRAME_LENGTH = HEADER_LENGTH + TIME_LENGTH

export const DO_NOT_USE_TOW = 4294967295
export const DO_NOT_USE_WNC = 65535

export const TWO_BYTES_MAX = 65_535

export const UNKNOWN_SBF_BODY_DATA: SBFBodyData = {
  name: 'unknown',
  body: null
}

export const BYTES_LENGTH = {
  // INTEGER
  INT8: 1,
  INT16: 2,
  INT32: 4,
  INT64: 8,
  // UNSIGNED INTEGER
  UINT8: 1,
  UINT16: 2,
  UINT32: 4,
  UINT64: 8,
  // FLOAT
  FLOAT: 4,
  DOUBLE: 8,
}