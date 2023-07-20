import { BYTES_LENGTH } from "../../../shared/constants"
import { Padding, SBFBodyData } from "../../../shared/types"
import { bitState, getNullableValue, getPadding } from "../../../shared/utils"
import { GNSSSignal } from "../types"
import { getGNSSSignal } from "../utils"
/* PVTGeodetic -> Number: 4007 => "OnChange" interval: default PVT output rate
  This block contains the GNSS-based position, velocity and time (PVT) solution 
  at the timespeciﬁed in the TOW and WNc ﬁelds. The time of applicability is 
  speciﬁed in the receiver time frame.

  The computed position (ϕ,λ,h) and velocity (vn , ve , vu ) are reported in an 
  ellipsoidal coordinate system using the datum indicated in the Datum ﬁeld. 
  The velocity vector is expressed relative to the local-level Cartesian coordinate 
  frame with north-, east-, up-unit vectors. The position is that of the marker. 
  The ARP-to-marker offset is set through the command setAntennaOffset.

  The PVT solution is also available in Cartesian form in the PVTCartesian block.

  The variance-covariance information associated with the reported PVT solution 
  can be found in the PosCovGeodetic and VelCovGeodetic blocks.

  If no PVT solution is available, the Error ﬁeld indicates the cause of the 
  unavailability and all ﬁelds after the Error ﬁeld are set to their 
  respective Do-Not-Use values.

  EndOfAtt -------------------------------------------------------------
  Block fields     Type  Units Do-Not-Use  Description
  Mode            uint8                    Bit ﬁeld indicating the GNSS PVT mode, as follows:
                                            Bits 0-3: type of PVT solution:
                                              0: No GNSS PVT available (the Error ﬁeld indicates the cause of the 
                                                 absence of the PVT solution)
                                              1: Stand-Alone PVT
                                              2: Differential PVT
                                              3: Fixed location
                                              4: RTK with ﬁxed ambiguities
                                              5: RTK with ﬂoat ambiguities
                                              6: SBAS aided PVT
                                              7: moving-base RTK with ﬁxed ambiguities
                                              8: moving-base RTK with ﬂoat ambiguities
                                             10: Precise Point Positioning (PPP)
                                             12: Reserved
                                            Bits 4-5: Reserved
                                            Bit    6: Set if the user has entered the command setPVTMode, Static, auto 
                                                      and the receiver is still in the process of determining its ﬁxed position.
                                            Bit 7:    2D/3D ﬂag: set in 2D mode (height assumed constant and not computed).
  Error           uint8                    PVT error code. The following values are deﬁned:
                                             0: No Error
                                             1: Not enough measurements
                                             2: Not enough ephemerides available
                                             3: DOP too large (larger than 15)
                                             4: Sum of squared residuals too large
                                             5: No convergence
                                             6: Not enough measurements after outlier rejection
                                             7: Position output prohibited due to export laws
                                             8: Not enough differential corrections available
                                             9: Base station coordinates unavailable
                                            10: Ambiguities not ﬁxed and user requested to only output RTK-ﬁxed positions
  Latitude      float64  1 rad  −2  * 10¹⁰  Latitude, from −π/2 to +π/2, positive North of Equator
  Longitude     float64  1 rad  −2 * 10¹⁰  Longitude, from −π to +π , positive East of Greenwich
  Height        float64    1 m  −2 * 10¹⁰  Ellipsoidal height (with respect to the ellipsoid speciﬁed by Datum)
  Undulation    float32    1 m  −2 * 10¹⁰  Geoid undulation. See the setGeoidUndulation command.
  Vn            float32    1 m  −2 * 10¹⁰  Velocity in the North direction
  Ve            float32    1 m  −2 * 10¹⁰  Velocity in the East direction
  Vu            float32    1 m  −2 * 10¹⁰  Velocity in the ’Up’ direction
  COG           float32  1 deg  −2 * 10¹⁰  Course over ground: this is deﬁned as the angle of the vehicle with respect 
                                           to the local level North, ranging from 0 to 360, and increasing towards east. 
                                           Set to the Do-Not-Use value when the speed is lower than 0.1m/s.
  RxClkBias     float64   1 ms  −2 * 10¹⁰  Receiver clock bias relative to the GNSS system time reported in the 
                                           TimeSystem ﬁeld. Positive when the receiver time is ahead of the system time. 
                                           To transfer the receiver time to the system time, use: tGPS/GST = trx - RxClkBias
  RxClkDrift    float32  1 ppm  −2 * 10¹⁰  Receiver clock drift relative to the GNSS system time (relative frequency error). 
                                           Positive when the receiver clock runs faster than the system time.
  TimeSystem      uint8               255  Time system of which the offset is provided in this sub-block:
                                             0: GPS time
                                             1: Galileo time
                                             3: GLONASS time
                                             4: BeiDou time
                                             5: QZSS time
  Datum           uint8               255  This ﬁeld deﬁnes in which datum the coordinates are expressed:
                                               0: WGS84/ITRS
                                              19: Datum equal to that used by the DGNSS/RTK base station
                                              30: ETRS89 (ETRF2000 realization)
                                              31: NAD83(2011), North American Datum (2011)
                                              32: NAD83(PA11), North American Datum, Paciﬁc plate (2011)
                                              33: NAD83(MA11), North American Datum, Marianas plate (2011)
                                              34: GDA94(2010), Geocentric Datum of Australia (2010)
                                              35: GDA2020, Geocentric Datum of Australia 2020
                                             250: First user-deﬁned datum
                                             251: Second user-deﬁned datum
  NrSV            uint8               255  Total number of satellites used in the PVT computation.
  WACorrInfo      uint8                 0  Bit ﬁeld providing information about which wide area corrections have been applied:
                                             Bit 0:    set if orbit and satellite clock correction information is used
                                             Bit 1:    set if range correction information is used
                                             Bit 2:    set if ionospheric information is used
                                             Bit 3:    set if orbit accuracy information is used (UERE/SISA)
                                             Bit 4:    set if DO229 Precision Approach mode is active
                                             Bits 5-7: Reserved
  ReferenceID    uint16             65535  This ﬁeld indicates the reference ID of the differential information used.
                                           In case of DGPS or RTK operation, this ﬁeld is to be interpreted as the 
                                           base station identiﬁer. In SBAS operation, this ﬁeld is to be interpreted 
                                           as the PRN of the geostationary satellite used (from 120 to 158). If multiple 
                                           base stations or multiple geostationary satellites are used the value is set to 65534.
  MeanCorrAge    uint16  0.01 seg   65535  In case of DGPS or RTK, this ﬁeld is the mean age of the differential corrections. 
                                           In case of SBAS operation, this ﬁeld is the mean age of the ’fast corrections’ 
                                           provided by the SBAS satellites.
  SignalInfo     uint32                 0  Bit ﬁeld indicating the type of GNSS signals having been used in the PVT
                                           computations. If a bit i is set, the signal type having index i has been
                                           used. The signal numbers are listed below. Bit 0 (GPS-C/A) is the LSB of SignalInfo.

                                           Signal Number | Signal Type | Constellation | Carrier frequency (MHz)   | RINEX V3.04 obs code
                                            0            | L1CA        | GPS           | 1575.42                   | 1C
                                            1            | L1P         | GPS           | 1575.42                   | 1W
                                            2            | L2P         | GPS           | 1227.60                   | 2W
                                            3            | L2C         | GPS           | 1227.60                   | 2L
                                            4            | L5          | GPS           | 1176.45                   | 5Q
                                            5            | L1C         | GPS           | 1575.42                   | 1L
                                            6            | L1CA        | QZSS          | 1575.42                   | 1C
                                            7            | L2C         | QZSS          | 1227.60                   | 2L
                                            8            | L1CA        | GLONASS       | 1602.00+(FreqNr-8)*9/16,  | 1C
                                                         |             |               | with FreqNr as deﬁned in |
                                                         |             |               | table below               |
                                            9            | L1P         | GLONASS       | 1602.00+(FreqNr-8)*9/16   | 1P
                                           10            | L2P         | GLONASS       | 1246.00+(FreqNr-8)*7/16   | 2P
                                           11            | L2CA        | GLONASS       | 1246.00+(FreqNr-8)*7/16   | 2C
                                           12            | L3          | GLONASS       | 1202.025                  | 3Q
                                           13            | B1C         | BeiDou        | 1575.42                   | 1P
                                           14            | B2a         | BeiDou        | 1176.45                   | 5P
                                           15            | L5          | NavIC/IRNSS   | 1176.45                   | 5A
                                           16            | Reserved    |               |                           |
                                           17            | E1 (L1BC)   | Galileo       | 1575.42                   | 1C
                                           18            | Reserved    |               |                           |
                                           19            | E6 (E6BC)   | Galileo       | 1278.75                   | 6C
                                           20            | E5a         | Galileo       | 1176.45                   | 5Q
                                           21            | E5b         | Galileo       | 1207.14                   | 7Q
                                           22            | E5 AltBoc   | Galileo       | 1191.795                  | 8Q
                                           23            | LBand       | MSS           | L-band beam speciﬁc      | NA
                                           24            | L1CA        | SBAS          | 1575.42                   | 1C
                                           25            | L5          | SBAS          | 1176.45                   | 5I
                                           26            | L5          | QZSS          | 1176.45                   | 5Q
                                           27            | L6          | QZSS          | 1278.75                   |
                                           28            | B1I         | BeiDou        | 1561.098                  | 2I
                                           29            | B2I         | BeiDou        | 1207.14                   | 7I
                                           30            | B3I         | BeiDou        | 1268.52                   | 6I
                                           31            | Reserved    |               |                           |
                                           32            | L1C         | QZSS          | 1575.42                   | 1L
                                           33            | L1S         | QZSS          | 1575.42                   | 1Z
                                           34            | B2b         | BeiDou        | 1207.14                   | 7D
                                           35            | Reserved    |               |                           |

                                           Field       | Type  | Do-Not-Use | RINEX satellitle code | Description 
                                           SVID or PRN | uint8 |          0 |                       | Satellite ID: The following ranges are deﬁned:
                                                                            | Gnn (nn = SVID)       | 1-37: PRN number of a GPS satellite
                                                                            | Rnn (nn = SVID-37)    | 38-61: Slot number of a GLONASS satellite with an offset of 37 (R01 to R24)
                                                                            |                       | 62: GLONASS satellite of which the slot number NA is not known
                                                                            | Rnn (nn = SVID-38)    | 63-68: Slot number of a GLONASS satellite with an offset of 38 (R25 to R30) 
                                                                            | Enn (nn = SVID-70)    | 71-106: PRN number of a GALILEO satellite with an offset of 70
                                                                            |                       | 107-119: L-Band (MSS) satellite. Corresponding NA satellite name can be found in the LBandBeams block.
                                                                            | Snn (nn = SVID-100)   | 120-140: PRN number of an SBAS satellite (S120 to S140)
                                                                            | Cnn (nn = SVID-140)   | 141-180: PRN number of a BeiDou satellite with an offset of 140
                                                                            | Jnn (nn = SVID-180)   | 181-187: PRN number of a QZSS satellite with an offset of 180
                                                                            | Inn (nn = SVID-190)   | 191-197: PRN number of a NavIC/IRNSS satellite with an offset of 190 (I01 to I07)
                                                                            | Snn (nn = SVID-157)   | 198-215: PRN number of an SBAS satellite with an offset of 57 (S141 to S158)
                                                                            | Inn (nn = SVID-208)   | 216-222: PRN number of a NavIC/IRNSS satellite with an offset of 208 (I08 to I14)
                                                                            | Cnn (nn = SVID-182)   | 223-245: PRN number of a BeiDou satellite with an offset of 182 (C41 to C63)
                                            FreqNr     | uint8 |          0 |                       | GLONASS frequency number, with an offset of 8. It ranges from 1 (corresponding to an actual frequency number of -7) 
                                                                                                    | to 21 (corresponding to an actual frequency number of 13).
                                                                                                    | 
                                                                                                    | For non-GLONASS satellites, FreqNr is reserved and must be ignored by the decoding software.
  AlertFlag       uint8                 0  Bit ﬁeld indicating integrity related information:
                                             Bits 0-1: RAIM integrity ﬂag:
                                               0: RAIM not active (integrity not monitored)
                                               1: RAIM integrity test successful
                                               2: RAIM integrity test failed
                                               3: Reserved
                                             Bit 2:    set if integrity has failed as per Galileo HPCA (HMI Probability Computation Algorithm)
                                             Bit 3:    set if Galileo ionospheric storm ﬂag is active
                                             Bit 4:    Reserved
                                             Bits 5-7: Reserved

Rev 1 NrBases     uint8                 0  Number of base stations used in the PVT computation.
Rev 1 PPPInfo    uint16  1 sec          0  Bit ﬁeld containing PPP-related information:
                                             Bits 0-11:  Age of the last seed, in seconds. The age is clipped to 4091s. This ﬁeld must be ignored when the seed type is 0 (see bits 13-15 below).
                                             Bit 12:     Reserved
                                             Bits 13-15: Type of last seed:
                                                           0: Not seeded or not in PPP positioning mode
                                                           1: Manual seed
                                                           2: Seeded from DGPS
                                                           3: Seeded from RTKFixed


Rev 2 Latency    uint16  0.0001 s   65535  Time elapsed between the time of applicability of the position ﬁx and the generation of this SBF block by the receiver. This time includes the receiver processing time, but not the communication latency.
Rev 2 HAccuracy  uint16    0.01 m   65535  2DRMS horizontal accuracy: twice the root-mean-square of the horizontal distance error. The horizontal distance between the true position and the computed position is expected to be lower than HAccuracy with a probability of at least 95%. The value is clipped to 65534=655.34m
Rev 2 VAccuracy  uint16    0.01 m   65535  2-sigma vertical accuracy. The vertical distance between the true position and the computed position is expected to be lower than VAccuracy with a probability of at least 95%. The value is clipped to 65534 = 655.34m.
Rev 2 Misc        uint8                    Bit ﬁeld containing miscellaneous ﬂags:
                                             Bit 0:    In DGNSS or RTK mode, set if the baseline points to the base station ARP. Unset if it points to the antenna phase center, or if unknown.
                                             Bit 1:    Set if the phase center offset is compensated for at the rover, unset if not or unknown.
                                             Bit 2:    Proprietary.
                                             Bit 3:    Proprietary.
                                             Bits 4-5: Proprietary.
                                             Bits 6-7: Flag indicating whether the marker position reported in this block is also the ARP position (i.e. whether the ARP-to-marker offset provided with the setAntennaOffset command is zero or not)
                                                         0: Unknown
                                                         1: The ARP-to-marker offset is zero
                                                         2: The ARP-to-marker offset is not zero

  Padding          uint                    Padding bytes
*/
const MODE_INDEX = 0
const MODE_LENGTH = BYTES_LENGTH.UINT8

