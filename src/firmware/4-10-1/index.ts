import { UNKNOWN_SBF_BODY_DATA } from "../../shared/constants"
import { SBFBodyData, SBFBodyDataMap, SBFBodyDataParser } from "../../shared/types"
import { blocks as GNSSAttitude } from "./GNSSAttitude"
import { blocks as GNSSPositionVelocityTime } from "./GNSSPositionVelocityTime"
import { blocks as ReceiverTime } from "./ReceiverTime"
// Blocks
// Measurement
// Navigation
// GPS Decoded
// GLONASS Decoded
// Galileo Decoded
// BeiDou Decoded
// QZSS Decoded
// SBAS L1 Decoded
// GNSS Position, Velocity and Time
// GNSS Attitude
// Receiver Time
// External Event
// Differential Correction
// L-Band Modulator
// Status
// Miscellaneous
const blocks: SBFBodyDataMap = new Map([
  ...GNSSPositionVelocityTime,
  ...GNSSAttitude,
  ...ReceiverTime,
])

export const getSBFFrame: SBFBodyDataParser = (blockNumber: number, blockRevision: number, data: Buffer): SBFBodyData => {
  const parser = blocks.get(blockNumber)
  if (parser) return parser(blockRevision, data)
  return UNKNOWN_SBF_BODY_DATA
}