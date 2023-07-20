import { BYTES_LENGTH } from "../../../shared/constants"
import { Padding, SBFBodyData } from "../../../shared/types"
import { bitState, getPadding } from "../../../shared/utils"
/* ReceiverTime -> Number: 5914 => "OnChange" interval: 1 second
  The ReceiverTime block provides the current time with a 1-second resolution 
  in the receiver time scale and UTC.
  
  The level of synchronization of the receiver time with the satellite system 
  time is provided in the SyncLevel ﬁeld.

  UTC time is provided if the UTC parameters have been received from at least 
  one GNSS satellite. If the UTC time is not available, the corresponding 
  ﬁelds are set to their Do-Not-Use value.

  ReceiverTime ----------------------------------------------------------------
  Block fields   Type   Units  Do-Not-Use  Description
  UTCYear        int8    year        -128  Current year in the UTC time scale (2 digits). From 0 to 99, or -128 if not available
  UTCMonth       int8   month        -128  Current month in the UTC time scale. From 1 to 12, or -128 if not available
  UTCDay         int8     day        -128  Current day in the UTC time scale. From 1 to 31, or -128 if not available
  UTCHour        int8    hour        -128  Current hour in the UTC time scale. From 0 to 23, or -128 if not available
  UTCMin         int8  minute        -128  Current minute in the UTC time scale. From 0 to 59, or -128 if not available
  UTCSec         int8  second        -128  Current second in the UTC time scale. From 0 to 59, or -128 if not availab;e
  DeltaLS        int8  second        -128  Integer second difference between UTC time and GPS system time. Positive if GPS time is ahead of UTC. Set to -128 if not available.
  SyncLevel     uint8                      Bit ﬁeld indicating the synchronization level of the receiver time. If bits 0 to 2 are set, full synchronization is achieved:
                                             Bit 0: WNSET: if this bit is set, the receiver week number is set.
                                             Bit 1: TOWSET: if this bit is set, the receiver time-of-week is set to within 20ms.
                                             Bit 2: FINETIME: if this bit is set, the receiver time-of-week is within the limit speciﬁed by the setClockSyncThreshold command.
                                             Bit 3: Reserved
                                             Bit 4: Reserved
                                             Bits 5-7: Reserved
  Padding        uint                      Padding bytes
*/
const UTC_YEAR_INDEX = 0
const UTC_YEAR_LENGTH = BYTES_LENGTH.INT8

const UTC_MONTH_INDEX = UTC_YEAR_INDEX + UTC_YEAR_LENGTH
const UTC_MONTH_LENGTH = BYTES_LENGTH.INT8

const UTC_DAY_INDEX = UTC_MONTH_INDEX + UTC_MONTH_LENGTH
const UTC_DAY_LENGTH = BYTES_LENGTH.INT8

const UTC_HOUR_INDEX = UTC_DAY_INDEX + UTC_DAY_LENGTH
const UTC_HOUR_LENGTH = BYTES_LENGTH.INT8

const UTC_MIN_INDEX = UTC_HOUR_INDEX + UTC_HOUR_LENGTH
const UTC_MIN_LENGTH = BYTES_LENGTH.INT8

const UTC_SEC_INDEX = UTC_MIN_INDEX + UTC_MIN_LENGTH
const UTC_SEC_LENGTH = BYTES_LENGTH.INT8

const DELTA_LS_INDEX = UTC_SEC_INDEX + UTC_SEC_LENGTH
const DELTA_LS_LENGTH = BYTES_LENGTH.INT8

const SYNC_LEVEL_INDEX = DELTA_LS_INDEX + DELTA_LS_LENGTH
const SYNC_LEVEL_LENGTH = BYTES_LENGTH.UINT8

const PADDING_INDEX = SYNC_LEVEL_INDEX + SYNC_LEVEL_LENGTH

const DO_NOT_USE = -128
const getTimeData = (data: number) => (data !== DO_NOT_USE) ? data : null

export const enum Synchronization {
  FULL = 'FULL',
  NOT_FULL = 'NOT_FULL',
  NONE = 'NONE',
  UNKNOWN = 'UNKNOWN'
}

export type SyncLevel = {
  synchronization: Synchronization,
  wnSet: boolean,
  towSet: boolean,
  finetime: boolean,
  reserved1: boolean,
  reserved2: boolean,
  reserved3: number
}

const getSyncLevel = (syncLevel: number): SyncLevel => {
  const response: SyncLevel = {
    synchronization: Synchronization.UNKNOWN,
    wnSet: bitState(syncLevel, 0),
    towSet: bitState(syncLevel, 1),
    finetime: bitState(syncLevel, 2),
    reserved1: bitState(syncLevel, 3),
    reserved2: bitState(syncLevel, 4),
    reserved3: (syncLevel & 0b11100000) >>> 5
  }
  const sync = [response.wnSet, response.towSet, response.finetime]
  if (sync.every(e => e ===  true)) {
    response.synchronization = Synchronization.FULL
  } else {
    response.synchronization = (sync.every(e => e === false)) ? Synchronization.NONE : Synchronization.NOT_FULL
  }
  return response
}

export type ReceiverTime = {
  utcYear: number | null,
  utcMonth: number | null,
  utcDay: number | null,
  utcHour: number | null,
  utcMin: number | null,
  utcSec: number | null,
  deltaLS: number | null,
  syncLevel: number,
  padding: Padding,
  metadata: {
    syncLeveL: SyncLevel,
  }
}

interface Response extends SBFBodyData {
  body: ReceiverTime
}

export const receiverTime = (blockRevision: number, data: Buffer): Response => {
  const name = 'ReceiverTime'
  const PADDING_LENGTH = data.subarray(PADDING_INDEX).length
  const body: ReceiverTime = {
    utcYear:  getTimeData(data.readIntLE(UTC_YEAR_INDEX, UTC_YEAR_LENGTH)),
    utcMonth: getTimeData(data.readIntLE(UTC_MONTH_INDEX, UTC_MONTH_LENGTH)),
    utcDay:   getTimeData(data.readIntLE(UTC_DAY_INDEX, UTC_DAY_LENGTH)),
    utcHour:  getTimeData(data.readIntLE(UTC_HOUR_INDEX, UTC_HOUR_LENGTH)),
    utcMin:   getTimeData(data.readIntLE(UTC_MIN_INDEX, UTC_MIN_LENGTH)),
    utcSec:   getTimeData(data.readIntLE(UTC_SEC_INDEX, UTC_SEC_LENGTH)),
    deltaLS:  getTimeData(data.readIntLE(DELTA_LS_INDEX, DELTA_LS_LENGTH)),
    syncLevel: data.readUIntLE(SYNC_LEVEL_INDEX, SYNC_LEVEL_LENGTH),
    padding: getPadding(data, PADDING_INDEX, PADDING_LENGTH),
    metadata: {}
  } as ReceiverTime
  body.metadata.syncLeveL = getSyncLevel(body.syncLevel)
  return { name, body }
}