const ERROR_INDEX = MODE_INDEX + MODE_LENGTH
const ERROR_LENGTH = BYTES_LENGTH.UINT8

const LATITUDE_INDEX = ERROR_INDEX + ERROR_LENGTH
const LATITUDE_LENGTH = BYTES_LENGTH.DOUBLE
const LONGITUDE_INDEX = LATITUDE_INDEX + LATITUDE_LENGTH
const LONGITUDE_LENGTH = BYTES_LENGTH.DOUBLE
const HEIGHT_INDEX = LONGITUDE_INDEX + LONGITUDE_LENGTH
const HEIGHT_LENGTH = BYTES_LENGTH.DOUBLE

const UNDULATION_INDEX = HEIGHT_INDEX + HEIGHT_LENGTH
const UNDULATION_LENGTH = BYTES_LENGTH.FLOAT

const VN_INDEX = UNDULATION_INDEX + UNDULATION_LENGTH
const VN_LENGTH = BYTES_LENGTH.FLOAT
const VE_INDEX = VN_INDEX + VN_LENGTH
const VE_LENGTH = BYTES_LENGTH.FLOAT
const VU_INDEX = VE_INDEX + VE_LENGTH
const VU_LENGTH = BYTES_LENGTH.FLOAT

const COG_INDEX = VU_INDEX + VU_LENGTH
const COG_LENGTH = BYTES_LENGTH.FLOAT

