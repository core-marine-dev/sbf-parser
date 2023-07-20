import { BYTES_LENGTH } from "../../../shared/constants"
import { Padding, SBFBodyData } from "../../../shared/types"
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

// AuxAntPositions
const N_INDEX = 0
const N_LENGTH = BYTES_LENGTH.UINT8

const SBLENGTH_INDEX = N_INDEX + N_LENGTH
const SBLENGTH_LENGTH = BYTES_LENGTH.UINT8
// AuxAntPositionSub
const NRSV_INDEX = 0
const NRSV_LENGTH = BYTES_LENGTH.UINT8

const ERROR_INDEX = NRSV_INDEX + NRSV_LENGTH
const ERROR_LENGTH = BYTES_LENGTH.UINT8

const AMBIGUITY_TYPE_INDEX = ERROR_INDEX + ERROR_LENGTH
const AMBIGUITY_TYPE_LENGTH = BYTES_LENGTH.UINT8

const AUX_ANT_ID_INDEX = AMBIGUITY_TYPE_INDEX + AMBIGUITY_TYPE_LENGTH
const AUX_ANT_ID_LENGTH = BYTES_LENGTH.UINT8

const DELTA_EAST_INDEX = AUX_ANT_ID_INDEX + AUX_ANT_ID_LENGTH
const DELTA_EAST_LENGTH = BYTES_LENGTH.DOUBLE
const DELTA_NORTH_INDEX = DELTA_EAST_INDEX + DELTA_EAST_LENGTH
const DELTA_NORTH_LENGTH = BYTES_LENGTH.DOUBLE
const DELTA_UP_INDEX = DELTA_NORTH_INDEX + DELTA_NORTH_LENGTH
const DELTA_UP_LENGTH = BYTES_LENGTH.DOUBLE


const EAST_VEL_INDEX = DELTA_UP_INDEX + DELTA_UP_LENGTH
const EAST_VEL_LENGTH = BYTES_LENGTH.DOUBLE
const NORTH_VEL_INDEX = EAST_VEL_INDEX + EAST_VEL_LENGTH
const NORTH_VEL_LENGTH = BYTES_LENGTH.DOUBLE
const UP_VEL_INDEX = NORTH_VEL_INDEX + NORTH_VEL_LENGTH
const UP_VEL_LENGTH = BYTES_LENGTH.DOUBLE

const PADDING_SUB_INDEX = UP_VEL_INDEX + UP_VEL_LENGTH

export const enum Error {
  NO = 'NO_ERROR',
  MEASUREMENTS = 'NOT_ENOUGH_MEASUREMENTS',
  RESERVED = 'RESERVED',
  UNKNOWN = 'UNKNOWN',

}

export const enum Ambiguity {
  FIXED = 'FIXED',
  FLOAT = 'FLOAT',
  UNKNOWN = 'UNKNOWN'
}

export type AuxAntPositionSub = {
  nrSV: number | null,
  error: number,
  ambiguityType: number | null,
  auxAntID: number,
  deltaEast: number | null,
  deltaNorth: number | null,
  deltaUp: number | null,
  eastVel: number | null,
  northVel: number | null,
  upVel: number | null,
  padding: Padding,
  metadata: {
    error: Error,
    ambiguityType: Ambiguity
  }
}

export type AuxAntPositions = {
  n: number,
  sbLength: number,
  auxAntPositionSub: AuxAntPositionSub[],
  padding: number | null
}

const DO_NOT_USE_UINT = 255
const DO_NOT_USE_DOUBLE = -2.0 * Math.pow(10, 10)

const getUInt = (uint: number) => (uint !== DO_NOT_USE_UINT) ? uint : null
const getDouble = (double: number) => (double !== DO_NOT_USE_DOUBLE) ? double : null

const getError = (error: number): Error => {
  switch (error) {
    case 0:
      return Error.NO
    case 1:
      return Error.MEASUREMENTS
    case 2:
    case 3:
      return Error.RESERVED
  }
  return Error.UNKNOWN
}

const getAmbiguityType = (ambiguity: number): Ambiguity => {
  switch (ambiguity) {
    case 0:
      return Ambiguity.FIXED
    case 1:
      return Ambiguity.FLOAT
  }
  return Ambiguity.UNKNOWN
}

const getAuxAntPositionSub = (data: Buffer): AuxAntPositionSub => {
  const PADDING_SUB_LENGTH = data.subarray(PADDING_SUB_INDEX).length
  const body: AuxAntPositionSub = {
    nrSV: getUInt(data.readUIntLE(NRSV_INDEX, NRSV_LENGTH)),
    error: data.readUIntLE(ERROR_INDEX, ERROR_LENGTH),
    ambiguityType: getUInt(data.readUIntLE(AMBIGUITY_TYPE_INDEX, AMBIGUITY_TYPE_LENGTH)),
    auxAntID: data.readUIntLE(AUX_ANT_ID_INDEX, AUX_ANT_ID_LENGTH),
    deltaEast: getDouble(data.readDoubleLE(DELTA_EAST_INDEX)),
    deltaNorth: getDouble(data.readDoubleLE(DELTA_NORTH_INDEX)),
    deltaUp: getDouble(data.readDoubleLE(DELTA_UP_INDEX)),
    eastVel: getDouble(data.readDoubleLE(EAST_VEL_INDEX)),
    northVel: getDouble(data.readDoubleLE(NORTH_VEL_INDEX)),
    upVel: getDouble(data.readDoubleLE(UP_VEL_INDEX)),
    padding: (PADDING_SUB_LENGTH > 0) ? data.readUIntLE(PADDING_SUB_INDEX, PADDING_SUB_LENGTH): null,
    metadata: {}
  } as AuxAntPositionSub
  body.metadata = {
    error: getError(body.error),
    ambiguityType: getAmbiguityType(body.ambiguityType as number)
  }
  if (body.error !== 0) {
    body.deltaEast = null
    body.deltaNorth = null
    body.deltaUp = null
    body.eastVel = null
    body.northVel = null
    body.upVel = null
  }
  return body
}

const getSubBodies = (antennas: number, length: number, data: Buffer): AuxAntPositionSub[] => {
  let subBodies = [] as AuxAntPositionSub[]
  for (let index = 0; index < antennas; index++) {
    const start = (index * length)
    const end = start + length
    const buffer = data.subarray(start, end)
    const subBody = getAuxAntPositionSub(buffer)
    subBodies.push(subBody)
  }
  return subBodies
}


interface Response extends SBFBodyData {
  body: AuxAntPositions
}

export const auxAntPositions = (blockRevision: number, data: Buffer): Response => {
  const name = 'AuxAntPositions'
  // Check Antennas
  const antennas = data.readUIntLE(N_INDEX, N_LENGTH)
  if (antennas < 1) return { name, body: { n: antennas } } as Response
  // Sub bodies
  const sbLength = data.readUIntLE(SBLENGTH_INDEX, SBLENGTH_LENGTH)
  const subBodiesStart = 2
  const PADDING_INDEX = subBodiesStart + (antennas * sbLength)
  const subBodiesBuffer = data.subarray(subBodiesStart, PADDING_INDEX)
  const subBodies = getSubBodies(antennas, sbLength, subBodiesBuffer)
  // Padding
  const PADDING_LENGTH = data.subarray(PADDING_INDEX).length
  const padding = (PADDING_LENGTH > 0) ? data.readUIntLE(PADDING_INDEX, PADDING_LENGTH) : null
  // Body
  const body: AuxAntPositions = {
    n: antennas,
    sbLength,
    auxAntPositionSub: subBodies,
    padding
  }
  return { name, body }
}