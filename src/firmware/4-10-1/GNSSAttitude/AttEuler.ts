import { BYTES_LENGTH } from "../../../shared/constants"
import { Padding, SBFBodyData } from "../../../shared/types"
import { bitState, getPadding } from "../../../shared/utils"
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
const NRSV_INDEX = 0
const NRSV_LENGTH = BYTES_LENGTH.UINT8

const ERROR_INDEX = NRSV_INDEX + NRSV_LENGTH
const ERROR_LENGTH = BYTES_LENGTH.UINT8

const MODE_INDEX = ERROR_INDEX + ERROR_LENGTH
const MODE_LENGTH = BYTES_LENGTH.UINT16

const RESERVED_INDEX = MODE_INDEX + MODE_LENGTH
const RESERVED_LENGTH = BYTES_LENGTH.UINT16

const HEADING_INDEX = RESERVED_INDEX + RESERVED_LENGTH
const HEADING_LENGTH = BYTES_LENGTH.FLOAT

const PITCH_INDEX = HEADING_INDEX + HEADING_LENGTH
const PITCH_LENGTH = BYTES_LENGTH.FLOAT

const ROLL_INDEX = PITCH_INDEX + PITCH_LENGTH
const ROLL_LENGTH = BYTES_LENGTH.FLOAT

const HEADING_DOT_INDEX = ROLL_INDEX + ROLL_LENGTH
const HEADING_DOT_LENGTH = BYTES_LENGTH.FLOAT

const PITCH_DOT_INDEX = HEADING_DOT_INDEX + HEADING_DOT_LENGTH
const PITCH_DOT_LENGTH = BYTES_LENGTH.FLOAT

const ROLL_DOT_INDEX = PITCH_DOT_INDEX + PITCH_DOT_LENGTH
const ROLL_DOT_LENGTH = BYTES_LENGTH.FLOAT

const PADDING_INDEX = ROLL_DOT_INDEX + ROLL_DOT_LENGTH

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

export const enum Mode {
  NO = 'NO_ATTITUDE',
  HEADING_PICH_FLOAT = 'HEADING_PICH_FLOAT',
  HEADING_PICH_FIXED = 'HEADING_PICH_FIXED',
  HEADING_PICH_ROLL_FLOAT = 'HEADING_PICH_ROLL_FLOAT',
  HEADING_PICH_ROLL_FIXED = 'HEADING_PICH_ROLL_FIXED',
  UNKNOWN = 'UNKNOWN'
}

const getMode = (mode: number): Mode => {
  switch (mode) {
    case 0: return Mode.NO
    case 1: return Mode.HEADING_PICH_FLOAT
    case 2: return Mode.HEADING_PICH_FIXED
    case 3: return Mode.HEADING_PICH_ROLL_FLOAT
    case 4: return Mode.HEADING_PICH_ROLL_FIXED
  }
  return Mode.UNKNOWN
}

const DO_NOT_USE_SATELLITES = 255
const getSatellites = (satellites: number) => (satellites !== DO_NOT_USE_SATELLITES) ? satellites : null

const DO_NOT_USE_DATA = -2 * Math.pow(10, 10)
const getData = (data: number) => (data !== DO_NOT_USE_DATA) ? data : null

export type AttEulerMetadata = {
  error: Error,
  mode: Mode
}

export type AttEuler = {
  nrSV: number | null,
  error: number,
  mode: number,
  reserved: number,
  roll: number | null,
  pitch: number | null,
  heading: number | null,
  pitchDot: number | null,
  rollDot: number | null,
  headingDot: number | null,
  padding: Padding,
  metadata: AttEulerMetadata
}

interface Response extends SBFBodyData {
  body: AttEuler
}

export const attEuler = (blockRevision: number, data: Buffer): Response => {
  const name = 'AttEuler'
  const PADDING_LENGTH = data.subarray(PADDING_INDEX).length
  const body: AttEuler = {
    nrSV: getSatellites(data.readUIntLE(NRSV_INDEX, NRSV_LENGTH)),
    error: data.readUIntLE(ERROR_INDEX, ERROR_LENGTH),
    mode: data.readUIntLE(MODE_INDEX, MODE_LENGTH),
    reserved: data.readUIntLE(RESERVED_INDEX, RESERVED_LENGTH),
    heading: getData(data.readFloatLE(HEADING_INDEX)),
    pitch: getData(data.readFloatLE(PITCH_INDEX)),
    roll: getData(data.readFloatLE(ROLL_INDEX)),
    pitchDot: getData(data.readFloatLE(PITCH_DOT_INDEX)),
    rollDot: getData(data.readFloatLE(ROLL_DOT_INDEX)),
    headingDot: getData(data.readFloatLE(HEADING_DOT_INDEX)),
    padding: getPadding(data, PADDING_INDEX, PADDING_LENGTH),
    metadata: {}
  } as AttEuler
  body.metadata.error = getError(body.error)
  body.metadata.mode = getMode(body.mode)
  return { name, body }
}