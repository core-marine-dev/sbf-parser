import { AttEuler, Error, ErrorCode, Mode, attEuler } from '../../../../src/firmware/4-10-1/GNSSAttitude/AttEuler'
import { SBFBodyData } from '../../../../src/shared/types'
import { RandomNumberType, TypeData, TypedData, getTypedData, randomNumber } from '../../../utils'
/* AttEuler -> Number: 5938 => "OnChange" interval: default PVT output rate
The AttEuler block contains the Euler angles (pitch, roll and heading)
at the time speciﬁed in the TOW and WNc ﬁelds (in the receiver time frame).

AttEuler -------------------------------------------------------------
Block fields           Type    Units Do-Not-Use  Description
NrSV                  uint8                 255  The average over all antennas of the number of satellites currently included in the attitude calculations.
Error                 uint8                      Bit ﬁeld providing error information. For each antenna baseline, two bits are used to provide error information:
                                                   Bits 0-1: Error code for Main-Aux1 baseline:
                                                     0: No error
                                                     1: Not enough measurements
                                                     2: Reserved
                                                     3: Reserved
                                                   Bits 2-3: Error code for Main-Aux2 baseline, same deﬁnition as bit 0-1:
                                                     0: No error
                                                     1: Not enough measurements
                                                     2: Reserved
                                                     3: Reserved
                                                   Bits 4-6: Reserved
                                                   Bit    7: Set when GNSS-based attitude not requested by user. In that case, the other bits are all zero.
Mode                 uint16                      Attitude mode code:
                                                   0: No attitude
                                                   1: Heading, pitch (roll = 0), aux antenna positions obtained with ﬂoat ambiguities
                                                   2: Heading, pitch (roll = 0), aux antenna positions obtained with ﬁxed ambiguities
                                                   3: Heading, pitch, roll, aux antenna positions obtained with ﬂoat ambiguities
                                                   4: Heading, pitch, roll, aux antenna positions obtained with ﬁxed ambiguities
Reserved             uint16                      Reserved for future use, to be ignored by decoding software
Heading               float      deg  -2 * 10¹⁰  Heading
Pitch                 float      deg  -2 * 10¹⁰  Pitch
Roll                  float      deg  -2 * 10¹⁰  Roll
PitchDot              float  deg/sec  -2 * 10¹⁰  Rate of change of the pitch angle
RollDot               float  deg/sec  -2 * 10¹⁰  Rate of change of the roll angle
HeadingDot            float  deg/sec  -2 * 10¹⁰  Rate of change of the heading angle
Padding                uint                      Padding bytes
*/
const getNameFrameData = () => {
  const frameName = 'AttEuler'
  // NrSV
  const { number: nrSV, buffer: nrSVBuffer } = getTypedData(randomNumber(RandomNumberType.UINT), TypeData.UINT8) as TypedData
  // Error
  const { number: error, buffer: errorBuffer } = getTypedData(0b01110000, TypeData.UINT8) as TypedData
  // Mode
  const { number: mode, buffer: modeBuffer } = getTypedData(4, TypeData.UINT16) as TypedData
  // Rserved
  const { number: reserved, buffer: reservedBuffer } = getTypedData(randomNumber(RandomNumberType.UINT), TypeData.UINT16) as TypedData
  // Heading
  const { number: heading, buffer: headingBuffer } = getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT) as TypedData
  // Pitch
  const { number: pitch, buffer: pitchBuffer } = getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT) as TypedData
  // Roll
  const { number: roll, buffer: rollBuffer } = getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT) as TypedData
  // HeadingDot
  const { number: headingDot, buffer: headingDotBuffer } = getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT) as TypedData
  // PitchDot
  const { number: pitchDot, buffer: pitchDotBuffer } = getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT) as TypedData
  // RollDot
  const { number: rollDot, buffer: rollDotBuffer } = getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT) as TypedData
  // Paading
  const padding = null
  // Metadata
  const metadataError: Error = {
    mainAux1Baseline: ErrorCode.NO,
    mainAux2Baseline: ErrorCode.NO,
    reserved: 0b111,
    notRequestedAttitude: false
  }
  const metadataMode: Mode = Mode.HEADING_PICH_ROLL_FIXED
  
  const frame: AttEuler = {
    nrSV, error, mode, reserved, heading, pitch, roll, headingDot, pitchDot, rollDot,
    padding,
    metadata: {
      error: metadataError,
      mode: metadataMode
    }
  }
  const data: Buffer = Buffer.concat([
    nrSVBuffer,
    errorBuffer,
    modeBuffer,
    reservedBuffer,
    headingBuffer,
    pitchBuffer,
    rollBuffer,
    headingDotBuffer,
    pitchDotBuffer,
    rollDotBuffer
  ])
  return { frameName, frame, data }
}

