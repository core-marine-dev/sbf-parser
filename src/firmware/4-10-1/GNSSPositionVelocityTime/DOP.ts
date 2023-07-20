import { BYTES_LENGTH } from "../../../shared/constants"
import { SBFBodyData } from "../../../shared/types"
import { getPadding } from "../../../shared/utils"
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
const NRSV_INDEX = 0
const NRSV_LENGTH = BYTES_LENGTH.UINT8

const RESERVED_INDEX = NRSV_INDEX + NRSV_LENGTH
const RESERVED_LENGTH = BYTES_LENGTH.UINT8

const PDOP_INDEX = RESERVED_INDEX + RESERVED_LENGTH
const PDOP_LENGTH = BYTES_LENGTH.UINT16
const TDOP_INDEX = PDOP_INDEX + PDOP_LENGTH
const TDOP_LENGTH = BYTES_LENGTH.UINT16
const HDOP_INDEX = TDOP_INDEX + TDOP_LENGTH
const HDOP_LENGTH = BYTES_LENGTH.UINT16
const VDOP_INDEX = HDOP_INDEX + HDOP_LENGTH
const VDOP_LENGTH = BYTES_LENGTH.UINT16

const HPL_INDEX = VDOP_INDEX + VDOP_LENGTH
const HPL_LENGTH = BYTES_LENGTH.FLOAT
const VPL_INDEX = HPL_INDEX + HPL_LENGTH
const VPL_LENGTH = BYTES_LENGTH.FLOAT

const PADDING_INDEX = VPL_INDEX + VPL_LENGTH

const DO_NOT_USE = -2 * Math.pow(10, 10)
const getData = (data: number) => (data !== DO_NOT_USE) ? data : null

export type DOP = {
  nrSV: number,
  reserved: number,
  pDOP: number,
  tDOP: number,
  hDOP: number,
  vDOP: number,
  hpl: number | null,
  vpl: number | null,
  padding: number | null
}

interface Response extends SBFBodyData {
  body: DOP
}

export const dop = (blockRevision: number, data: Buffer): Response => {
  const name = 'DOP'
  const PADDING_LENGTH = data.subarray(PADDING_INDEX).length
  const body: DOP = {
    nrSV: data.readUIntLE(NRSV_INDEX, NRSV_LENGTH),
    reserved: data.readUIntLE(RESERVED_INDEX, RESERVED_LENGTH),
    pDOP: data.readUIntLE(PDOP_INDEX, PDOP_LENGTH) / 100,
    tDOP: data.readUIntLE(TDOP_INDEX, TDOP_LENGTH) / 100,
    hDOP: data.readUIntLE(HDOP_INDEX, HDOP_LENGTH) / 100,
    vDOP: data.readUIntLE(VDOP_INDEX, VDOP_LENGTH) / 100,
    hpl: getData(data.readFloatLE(HPL_INDEX)),
    vpl: getData(data.readFloatLE(VPL_INDEX)),
    padding: getPadding(data, PADDING_INDEX, PADDING_LENGTH),
  }
  return { name, body }
}