const RXCLKBIAS_INDEX = COG_INDEX + COG_LENGTH
const RXCLKBIAS_LENGTH = BYTES_LENGTH.DOUBLE
const RXCLKDRIFT_INDEX = RXCLKBIAS_INDEX + RXCLKBIAS_LENGTH
const RXCLKDRIFT_LENGTH = BYTES_LENGTH.FLOAT

const TIMESYSTEM_INDEX = RXCLKDRIFT_INDEX + RXCLKDRIFT_LENGTH
const TIMESYSTEM_LENGTH = BYTES_LENGTH.UINT8
const DATUM_INDEX = TIMESYSTEM_INDEX + TIMESYSTEM_LENGTH
const DATUM_LENGTH = BYTES_LENGTH.UINT8
const NRSV_INDEX = DATUM_INDEX + DATUM_LENGTH
const NRSV_LENGTH = BYTES_LENGTH.UINT8
const WACORRINFO_INDEX = NRSV_INDEX + NRSV_LENGTH
const WACORRINFO_LENGTH = BYTES_LENGTH.UINT8

const REFERENCEID_INDEX = WACORRINFO_INDEX + WACORRINFO_LENGTH
const REFERENCEID_LENGTH = BYTES_LENGTH.UINT16
const MEANCORRAGE_INDEX = REFERENCEID_INDEX + REFERENCEID_LENGTH
const MEANCORRAGE_LENGTH = BYTES_LENGTH.UINT16


