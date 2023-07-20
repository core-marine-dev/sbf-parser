import { DOP, dop } from '../../../../src/firmware/4-10-1/GNSSPositionVelocityTime/DOP'
import { RandomNumberType, TypeData, TypedData, getTypedData, randomNumber } from '../../../utils'
/* DOP -> Number: 4001 => "OnChange" interval: default PVT output rate
  This block contains both Dilution of Precision (DOP) values and SBAS 
  protection levels. The DOP values result from a trace of the unit position 
  variance-covariance matrices:

    Position Dilution of Precision:   PDOP = sqrt(Qxx + Qyy + Qzz)
    Time Dilution of Precision:       TDOP = sqrt(Qbb)
    Horizontal Dilution of Precision: HDOP = sqrt(Qλλ + Qϕϕ)
    Vertical Dilution of Precision:   VDOP = sqrt(Qhh)

  In these equations, the matrix Q is the inverse of the unweighted normal 
  matrix used for the computation of the position. The normal matrix equals the 
  product of the geometry matrix A with its transpose (At A). The term 
  "unweighted" implies that the DOP factor only addresses the effect of the 
  geometric factors on the quality of the position.

  The DOP values can be used to interpret the current constellation geometry. 
  This is an important parameter for the quality of the position ﬁx: the DOP 
  parameter is the propagation factor of the pseudorange variance. For example, 
  if an error of 5 m is present in the pseudorange, it will propagate into the 
  horizontal plane with a factor expressed by the HDOP. Hence a low DOP value 
  indicates that the satellites used for the position ﬁx result in a low 
  multiplication of the systematic ranging errors. A value of six (6) for the 
  PDOP is generally considered as the maximum value allowed for an acceptable 
  position computation.

  The horizontal and vertical protection levels (HPL and VPL) indicate the 
  integrity of the computed horizontal and vertical position components as per 
  the DO 229 speciﬁcation. In SBAS-aided PVT mode (see the Mode ﬁeld of the 
  PVTCartesian SBF block), HPL and VPL are based upon the error estimates 
  provided by SBAS. Otherwise they are based upon internal position-mode 
  dependent error estimates.

  EndOfAtt -------------------------------------------------------------
  Block fields     Type  Units Do-Not-Use  Description
  NrSV            uint8                 0  Total number of satellites used in the DOP computation, 
                                           or 0 if the DOP information is not available 
                                           (in that case, the xDOP ﬁelds are all set to 0)
  Reserved        uint8                    Reserved for future use, to be ignored by decoding software
  PDOP           uint16   0.01          0  If 0, PDOP not available, otherwise divide by 100 to obtain PDOP.
  TDOP           uint16   0.01          0  If 0, TDOP not available, otherwise divide by 100 to obtain TDOP.
  HDOP           uint16   0.01          0  If 0, HDOP not available, otherwise divide by 100 to obtain HDOP.
  VDOP           uint16   0.01          0  If 0, VDOP not available, otherwise divide by 100 to obtain VDOP.
  HPL           float32    1 m  −2 * 10¹⁰  Horizontal Protection Level (see the DO 229 standard).
  VPL           float32    1 m  −2 * 10¹⁰  Vertical   Protection Level (see the DO 229 standard).
  Padding          uint                    Padding bytes
*/
type Input = {
  hpl: number,
  vpl: number
}

const defaultInput: Input = {
  hpl: getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT)?.number as number,
  vpl: getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT)?.number as number,
}

const getNameFrameData = (input: Input = defaultInput) => {
  const frameName = 'DOP'
  // NrSV
  const { number: nrSV, buffer: nrSVBuffer } = getTypedData(randomNumber(RandomNumberType.UINT), TypeData.UINT8) as TypedData
  // Reserved
  const { number: reserved, buffer: reservedBuffer } = getTypedData(randomNumber(RandomNumberType.UINT), TypeData.UINT8) as TypedData
  // PDOP
  const { number: pDOP, buffer: pDOPBuffer } = getTypedData(randomNumber(RandomNumberType.UINT), TypeData.UINT16) as TypedData
  // TDOP
  const { number: tDOP, buffer: tDOPBuffer } = getTypedData(randomNumber(RandomNumberType.UINT), TypeData.UINT16) as TypedData
  // HDOP
  const { number: hDOP, buffer: hDOPBuffer } = getTypedData(randomNumber(RandomNumberType.UINT), TypeData.UINT16) as TypedData
  // VDOP
  const { number: vDOP, buffer: vDOPBuffer } = getTypedData(randomNumber(RandomNumberType.UINT), TypeData.UINT16) as TypedData
  // HPL
  const { number: hpl, buffer: hplBuffer } = getTypedData(input.hpl, TypeData.FLOAT) as TypedData
  // VPL
  const { number: vpl, buffer: vplBuffer } = getTypedData(input.vpl, TypeData.FLOAT) as TypedData
  // Padding
  const padding = null
  const paddingBuffer = Buffer.from([])

  const frame: DOP = {
    nrSV, reserved,
    pDOP: pDOP / 100,
    tDOP: tDOP / 100,
    hDOP: hDOP / 100,
    vDOP: vDOP / 100,
    hpl, vpl,
    padding
  }

  const data = Buffer.concat([
    nrSVBuffer, reservedBuffer,
    pDOPBuffer, tDOPBuffer, hDOPBuffer, vDOPBuffer,
    hplBuffer, vplBuffer,
    paddingBuffer
  ])

  return { frameName, frame, data }
}

describe('Testing DOP', () => {
  test('Regular body', () => {
    const { frameName, frame, data } = getNameFrameData()
    const { name, body } = dop(0, data)
    expect(name).toBe(frameName)
    expect(body).toStrictEqual(frame)
  })
  test('HPL and VPL', () => {
    const input: Input = defaultInput
    // HPL null
    input.hpl = -2 * Math.pow(10, 10)
    const { data: data1 } = getNameFrameData(input)
    const { body: body1 } = dop(0, data1)
    expect(body1.hpl).toBeNull()
    // VPL null
    input.vpl = -2 * Math.pow(10, 10)
    const { data: data2 } = getNameFrameData(input)
    const { body: body2 } = dop(0, data2)
    expect(body2.hpl).toBeNull()
  })
})