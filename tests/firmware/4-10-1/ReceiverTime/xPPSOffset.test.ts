import { TimeScale, xPPSOffset, xppsOffset } from '../../../../src/firmware/4-10-1/ReceiverTime/xPPSOffset'
import { RandomNumberType, TypeData, TypedData, getTypedData, randomNumber } from '../../../utils'

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

type Input = {
  timescale: number,
  meta: TimeScale
}

const defaultInput: Input = {
  timescale: 2,
  meta: TimeScale.UTC
}

const getNameFrameData = (input: Input = defaultInput) => {
  const frameName = 'xPPSOffset'
  // SyncAge
  const { number: syncAge, buffer: syncAgeBuffer } = getTypedData(randomNumber(RandomNumberType.UINT), TypeData.UINT8) as TypedData
  // TimeScale
  const { number: timeScale, buffer: timeScaleBuffer } = getTypedData(input.timescale, TypeData.UINT8) as TypedData
  // Offset
  const { number: offset, buffer: offsetBuffer } = getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT) as TypedData
  // Padding
  const padding = null
  const paddingBuffer = Buffer.from([])
  // Metadata
  const metadataTimeScale: TimeScale = input.meta

  const frame: xPPSOffset = {
    syncAge, timeScale, offset, padding,
    metadata: { timeScale: metadataTimeScale }
  }

  const data: Buffer = Buffer.concat([
    syncAgeBuffer,
    timeScaleBuffer,
    offsetBuffer,
    paddingBuffer
  ])

  return { frameName, frame, data }
}

describe('Testing xPPSOffset', () => {
  test('Regular body', () => {
    const { frameName, frame, data } = getNameFrameData()
    const { name, body } = xppsOffset(0, data)
    expect(name).toBe(frameName)
    expect(body).toStrictEqual(frame)
  })

  test('TimeScale field', () => {
    // TimeScale UTC = 2
    const input: Input = defaultInput
    const { frame: frame1, data: data1 } = getNameFrameData(input)
    const { body: body1 } = xppsOffset(0, data1)
    expect(body1).toStrictEqual(frame1)
    // TimeScale GPS = 1
    input.timescale = 1
    input.meta = TimeScale.GPS
    const { frame: frame2, data: data2 } = getNameFrameData(input)
    const { body: body2 } = xppsOffset(0, data2)
    expect(body2).toStrictEqual(frame2)
    // TimeScale Receiver = 3
    input.timescale = 3
    input.meta = TimeScale.RECEIVER
    const { frame: frame3, data: data3 } = getNameFrameData(input)
    const { body: body3 } = xppsOffset(0, data3)
    expect(body3.syncAge).toStrictEqual(0)
    expect(body3.metadata.timeScale).toStrictEqual(TimeScale.RECEIVER)
    // TimeScale GLONASS = 4
    input.timescale = 4
    input.meta = TimeScale.GLONASS
    const { frame: frame4, data: data4 } = getNameFrameData(input)
    const { body: body4 } = xppsOffset(0, data4)
    expect(body4).toStrictEqual(frame4)
    // TimeScale Galileo = 5
    input.timescale = 5
    input.meta = TimeScale.GALILEO
    const { frame: frame5, data: data5 } = getNameFrameData(input)
    const { body: body5 } = xppsOffset(0, data5)
    expect(body5).toStrictEqual(frame5)
    // TimeScale BeiDou = 6
    input.timescale = 6
    input.meta = TimeScale.BEIDOU
    const { frame: frame6, data: data6 } = getNameFrameData(input)
    const { body: body6 } = xppsOffset(0, data6)
    expect(body6).toStrictEqual(frame6)
    // TimeScale UNKNOWN > 6
    input.timescale = 8
    input.meta = TimeScale.UNKNOWN
    const { frame: frame7, data: data7 } = getNameFrameData(input)
    const { body: body7 } = xppsOffset(0, data7)
    expect(body7).toStrictEqual(frame7)
  })
})