const SIGNALINFO_INDEX = MEANCORRAGE_INDEX + MEANCORRAGE_LENGTH
const SIGNALINFO_LENGTH = BYTES_LENGTH.UINT32

const ALERTFLAG_INDEX = SIGNALINFO_INDEX + SIGNALINFO_LENGTH
const ALERTFLAG_LENGTH = BYTES_LENGTH.UINT8

const REV0_PADDING_INDEX = ALERTFLAG_INDEX + ALERTFLAG_LENGTH
// REV 1
const REV1_NRBASES_INDEX = ALERTFLAG_INDEX + ALERTFLAG_LENGTH
const REV1_NRBASES_LENGTH = BYTES_LENGTH.UINT8
const REV1_PPPINFO_INDEX = REV1_NRBASES_INDEX + REV1_NRBASES_LENGTH
const REV1_PPPINFO_LENGTH = BYTES_LENGTH.UINT16
const REV1_PADDING_INDEX = REV1_PPPINFO_INDEX + REV1_PPPINFO_LENGTH
// REV 2
const REV2_LATENCY_INDEX = REV1_PPPINFO_INDEX + REV1_PPPINFO_LENGTH
const REV2_LATENCY_LENGTH = BYTES_LENGTH.UINT16
const REV2_HACCURACY_INDEX = REV2_LATENCY_INDEX + REV2_LATENCY_LENGTH
const REV2_HACCURACY_LENGTH = BYTES_LENGTH.UINT16
const REV2_VACCURACY_INDEX = REV2_HACCURACY_INDEX + REV2_HACCURACY_LENGTH
const REV2_VACCURACY_LENGTH = BYTES_LENGTH.UINT16
const REV2_MISC_INDEX = REV2_VACCURACY_INDEX + REV2_VACCURACY_LENGTH
const REV2_MISC_LENGTH = BYTES_LENGTH.UINT8
const REV2_PADDING_INDEX = REV2_MISC_INDEX + REV2_MISC_LENGTH
// Do-Not-Use -----------------------------------------------------------------
export const DO_NOT_USE_UINT8 = 255
export const DO_NOT_USE_UINT16 = 65535
export const DO_NOT_USE_UINT32 = 0
export const DO_NOT_USE_FLOAT = -2 * Math.pow(10, 10)
type Length = 'UINT8' | 'UINT16' | 'UINT32' | 'FLOAT'
const getData = (data: number, length: Length): number | null => {
  if (length === 'UINT8') return (data !== DO_NOT_USE_UINT8) ? data : null
  if (length === 'UINT16') return (data !== DO_NOT_USE_UINT16) ? data : null
  if (length === 'UINT32') return (data !== DO_NOT_USE_UINT32) ? data : null
  return (data !== DO_NOT_USE_FLOAT) ? data : null
}
// PVTGeodetic Revision 0 -----------------------------------------------------
export const PVTSolution: Record<number, string> = {
  0: 'NO_PVT',
  1: 'STANDALONE',
  2: 'DIFFERENTIAL',
  3: 'FIXED',
  4: 'RTK_FIXED',
  5: 'RTK_FLOAT',
  6: 'SBAS',
  7: 'MOVING_RTK_FIXED',
  8: 'MOVING_RTK_FLOAT',
  10: 'PPP',
  12: 'RESERVED',
}
const getPVTSolution = (num: number): string => PVTSolution[num] || 'UNKNOWN'

