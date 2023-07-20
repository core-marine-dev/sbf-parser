import { AttCovEuler, Error, ErrorCode, attCovEuler } from "../../../../src/firmware/4-10-1/GNSSAttitude/AttCovEuler"
import { RandomNumberType, TypeData, TypedData, getTypedData, randomNumber } from "../../../utils"
/* AttCovEuler -> Number: 5939 => "OnChange" interval: default PVT output rate
This block contains the elements of the symmetric variance-covariance matrix 
of the attitude angles reported in the AttEuler block

This variance-covariance matrix contains an indication of the accuracy of the 
estimated parameters (see diagonal elements) and the correlation between 
these estimates (see off-diagonal elements).

In case the receiver is in heading and pitch mode only, only the heading and pitch
variance values will be valid. All other components of the variance-covariance matrix are set
to their Do-Not-Use value.

AttCovEuler -------------------------------------------------------------
Block fields           Type    Units  Do-Not-Use  Description
Reserved              uint8                       Reserved for future use, to be ignored by decoding software
Error                 uint8                       Bit ﬁeld providing error information. For each antenna baseline, two bits are used to provide error information:
                                                    Bits 0-1: Error code for Main-Aux1 baseline:
                                                      0: No error
                                                      1: Not enough measurements
                                                      2: Reserved
                                                      3: Reserved
                                                    Bits 2-3: Error code for Main-Aux2 baseline, same deﬁnition as bit 0-1.
                                                    Bits 4-6: Reserved
                                                    Bit 7: Set when GNSS-based attitude not requested by user. In that case, the other bits are all zero.
Cov_HeadHead        float32  degree^2  -2 * 10¹⁰  Variance of the heading estimate
Cov_PitchPitch      float32  degree^2  -2 * 10¹⁰  Variance of the pitch estimate
Cov_RollRoll        float32  degree^2  -2 * 10¹⁰  Variance of the roll estimate
Cov_HeadPitch       float32  degree^2  -2 * 10¹⁰  Covariance between Euler angle estimates.
                                                  Future functionality.
                                                  The values are currently set to their Do-Not-Use values.
Cov_HeadRoll        float32  degree^2  -2 * 10¹⁰  Covariance between Euler angle estimates.
                                                  Future functionality.
                                                  The values are currently set to their Do-Not-Use values.
Cov_PitchRoll       float32  degree^2  -2 * 10¹⁰  Covariance between Euler angle estimates.
                                                  Future functionality.
                                                  The values are currently set to their Do-Not-Use values.
Padding                uint                       Padding bytes
*/
const getNameFrameData = () => {
  const frameName = 'AttCovEuler'
  // Reserved
  const { number: reserved, buffer: reservedBuffer } = getTypedData(randomNumber(RandomNumberType.UINT), TypeData.UINT8) as TypedData
  // Error
  const { number: error, buffer: errorBuffer } = getTypedData(0b01110000, TypeData.UINT8) as TypedData
  // Cov_HeadHead
  const { number: covHeadHead, buffer: covHeadHeadBuffer } = getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT) as TypedData
  // Cov_PitchPitch
  const { number: covPitchPitch, buffer: covPitchPitchBuffer } = getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT) as TypedData
  // Cov_RollRoll
  const { number: covRollRoll, buffer: covRollRollBuffer } = getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT) as TypedData
  // Cov_HeadPitch
  const { number: covHeadPitch, buffer: covHeadPitchBuffer } = getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT) as TypedData
  // Cov_HeadRoll
  const { number: covHeadRoll, buffer: covHeadRollBuffer } = getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT) as TypedData
  // Cov_PitchRoll
  const { number: covPitchRoll, buffer: covPitchRollBuffer } = getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT) as TypedData
  // Padding
  const padding = null
  // Metadata
  const metadataError: Error = {
    mainAux1Baseline: ErrorCode.NO,
    mainAux2Baseline: ErrorCode.NO,
    reserved: 0b0111,
    notRequestedAttitude: false
  }

  const frame: AttCovEuler = {
    reserved, error, covHeadHead, covPitchPitch, covRollRoll, covHeadPitch, covHeadRoll, covPitchRoll,
    padding,
    metadata: {
      error: metadataError,
    }
  }
  const data: Buffer = Buffer.concat([
    reservedBuffer,
    errorBuffer,
    covHeadHeadBuffer,
    covPitchPitchBuffer,
    covRollRollBuffer,
    covHeadPitchBuffer,
    covHeadRollBuffer,
    covPitchRollBuffer,
  ])

  return { frameName, frame, data }
}

describe('Testing AttCovEuler', () => {

  test('Regular body', () => {
    const { frameName, frame, data } = getNameFrameData()
    const { name, body } = attCovEuler(0, data) as { name: string, body: AttCovEuler}
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
    let body = attCovEuler(0, data).body
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
    body = attCovEuler(0, data).body
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
    body = attCovEuler(0, data).body
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
    body = attCovEuler(0, data).body
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
    body = attCovEuler(0, data).body
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
    body = attCovEuler(0, data).body
    expect(body).toStrictEqual(frame)
  })
})