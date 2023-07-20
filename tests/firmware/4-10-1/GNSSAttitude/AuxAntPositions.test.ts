import { RandomNumberType, TypeData, TypedData, getTypedData, randomNumber } from '../../../utils'
import { Ambiguity, AuxAntPositionSub, AuxAntPositions, Error, auxAntPositions } from '../../../../src/firmware/4-10-1/GNSSAttitude/AuxAntPositions'

/* AuxAntPositions -> Number: 5942 => "OnChange" interval: default PVT output rate
  The AuxAntPositions block contains the relative position and velocity of the 
  different antennas in a multi-antenna receiver.
  The coordinates are expressed in the local-level ENU reference frame.

  When the antenna positions cannot be estimated, the baseline vectors are set
  to their Do-Not-Use value

  AuxAntPositions -------------------------------------------------------------
  Block fields           Type  Units  Do-Not-Use  Description
  N                     uint8                     Number of AuxAntPositionSub sub-blocks in this AuxAntPositions block
  SBLength              uint8                     Length of one sub-block in bytes
  AuxAntPositionSub[N]                            A succession of N AuxAntPositionSub sub-blocks
  Padding                uint                     Padding bytes
  
  AuxAntPositionSub -----------------------------------------------------------
  Block fields           Type  Units  Do-Not-Use  Description
  NrSV                  uint8                255  Total number of satellites tracked by the antenna identified by the AuxAntID field and used in the attitude computation
  Error                 uint8                     Aux antenna position error code:
                                                    0: Not error
                                                    1: Not enough measurements
                                                    2: Reserved
                                                    3: Reserved
                                                    If error is not 0, the coordinates reported later in this block are all set to their Do-Not-Use value
  AmbiguityType         uint8                255  Aux antenna positions obtained with
                                                    0: Fixed ambiguities
                                                    1: Float ambiguities
  AuxAntID              uint8                     Auxiliary antenna ID: 1 for the ﬁrst auxiliary antenna, 2 for the second, etc...
  DeltaEast           float64      m   -2 * 10¹⁰  Position in East direction  (relative to main antenna)
  DeltaNorth          float64      m   -2 * 10¹⁰  Position in North direction (relative to main antenna)
  DeltaUp             float64      m   -2 * 10¹⁰  Position in Up direction    (relative to main antenna)
  EastVel             float64  m/sec   -2 * 10¹⁰  Velocity in East direction  (relative to main antenna)
  NorthVel            float64  m/sec   -2 * 10¹⁰  Velocity in North direction (relative to main antenna)
  UpVel               float64  m/sec   -2 * 10¹⁰  Velocity in Up direction    (relative to main antenna)
  Padding                uint
*/
type Input = { length: number, satellites: number, error: number, errorMeta: Error, ambiguity: number, ambiguityMeta: Ambiguity, antID: number }

const getAuxAntPositionSub = (input: Input) => {
  // NrSV
  const { number: nrSV, buffer: nrSVBuffer } = getTypedData(input.satellites, TypeData.UINT8) as TypedData
  // Error
  const { number: error, buffer: errorBuffer } = getTypedData(input.error, TypeData.UINT8) as TypedData
  // AmbiguityType
  const { number: ambiguityType, buffer: ambiguityTypeBuffer } = getTypedData(input.ambiguity, TypeData.UINT8) as TypedData
  // AuxAntID
  const { number: auxAntID, buffer: auxAntIDBuffer } = getTypedData(input.antID, TypeData.UINT8) as TypedData
  // DeltaEast
  const { number: deltaEast, buffer: deltaEastBuffer } = getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.DOUBLE) as TypedData
  // DeltaNorth
  const { number: deltaNorth, buffer: deltaNorthBuffer } = getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.DOUBLE) as TypedData
  // DeltaUp
  const { number: deltaUp, buffer: deltaUpBuffer } = getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.DOUBLE) as TypedData
  // EastVel
  const { number: eastVel, buffer: eastVelBuffer } = getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.DOUBLE) as TypedData
  // NorthVel
  const { number: northVel, buffer: northVelBuffer } = getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.DOUBLE) as TypedData
  // UpVel
  const { number: upVel, buffer: upVelBuffer } = getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.DOUBLE) as TypedData
  // Padding
  const auxBuffer = Buffer.concat([nrSVBuffer, errorBuffer, ambiguityTypeBuffer, auxAntIDBuffer, deltaEastBuffer, deltaNorthBuffer, deltaUpBuffer, eastVelBuffer, northVelBuffer, upVelBuffer ])
  const paddingLength = input.length - auxBuffer.length
  const { padding, paddingBuffer } = (paddingLength > 0)
    ? { padding: 0, paddingBuffer: Buffer.from(Array(paddingLength).fill(0)) }
    : { padding: null, paddingBuffer: Buffer.from([]) }

  const frameSub: AuxAntPositionSub = {
    nrSV, error, ambiguityType, auxAntID, deltaEast, deltaNorth, deltaUp, eastVel, northVel, upVel, padding,
    metadata: {
      error: input.errorMeta,
      ambiguityType: input.ambiguityMeta
    }
  }

  const dataSub = Buffer.concat([auxBuffer, paddingBuffer])

  return { frameSub, dataSub }
}