export type Mode = {
  pvtSolution: string
  reserved45: number,
  determiningPosition: boolean,
  flag2D3D: boolean,
}

const getMode = (mode: number): Mode => ({
  pvtSolution: getPVTSolution(mode & 0b0000_1111),
  reserved45: (mode & 0b0011_0000) >>> 4,
  determiningPosition: bitState(mode, 6),
  flag2D3D: bitState(mode, 7)
})

export const ErrorPVT: Record<number, string> = {
  0: 'NO_ERROR',
  1: 'NOT_ENOUGH_MEASUREMENTS',
  2: 'NOT_ENOUGH_EPHEMERIDES',
  3: 'DOP_TOO_LARGE',
  4: 'SUM_SQUARED_RESIDUALS_TOO_LARGE',
  5: 'NO_CONVERGENCE',
  6: 'NOT_ENOUGH_MEASUREMENTS_AFTER_OUTLIER_REJECTION',
  7: 'POSITION_OUTPUT_PROHIBITED_DUE_TO_EXPORT_LAWS',
  8: 'NOT_ENOUGH_DIFFERENTIAL_CORRECTIONS',
  9: 'BASESTATION_COORDINATES_UNAVAILABLE',
  10: 'AMBIGUITIES_NOT_FIXED_AND_USER_REQUESTED_RTK_FIXED',
}
const getErrorPVT = (num: number): string => ErrorPVT[num] || 'UNKNOWN'

