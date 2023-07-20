import { BYTES_LENGTH } from "../../../shared/constants"
import { Padding, SBFBodyData } from "../../../shared/types"
import { bitState, getPadding } from "../../../shared/utils"
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
const RESERVED_INDEX = 0
const RESERVED_LENGTH = BYTES_LENGTH.UINT8

const ERROR_INDEX = RESERVED_INDEX + RESERVED_LENGTH
const ERROR_LENGTH = BYTES_LENGTH.UINT8

const COV_HEAD_HEAD_INDEX = ERROR_INDEX + ERROR_LENGTH
const COV_HEAD_HEAD_LENGTH = BYTES_LENGTH.FLOAT

const COV_PITCH_PITCH_INDEX = COV_HEAD_HEAD_INDEX + COV_HEAD_HEAD_LENGTH
const COV_PITCH_PITCH_LENGTH = BYTES_LENGTH.FLOAT

const COV_ROLL_ROLL_INDEX = COV_PITCH_PITCH_INDEX + COV_PITCH_PITCH_LENGTH
const COV_ROLL_ROLL_LENGTH = BYTES_LENGTH.FLOAT

const COV_HEAD_PITCH_INDEX = COV_ROLL_ROLL_INDEX + COV_ROLL_ROLL_LENGTH
const COV_HEAD_PITCH_LENGTH = BYTES_LENGTH.FLOAT

const COV_HEAD_ROLL_INDEX = COV_HEAD_PITCH_INDEX + COV_HEAD_PITCH_LENGTH
const COV_HEAD_ROLL_LENGTH = BYTES_LENGTH.FLOAT

const COV_PITCH_ROLL_INDEX = COV_HEAD_ROLL_INDEX + COV_HEAD_ROLL_LENGTH
const COV_PITCH_ROLL_LENGTH = BYTES_LENGTH.FLOAT

const PADDING_INDEX = COV_PITCH_ROLL_INDEX + COV_PITCH_ROLL_LENGTH

export const enum ErrorCode {
  NO = 'NO_ERROR',
  MEASUREMENTS = 'NOT_ENOUGH_MEASUREMENTS',
  RESERVED = 'RESERVED',
  UNKNOWN = 'UNKNOWN'
}

const getErrorCode = (error: number): ErrorCode => {
  switch (error) {
    case 0: return ErrorCode.NO
    case 1: return ErrorCode.MEASUREMENTS
    case 2: 
    case 3: return ErrorCode.RESERVED
  }
  return ErrorCode.UNKNOWN
}

export type Error = {
  mainAux1Baseline: ErrorCode,
  mainAux2Baseline: ErrorCode,
  reserved: number,
  notRequestedAttitude: boolean
}

const getError = (error: number): Error => {
  const main1 = (error & 0b00000011)
  const main2 = (error & 0b00001100) >>> 2
  const reserved = (error & 0b01110000) >>> 4
  const notRequestedAttitude = bitState(error, 7)
  return {
    mainAux1Baseline: getErrorCode(main1),
    mainAux2Baseline: getErrorCode(main2),
    reserved: reserved,
    notRequestedAttitude
  }
}

const DO_NOT_USE_DATA = -2 * Math.pow(10, 10)
const getData = (data: number) => (data !== DO_NOT_USE_DATA) ? data : null

export type AttCovEuler = {
  reserved: number,
  error: number,
  covHeadHead: number | null,
  covPitchPitch: number | null,
  covRollRoll: number | null,
  covHeadPitch: number | null,
  covHeadRoll: number | null,
  covPitchRoll: number | null,
  padding: Padding,
  metadata: {
    error: Error,
  }
}


interface Response extends SBFBodyData {
  body: AttCovEuler
}

export const attCovEuler = (blockRevision: number, data: Buffer): Response => {
  const name = 'AttCovEuler'
  const PADDING_LENGTH = data.subarray(PADDING_INDEX).length
  const body: AttCovEuler = {
    reserved: data.readUIntLE(RESERVED_INDEX, RESERVED_LENGTH),
    error: data.readUIntLE(ERROR_INDEX, ERROR_LENGTH),
    covHeadHead: getData(data.readFloatLE(COV_HEAD_HEAD_INDEX)),
    covPitchPitch: getData(data.readFloatLE(COV_PITCH_PITCH_INDEX)),
    covRollRoll: getData(data.readFloatLE(COV_ROLL_ROLL_INDEX)),
    covHeadPitch: getData(data.readFloatLE(COV_HEAD_PITCH_INDEX)),
    covHeadRoll: getData(data.readFloatLE(COV_HEAD_ROLL_INDEX)),
    covPitchRoll: getData(data.readFloatLE(COV_PITCH_ROLL_INDEX)),
    padding: getPadding(data, PADDING_INDEX, PADDING_LENGTH),
    metadata: {}
  } as AttCovEuler
  body.metadata.error = getError(body.error)
  return { name, body }
}