type ErrorNumber = 0 | 1 | 2 | 3 | 4
type ErrorTest = {
  error: ErrorNumber,
  type: Error
}
const errorTestDefault: ErrorTest = { error: 0, type: Error.NO }

type Ambiguitynumber = 0 | 1 | 2
type AmbiguityTest = {
  ambiguity: Ambiguitynumber,
  type: Ambiguity
}
const ambiguityTestDefault: AmbiguityTest = { ambiguity: 0, type: Ambiguity.FIXED }

type InputData = {
  antennas: number,
  subFramesLength: number,
  errorTest: ErrorTest,
  ambiguityTest: AmbiguityTest
}

const defaultInput: InputData = {
  antennas: 2,
  subFramesLength: 52,
  errorTest: errorTestDefault,
  ambiguityTest: ambiguityTestDefault
} 

const getNameFrameData = (input: InputData = defaultInput) => {
  const frameName = 'AuxAntPositions'
  // N
  const { number: n, buffer: nBuffer } = getTypedData(input.antennas, TypeData.UINT8) as TypedData
  // SBLength
  const { number: sbLength, buffer: sbLengthBuffer } = getTypedData(input.subFramesLength, TypeData.UINT8) as TypedData
  // AuxAntPositionSub[] * N
  const { frameSub: frameSub1, dataSub: dataSub1 } = getAuxAntPositionSub({
    length: sbLength,
    satellites: randomNumber(RandomNumberType.UINT),
    error: input.errorTest.error,
    errorMeta: input.errorTest.type,
    ambiguity: input.ambiguityTest.ambiguity,
    ambiguityMeta: input.ambiguityTest.type,
    antID: 0
})
  const { frameSub: frameSub2, dataSub: dataSub2 } = getAuxAntPositionSub({
    length: sbLength,
    satellites: randomNumber(RandomNumberType.UINT),
    error: input.errorTest.error,
    errorMeta: input.errorTest.type,
    ambiguity: input.ambiguityTest.ambiguity,
    ambiguityMeta: input.ambiguityTest.type,
    antID: 1
})
  const auxAntPositionSub = [frameSub1, frameSub2]
  const auxAntPositionSubBuffer = Buffer.concat([dataSub1, dataSub2])
  // Padding
  const padding = null
  const paddingBuffer = Buffer.from([])

  const frame: AuxAntPositions = { n, sbLength, auxAntPositionSub, padding }
  const data: Buffer = Buffer.concat([
    nBuffer,
    sbLengthBuffer,
    auxAntPositionSubBuffer,
    paddingBuffer
  ])

  return { frameName, frame, data }
}

const getNullableFields = (sub: AuxAntPositionSub) => {
  const { deltaEast, deltaNorth, deltaUp, eastVel, northVel, upVel } = sub
  return { deltaEast, deltaNorth, deltaUp, eastVel, northVel, upVel }
}