export const TimeSystem: Record<number, string> = {
  0: 'GPS',
  1: 'Galileo',
  3: 'GLONASS',
  4: 'BeiDou',
  5: 'QZSS',
}
const getTimesystem = (num: number): string => TimeSystem[num] || 'UNKNOWN'

export const Datum: Record<number, string> = {
  0: 'WGS84/ITRS',
  19: 'DGNSS/RTK base station',
  30: 'ETRS89',
  31: 'NAD83(2011)',
  32: 'NAD83(PA11)',
  33: 'NAD83(MA11)',
  34: 'GDA94(2010)',
  35: 'GDA2020',
  250: 'First user-deﬁned datum',
  251: 'Second user-deﬁned datum',
}
const getDatum = (num: number): string => Datum[num] || 'UNKNOWN'

export type WACorrInfo = {
  clockCorrection: boolean,
  rangeCorrection: boolean,
  ionosphericInformation: boolean,
  orbitAccuracy: boolean,
  DO229: boolean,
  reserved: number,
}
const getWACorrInfo = (num: number): WACorrInfo => ({
  clockCorrection: bitState(num, 0),
  rangeCorrection: bitState(num, 1),
  ionosphericInformation: bitState(num, 2),
  orbitAccuracy: bitState(num, 3),
  DO229: bitState(num, 4),
  reserved: (num & 0b1110_0000) >>> 5
})

export type SignalInfo = Record<number, GNSSSignal>

const getSignalInfo = (signalInfo: number): SignalInfo => {
  const response: Record<number, GNSSSignal> = {}
  for (let bit = 0; bit < 32; bit++){
    if (bitState(signalInfo, bit)) {
      const signal = getGNSSSignal(bit)
      if (signal !== null) {
        response[bit] = signal
      }
    }
  }
  return response
}

export const RAIMIntegrityFlag: Record<number, string> = {
  0: 'RAIM_NOT_ACTIVE',
  1: 'RAIM_SUCCESSFULL',
  2: 'RAIM_FAILED',
  3: 'RESERVED',
}
const getRAIMIntegrityFlag = (num: number): string => RAIMIntegrityFlag[num] || 'UNKNOWN'

export type AlertFlag = {
  raimIntegrityFlag: string,
  galileoIntegrityFailed: boolean,
  galileoIonosphericStorm: boolean,
  reserved4: boolean,
  reserved57: number,
}
const getAlertFlag = (num: number): AlertFlag => ({
  raimIntegrityFlag: getRAIMIntegrityFlag(num & 0b0000_0011),
  galileoIntegrityFailed: bitState(num, 2),
  galileoIonosphericStorm: bitState(num, 3),
  reserved4: bitState(num, 4),
  reserved57: (num & 0b1110_0000) >>> 5
})

export interface MetadataRev0 {
  mode: Mode,
  error: string,
  timesytem: string | null,
  datum: string | null,
  waCorrInfo: WACorrInfo | null,
  signalInfo: SignalInfo | null,
  alertFlag: AlertFlag | null
}

export interface PVTGeodeticRev0 {
  revision: number
  mode: number,
  error: number,
  latitude: number | null,
  longitude: number | null,
  height: number | null,
  undulation: number | null,
  vn: number | null,
  ve: number | null,
  vu: number | null,
  cog: number | null,
  rxClkBias: number | null,
  rxClkDrift: number | null,
  timeSystem: number | null,
  datum: number | null,
  nrSV: number | null,
  waCorrInfo: number | null,
  referenceID: number | null,
  meanCorrAge: number | null,
  signalInfo: number | null,
  alertFlag: number | null,
  padding: Padding,
  metadata: MetadataRev0
}

