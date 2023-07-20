import { BYTES_LENGTH } from "../../../shared/constants"
import { Padding, SBFBodyData } from "../../../shared/types"
import { getPadding } from "../../../shared/utils"
/* xPPSOffset -> Number: 5911 => "OnChange" interval: PPS rate
  The xPPSOffset block contains the offset between the true xPPS pulse and 
  the actual pulse output by the receiver. It is output right after each xPPS pulse.

  On receivers with more than one independent PPS outputs, this block always 
  refers to the ﬁrst PPS output.

  xPPSOffset ----------------------------------------------------------------
  Block fields  Type        Units  Do-Not-Use  Description
  SyncAge      uint8          sec              Age of the last synchronization to system time. 
                                               The xPPS pulse is regularly resynchronized with system time.
                                               This ﬁeld indicates the number of seconds elapsed since the last resynchronization.
                                               SyncAge is constrained to the 0-255s range.
                                               If the age is higher than 255s, SyncAge is set to 255.
                                               If the PPS is synchronized with the internal receiver time (Timescale= 3), SyncAge is always set to 0.
  TimeScale    uint8                           Time scale to which the xPPS pulse is referenced, as set with the setPPSParameters command:
                                                 1: GPS time
                                                 2: UTC
                                                 3: Receiver time
                                                 4: GLONASS time
                                                 5: Galileo time
                                                 6: BeiDou time
  Offset     float32  1*10^−9 sec              Offset of the xPPS output by the receiver with respect to its true position.
                                               Offset is negative when the xPPS pulse is in advance with respect to its true position.
  Padding       uint                           Padding bytes
*/
const SYNC_AGE_INDEX = 0
const SYNC_AGE_LENGTH = BYTES_LENGTH.UINT8

const TIME_SCALE_INDEX = SYNC_AGE_INDEX + SYNC_AGE_LENGTH
const TIME_SCALE_LENGTH = BYTES_LENGTH.UINT8

const OFFSET_INDEX = TIME_SCALE_INDEX + TIME_SCALE_LENGTH
const OFFSET_LENGTH = BYTES_LENGTH.FLOAT

const PADDING_INDEX = OFFSET_INDEX + OFFSET_LENGTH

export const enum TimeScale {
  GPS = 'GPS',
  UTC = 'UTC',
  RECEIVER = 'Receiver',
  GLONASS = 'GLONASS',
  GALILEO = 'Galileo',
  BEIDOU = 'BEIDOU',
  UNKNOWN = 'UNKNOWN'
}

const getTimeScale = (timeScale: number): TimeScale => {
  switch (timeScale) {
    case 1: return TimeScale.GPS
    case 2: return TimeScale.UTC
    case 3: return TimeScale.RECEIVER
    case 4: return TimeScale.GLONASS
    case 5: return TimeScale.GALILEO
    case 6: return TimeScale.BEIDOU
  }
  return TimeScale.UNKNOWN
}

export type xPPSOffset = {
  syncAge: number,
  timeScale: number,
  offset: number,
  padding: Padding,
  metadata: {
    timeScale: TimeScale,
  }
}

interface Response extends SBFBodyData {
  body: xPPSOffset
}

export const xppsOffset = (blockRevision: number, data: Buffer): Response => {
  const name = 'xPPSOffset'
  const PADDING_LENGTH = data.subarray(PADDING_INDEX).length
  const body: xPPSOffset = {
    syncAge: data.readUIntLE(SYNC_AGE_INDEX, SYNC_AGE_LENGTH),
    timeScale: data.readUIntLE(TIME_SCALE_INDEX, TIME_SCALE_LENGTH),
    offset: data.readFloatLE(OFFSET_INDEX),
    padding: getPadding(data, PADDING_INDEX, PADDING_LENGTH),
    metadata: {}
  } as xPPSOffset
  body.metadata.timeScale = getTimeScale(body.timeScale)
  if (body.metadata.timeScale === TimeScale.RECEIVER) {
    body.syncAge = 0
  }
  return { name, body }
}