describe('Testing AuxAntPositions', () => {

  test('Regular body', () => {
    const { frameName, frame, data } = getNameFrameData()
    const { name, body } = auxAntPositions(0, data) as { name: string, body: AuxAntPositions}
    const bodyKeys = Object.keys(body as object)
    const frameKeys = Object.keys(frame)
    expect(name).toBe(frameName)
    expect(bodyKeys.length).toBe(frameKeys.length)
    expect(body).toStrictEqual(frame)
  })

  test('Error field', () => {
    const antennas = 2
    const subFramesLength = 52
    const errorTest: ErrorTest = { error: 1, type: Error.MEASUREMENTS }
    const ambiguityTest: AmbiguityTest = { ambiguity: 0, type: Ambiguity.FIXED }

    const { frame: frame1, data: data1 } = getNameFrameData({ antennas, subFramesLength, errorTest, ambiguityTest })
    const { body: body1 } = auxAntPositions(0, data1) as { name: string, body: AuxAntPositions }
    expect(body1).not.toStrictEqual(frame1)

    body1.auxAntPositionSub.forEach((sub: AuxAntPositionSub) => {
      const fields = getNullableFields(sub)
      const result = Object.values(fields).every(value => value === null)
      expect(result).toBeTruthy()
    })

    errorTest.error = 2 
    errorTest.type = Error.RESERVED
    const { frame: frame2, data: data2 } = getNameFrameData({ antennas, subFramesLength, errorTest, ambiguityTest })
    const { body: body2 } = auxAntPositions(0, data2) as { name: string, body: AuxAntPositions }
    expect(body2).not.toStrictEqual(frame2)

    body2.auxAntPositionSub.forEach((sub: AuxAntPositionSub) => {
      const fields = getNullableFields(sub)
      const result = Object.values(fields).every(value => value === null)
      expect(result).toBeTruthy()
    })

    errorTest.error = 3
    const { frame: frame3, data: data3 } = getNameFrameData({ antennas, subFramesLength, errorTest, ambiguityTest })
    const { body: body3 } = auxAntPositions(0, data3) as { name: string, body: AuxAntPositions }
    expect(body3).not.toStrictEqual(frame3)

    body3.auxAntPositionSub.forEach((sub: AuxAntPositionSub) => {
      const fields = getNullableFields(sub)
      const result = Object.values(fields).every(value => value === null)
      expect(result).toBeTruthy()
    })

    errorTest.error = 4
    errorTest.type = Error.UNKNOWN
    const { frame: frame4, data: data4 } = getNameFrameData({ antennas, subFramesLength, errorTest, ambiguityTest })
    const { body: body4 } = auxAntPositions(0, data4) as { name: string, body: AuxAntPositions }
    expect(body4).not.toStrictEqual(frame4)

    body4.auxAntPositionSub.forEach((sub: AuxAntPositionSub) => {
      const fields = getNullableFields(sub)
      const result = Object.values(fields).every(value => value === null)
      expect(result).toBeTruthy()
    })
  })

  test('Ambiguity field', () => {
    const antennas = 2
    const subFramesLength = 52
    const errorTest: ErrorTest = { error: 0, type: Error.NO }
    const ambiguityTest: AmbiguityTest = { ambiguity: 0, type: Ambiguity.FIXED }

    const { frame: frame1, data: data1 } = getNameFrameData({ antennas, subFramesLength, errorTest, ambiguityTest })
    const { body: body1 } = auxAntPositions(0, data1) as { name: string, body: AuxAntPositions }
    expect(body1).toStrictEqual(frame1)

    ambiguityTest.ambiguity = 1
    ambiguityTest.type = Ambiguity.FLOAT
    const { frame: frame2, data: data2 } = getNameFrameData({ antennas, subFramesLength, errorTest, ambiguityTest })
    const { body: body2 } = auxAntPositions(0, data2) as { name: string, body: AuxAntPositions }
    expect(body2).toStrictEqual(frame2)

    ambiguityTest.ambiguity = 2
    ambiguityTest.type = Ambiguity.UNKNOWN
    const { frame: frame3, data: data3 } = getNameFrameData({ antennas, subFramesLength, errorTest, ambiguityTest })
    const { body: body3 } = auxAntPositions(0, data3) as { name: string, body: AuxAntPositions }
    expect(body3).toStrictEqual(frame3)

  })
})