type MetadataRev0Input = {  mode: number, error: number, timeSystem: number | null, datum: number | null, waCorrInfo: number | null, signalInfo: number | null, alertFlag: number | null }

const getMetadaRev0 = (input: MetadataRev0Input): MetadataRev0 => ({
  mode: getMode(input.mode),
  error: getErrorPVT(input.error),
  timesytem: getNullableValue(input.timeSystem, getTimesystem),
  datum: getNullableValue(input.datum, getDatum),
  waCorrInfo: getNullableValue(input.waCorrInfo, getWACorrInfo),
  signalInfo: getNullableValue(input.signalInfo, getSignalInfo),
  alertFlag: getNullableValue(input.alertFlag, getAlertFlag),
})

const getRev0 = (data: Buffer): PVTGeodeticRev0 => {
  const body: PVTGeodeticRev0 = {
    revision: 0,
    mode: data.readUIntLE(MODE_INDEX, MODE_LENGTH),
    error: data.readUIntLE(ERROR_INDEX, ERROR_LENGTH),
    latitude: getData(data.readDoubleLE(LATITUDE_INDEX), 'FLOAT'),
    longitude: getData(data.readDoubleLE(LONGITUDE_INDEX), 'FLOAT'),
    height: getData(data.readDoubleLE(HEIGHT_INDEX), 'FLOAT'),
    undulation: getData(data.readFloatLE(UNDULATION_INDEX), 'FLOAT'),
    vn: getData(data.readFloatLE(VN_INDEX), 'FLOAT'),
    ve: getData(data.readFloatLE(VE_INDEX), 'FLOAT'),
    vu: getData(data.readFloatLE(VU_INDEX), 'FLOAT'),
    cog: getData(data.readFloatLE(COG_INDEX), 'FLOAT'),
    rxClkBias: getData(data.readDoubleLE(RXCLKBIAS_INDEX), 'FLOAT'),
    rxClkDrift: getData(data.readFloatLE(RXCLKDRIFT_INDEX), 'FLOAT'),
    timeSystem: getData(data.readUIntLE(TIMESYSTEM_INDEX, TIMESYSTEM_LENGTH), 'UINT8'),
    datum: getData(data.readUIntLE(DATUM_INDEX, DATUM_LENGTH), 'UINT8'),
    nrSV: getData(data.readUIntLE(NRSV_INDEX, NRSV_LENGTH), 'UINT8'),
    waCorrInfo: getData(data.readUIntLE(WACORRINFO_INDEX, WACORRINFO_LENGTH), 'UINT32'),
    referenceID: getData(data.readUIntLE(REFERENCEID_INDEX, REFERENCEID_LENGTH), 'UINT16'),
    meanCorrAge: getData(data.readUIntLE(MEANCORRAGE_INDEX, MEANCORRAGE_LENGTH), 'UINT16'),
    signalInfo: getData(data.readUIntLE(SIGNALINFO_INDEX, SIGNALINFO_LENGTH), 'UINT32'),
    alertFlag: getData(data.readUIntLE(ALERTFLAG_INDEX, ALERTFLAG_LENGTH), 'UINT32'),
    padding: null,
    metadata: {}
  } as PVTGeodeticRev0
  const input: MetadataRev0Input = { mode: body.mode, error: body.error, timeSystem: body.timeSystem as number, datum: body.datum as number, waCorrInfo: body.waCorrInfo, signalInfo: body.signalInfo, alertFlag: body.alertFlag }
  body.metadata = getMetadaRev0(input)
  return body
}
// PVTGeodetic Revision 1 -----------------------------------------------------
export const LastSeed: Record<number, string> = {
  0: 'NOT_SEEDED',
  1: 'MANUAL_SEED',
  2: 'DGPS_SEED',
  3: 'RTK_FIXED_SEED',
}
const getLastSeed = (num: number): string => LastSeed[num] || 'UNKNOWN'

export type PPPInfo = {
  ageLastSeed: number,
  reserved: boolean,
  lastSeed: string
}

const getPPPInfo = (num: number): PPPInfo => ({
  ageLastSeed: num & 0b0000_1111_1111_1111,
  reserved: bitState(num, 12),
  lastSeed: getLastSeed((num & 0b1110_0000_0000_0000) >>> 13)
})

export interface MetadataRev1 extends MetadataRev0 {
  pppInfo: PPPInfo | null
}

export interface PVTGeodeticRev1 extends PVTGeodeticRev0 {
  nrBases: number | null,
  pppInfo: number | null,
  metadata: MetadataRev1
}