describe('Testing AttEuler', () => {

  test('Regular body', () => {
    const { frameName, frame, data } = getNameFrameData()
    const { name, body } = attEuler(0, data)
    const bodyKeys = Object.keys(body as object)
    const frameKeys = Object.keys(frame)
    expect(name).toBe(frameName)
    expect(bodyKeys.length).toBe(frameKeys.length)
    expect(body).toStrictEqual(frame)
  })

  test('Error field', () => {
    const { frame, data } = getNameFrameData()
    // Main 1 - Error: no
    let errorBinary = 0b00000000
    let aux = getTypedData(errorBinary, TypeData.UINT8) as TypedData
    frame.error = aux.number
    frame.metadata.error = {
      mainAux1Baseline: ErrorCode.NO,
      mainAux2Baseline: ErrorCode.NO,
      reserved: 0b000,
      notRequestedAttitude: false
    }
    data[1] = aux.buffer[0]
    let body = attEuler(0, data).body
    expect(body).toStrictEqual(frame)
    // Main 1 - Error: lack of measurements
    errorBinary = 0b00000001
    aux = getTypedData(errorBinary, TypeData.UINT8) as TypedData
    frame.error = aux.number
    frame.metadata.error = {
      mainAux1Baseline: ErrorCode.MEASUREMENTS,
      mainAux2Baseline: ErrorCode.NO,
      reserved: 0b000,
      notRequestedAttitude: false
    }
    data[1] = aux.buffer[0]
    body = attEuler(0, data).body
    expect(body).toStrictEqual(frame)
    // Main 1 - Error: reserved
    errorBinary = 0b00000010
    aux = getTypedData(errorBinary, TypeData.UINT8) as TypedData
    frame.error = aux.number
    frame.metadata.error = {
      mainAux1Baseline: ErrorCode.RESERVED,
      mainAux2Baseline: ErrorCode.NO,
      reserved: 0b000,
      notRequestedAttitude: false
    }
    data[1] = aux.buffer[0]
    body = attEuler(0, data).body
    expect(body).toStrictEqual(frame)
    // Main 2 - Error: lack of measurements
    errorBinary = 0b00000100
    aux = getTypedData(errorBinary, TypeData.UINT8) as TypedData
    frame.error = aux.number
    frame.metadata.error = {
      mainAux1Baseline: ErrorCode.NO,
      mainAux2Baseline: ErrorCode.MEASUREMENTS,
      reserved: 0b000,
      notRequestedAttitude: false
    }
    data[1] = aux.buffer[0]
    body = attEuler(0, data).body
    expect(body).toStrictEqual(frame)
    // Main 2 - Error: reserved
    errorBinary = 0b00001100
    aux = getTypedData(errorBinary, TypeData.UINT8) as TypedData
    frame.error = aux.number
    frame.metadata.error = {
      mainAux1Baseline: ErrorCode.NO,
      mainAux2Baseline: ErrorCode.RESERVED,
      reserved: 0b000,
      notRequestedAttitude: false
    }
    data[1] = aux.buffer[0]
    body = attEuler(0, data).body
    expect(body).toStrictEqual(frame)
    // Not requested Attitude by user
    errorBinary = 0b10000000
    aux = getTypedData(errorBinary, TypeData.UINT8) as TypedData
    frame.error = aux.number
    frame.metadata.error = {
      mainAux1Baseline: ErrorCode.NO,
      mainAux2Baseline: ErrorCode.NO,
      reserved: 0b000,
      notRequestedAttitude: true
    }
    data[1] = aux.buffer[0]
    body = attEuler(0, data).body
    expect(body).toStrictEqual(frame)
  })

  test('Mode field', () => {
    const { frame, data } = getNameFrameData()
    // Mode 0 - No attitude
    let modeBinary = 0
    let aux = getTypedData(modeBinary, TypeData.UINT8) as TypedData
    frame.mode = aux.number
    frame.metadata.mode = Mode.NO
    data[2] = aux.buffer[0]
    data[3] = aux.buffer[1]
    let body = attEuler(0, data).body
    expect(body).toStrictEqual(frame)
    // Mode 1 - Heading, pitch (roll = 0), aux antenna positions obtained with ﬂoat ambiguities
    modeBinary = 1
    aux = getTypedData(modeBinary, TypeData.UINT8) as TypedData
    frame.mode = aux.number
    frame.metadata.mode = Mode.HEADING_PICH_FLOAT
    data[2] = aux.buffer[0]
    data[3] = aux.buffer[1]
    body = attEuler(0, data).body
    expect(body).toStrictEqual(frame)
    // Mode 2 - Heading, pitch (roll = 0), aux antenna positions obtained with ﬁxed ambiguities
    modeBinary = 2
    aux = getTypedData(modeBinary, TypeData.UINT8) as TypedData
    frame.mode = aux.number
    frame.metadata.mode = Mode.HEADING_PICH_FIXED
    data[2] = aux.buffer[0]
    data[3] = aux.buffer[1]
    body = attEuler(0, data).body
    expect(body).toStrictEqual(frame)
    // Mode 3 - Heading, pitch, roll, aux antenna positions obtained with ﬂoat ambiguities
    modeBinary = 3
    aux = getTypedData(modeBinary, TypeData.UINT8) as TypedData
    frame.mode = aux.number
    frame.metadata.mode = Mode.HEADING_PICH_ROLL_FLOAT
    data[2] = aux.buffer[0]
    data[3] = aux.buffer[1]
    body = attEuler(0, data).body
    expect(body).toStrictEqual(frame)
    // Mode 4 - Heading, pitch, roll, aux antenna positions obtained with ﬁxed ambiguities
    modeBinary = 4
    aux = getTypedData(modeBinary, TypeData.UINT8) as TypedData
    frame.mode = aux.number
    frame.metadata.mode = Mode.HEADING_PICH_ROLL_FIXED
    data[2] = aux.buffer[0]
    data[3] = aux.buffer[1]
    body = attEuler(0, data).body
    expect(body).toStrictEqual(frame)
  })
})