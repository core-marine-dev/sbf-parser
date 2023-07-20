import { ReceiverTime, SyncLevel, Synchronization, receiverTime } from '../../../../src/firmware/4-10-1/ReceiverTime/ReceiverTime'
import { TypeData, TypedData, getTypedData } from '../../../utils'
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
const getDate = () => {
  const date = new Date()
  const year = parseInt(date.getFullYear().toString().slice(-2))
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  const milliseconds = date.getMilliseconds()
  return { year, month, day, hours, minutes, seconds, milliseconds }
}

type Input = {
  syncLevel: number,
  meta: SyncLevel
}

const defaultInput: Input = {
  syncLevel: 0b1111_1111,
  meta: {
    synchronization: Synchronization.FULL,
    wnSet: true,
    towSet: true,
    finetime: true,
    reserved1: true,
    reserved2: true,
    reserved3: 0b111
  }
}

const getNameFrameData = (input: Input = defaultInput) => {
  const frameName = 'ReceiverTime'
  const { year, month, day, hours, minutes, seconds } = getDate()
  // UTCYear
  const { number: utcYear, buffer: utcYearBuffer } = getTypedData(year, TypeData.INT8) as TypedData
  // UTCMonth
  const { number: utcMonth, buffer: utcMonthBuffer } = getTypedData(month, TypeData.INT8) as TypedData
  // UTCDay
  const { number: utcDay, buffer: utcDayBuffer } = getTypedData(day, TypeData.INT8) as TypedData
  // UTCHour
  const { number: utcHour, buffer: utcHourBuffer } = getTypedData(hours, TypeData.INT8) as TypedData
  // UTCMin
  const { number: utcMin, buffer: utcMinBuffer } = getTypedData(minutes, TypeData.INT8) as TypedData
  // UTCSec
  const { number: utcSec, buffer: utcSecBuffer } = getTypedData(seconds, TypeData.INT8) as TypedData
  // DeltaLS
  const { number: deltaLS, buffer: deltaLSBuffer } = getTypedData(0, TypeData.INT8) as TypedData
  // SyncLevel
  const { number: syncLevel, buffer: syncLeveLBuffer } = getTypedData(input.syncLevel, TypeData.UINT8) as TypedData
  // Padding
  const padding = null
  const paddingBuffer = Buffer.from([])
  // Metadata
  const metadataSyncLeveL: SyncLevel = { ...input.meta }
  
  const frame: ReceiverTime = {
    utcYear, utcMonth, utcDay, utcHour, utcMin, utcSec, deltaLS, syncLevel,
    padding,
    metadata: { syncLeveL: metadataSyncLeveL }
  }
  const data: Buffer = Buffer.concat([
    utcYearBuffer, utcMonthBuffer, utcDayBuffer,
    utcHourBuffer, utcMinBuffer, utcSecBuffer,
    deltaLSBuffer, syncLeveLBuffer, paddingBuffer
  ])
  return { frameName, frame, data }
}

describe('Testing ReceiverTime', () => {
  test('Regular body', () => {
    const { frameName, frame, data } = getNameFrameData()
    const { name, body } = receiverTime(0, data)
    expect(name).toBe(frameName)
    expect(body).toStrictEqual(frame)
  })

  test('SyncLevel field', () => {
    // Full synchronization
    const input: Input = defaultInput
    const { frame: frame1, data: data1 } = getNameFrameData()
    const { body: body1 } = receiverTime(0, data1)
    expect(body1).toStrictEqual(frame1)
    expect(body1.metadata.syncLeveL.synchronization).toBe(Synchronization.FULL)
    // WNSet synchronization
    input.syncLevel = 0b0000_0001
    input.meta = {
      synchronization: Synchronization.NOT_FULL,
      wnSet: true, towSet: false, finetime: false,
      reserved1: false, reserved2: false, reserved3: 0b000
    }
    const { frame: frame2, data: data2 } = getNameFrameData()
    const {  body: body2 } = receiverTime(0, data2)
    expect(body2).toStrictEqual(frame2)
    expect(body2.metadata.syncLeveL.synchronization).toBe(Synchronization.NOT_FULL)
    expect(body2.metadata.syncLeveL.wnSet).toBeTruthy()
    expect(body2.metadata.syncLeveL.towSet).toBeFalsy()
    expect(body2.metadata.syncLeveL.finetime).toBeFalsy()
    // TOWSet synchronization
    input.syncLevel = 0b0000_0010
    input.meta = {
      synchronization: Synchronization.NOT_FULL,
      wnSet: false, towSet: true, finetime: false,
      reserved1: false, reserved2: false, reserved3: 0b000
    }
    const { frame: frame3, data: data3 } = getNameFrameData()
    const {  body: body3 } = receiverTime(0, data3)
    expect(body3).toStrictEqual(frame3)
    expect(body3.metadata.syncLeveL.synchronization).toBe(Synchronization.NOT_FULL)
    expect(body3.metadata.syncLeveL.wnSet).toBeFalsy()
    expect(body3.metadata.syncLeveL.towSet).toBeTruthy()
    expect(body3.metadata.syncLeveL.finetime).toBeFalsy()
    // FINETIME synchronization
    input.syncLevel = 0b0000_0100
    input.meta = {
      synchronization: Synchronization.NOT_FULL,
      wnSet: false, towSet: false, finetime: true,
      reserved1: false, reserved2: false, reserved3: 0b000
    }
    const { frame: frame4, data: data4 } = getNameFrameData()
    const {  body: body4 } = receiverTime(0, data4)
    expect(body4).toStrictEqual(frame4)
    expect(body4.metadata.syncLeveL.synchronization).toBe(Synchronization.NOT_FULL)
    expect(body4.metadata.syncLeveL.wnSet).toBeFalsy()
    expect(body4.metadata.syncLeveL.towSet).toBeFalsy()
    expect(body4.metadata.syncLeveL.finetime).toBeTruthy()
    // NO synchronization
    input.syncLevel = 0b0000_0000
    input.meta = {
      synchronization: Synchronization.NONE,
      wnSet: false, towSet: false, finetime: false,
      reserved1: false, reserved2: false, reserved3: 0b000
    }
    const { frame: frame5, data: data5 } = getNameFrameData()
    const {  body: body5 } = receiverTime(0, data5)
    expect(body5).toStrictEqual(frame5)
    expect(body5.metadata.syncLeveL.synchronization).toBe(Synchronization.NONE)
    expect(body5.metadata.syncLeveL.wnSet).toBeFalsy()
    expect(body5.metadata.syncLeveL.towSet).toBeFalsy()
    expect(body5.metadata.syncLeveL.finetime).toBeFalsy()
  })
})