const getRev1 = (data: Buffer, rev0: PVTGeodeticRev0): PVTGeodeticRev1 => {
  const body: PVTGeodeticRev1 = {
    ...rev0,
    revision: 1,
    nrBases: getData(data.readUIntLE(REV1_NRBASES_INDEX, REV1_NRBASES_LENGTH), 'UINT32'),
    pppInfo: getData(data.readUIntLE(REV1_PPPINFO_INDEX, REV1_PPPINFO_LENGTH), 'UINT32'),
  } as PVTGeodeticRev1
  body.metadata.pppInfo = getNullableValue(body.pppInfo, getPPPInfo)
  return body
}
// PVTGeodetic Revision 2 -----------------------------------------------------
export const ARPPosition: Record<number, string> = {
  0: 'Unknown',
  1: 'ARP-to-marker offset is zero',
  2: 'ARP-to-marker offset is not zero',
}
const getARPPosition = (num: number): string => ARPPosition[num] || 'UNKNOWN'

export type Misc = {
  baselinePointingBasestationARP: boolean,
  phaseCenterOffsetCompensated: boolean,
  propietary2: boolean,
  propietary3: boolean,
  propietary45: number,
  arpPosition: string
}
const getMisc = (misc: number): Misc => ({
  baselinePointingBasestationARP: bitState(misc, 0),
  phaseCenterOffsetCompensated: bitState(misc, 1),
  propietary2: bitState(misc, 2),
  propietary3: bitState(misc, 3),
  propietary45: (misc & 0b0011_0000) >>> 4,
  arpPosition: getARPPosition((misc & 0b1100_0000) >>> 6),
})

export interface MetadataRev2 extends MetadataRev1 {
  misc: Misc
}

export interface PVTGeodeticRev2 extends PVTGeodeticRev1 {
  latency: number | null,
  hAccuracy: number | null,
  vAccuracy: number | null,
  misc: number,
  metadata: MetadataRev2
}

const getRev2 = (data: Buffer, rev1: PVTGeodeticRev1): PVTGeodeticRev2 => {
  const body: PVTGeodeticRev2 = {
    ...rev1,
    revision: 2,
    latency: getData(data.readUIntLE(REV2_LATENCY_INDEX, REV2_LATENCY_LENGTH), 'UINT16'),
    hAccuracy: getData(data.readUIntLE(REV2_HACCURACY_INDEX, REV2_HACCURACY_LENGTH), 'UINT16'),
    vAccuracy: getData(data.readUIntLE(REV2_VACCURACY_INDEX, REV2_VACCURACY_LENGTH), 'UINT16'),
    misc: data.readUIntLE(REV2_MISC_INDEX, REV2_MISC_LENGTH)
  } as PVTGeodeticRev2
  body.metadata.misc = getMisc(body.misc)
  return body
}
// Response -------------------------------------------------------------------
export type PVTGeodetic = PVTGeodeticRev0 | PVTGeodeticRev1 | PVTGeodeticRev2

interface Response extends SBFBodyData {
  body: PVTGeodetic
}

export const pvtGeodetic = (blockRevision: number, data: Buffer): Response => {
  const name = 'PVTGeodetic'
  // Revision 0
  const bodyRev0 = getRev0(data)
  if (blockRevision === 0) {
    const REV0_PADDING_LENGTH = data.subarray(REV0_PADDING_INDEX).length
    bodyRev0.padding = getPadding(data, REV0_PADDING_INDEX, REV0_PADDING_LENGTH)
    return { name, body: bodyRev0 }
  }
  // Revision 1
  const bodyRev1 = getRev1(data, bodyRev0)
  if (blockRevision === 1) {
    const REV1_PADDING_LENGTH = data.subarray(REV1_PADDING_INDEX).length
    bodyRev1.padding = getPadding(data, REV1_PADDING_INDEX, REV1_PADDING_LENGTH)
    return { name, body: bodyRev1 }
  }
  // Revision 2
  if (blockRevision === 2) {
    const bodyRev2 = getRev2(data, bodyRev1)
    const REV2_PADDING_LENGTH = data.subarray(REV2_PADDING_INDEX).length
    bodyRev1.padding = getPadding(data, REV2_PADDING_INDEX, REV2_PADDING_LENGTH)
    return { name, body: bodyRev2 }
  }
  // Default
  return { name, body: bodyRev0 }
}