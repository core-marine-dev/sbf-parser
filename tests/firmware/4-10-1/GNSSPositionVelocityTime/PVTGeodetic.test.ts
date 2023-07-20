import { RandomNumberType, TypeData, TypedData, getTypedData, randomNumber } from '../../../utils'
import { DO_NOT_USE_FLOAT, DO_NOT_USE_UINT16, DO_NOT_USE_UINT32, DO_NOT_USE_UINT8, Datum, ErrorPVT, PVTGeodeticRev0, PVTGeodeticRev1, PVTGeodeticRev2, PVTSolution, RAIMIntegrityFlag, SignalInfo, TimeSystem, pvtGeodetic } from '../../../../src/firmware/4-10-1/GNSSPositionVelocityTime/PVTGeodetic'
import { bitState } from '../../../../src/shared/utils'
import { GNSSSignal } from '../../../../src/firmware/4-10-1/types'
import { getGNSSSignal } from '../../../../src/firmware/4-10-1/utils'
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
  Error        uint8                      PVT error code. The following values are deﬁned:
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
  Latitude      float64  1 rad  −2 * 10¹⁰  Latitude, from −π/2 to +π/2, positive North of Equator
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
Rev 2 Misc        uint8    0.01 m   65535  Bit ﬁeld containing miscellaneous ﬂags:
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
// Revision 0 -----------------------------------------------------------------
const defaultInputRev0: PVTGeodeticRev0 = {
  revision: 0,
  mode: 0b1000_0011,
  error: 0,
  latitude: getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.DOUBLE)?.number as number,
  longitude: getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.DOUBLE)?.number as number,
  height: getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.DOUBLE)?.number as number,
  undulation: getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT)?.number as number,
  vn: getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT)?.number as number,
  ve: getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT)?.number as number,
  vu: getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT)?.number as number,
  cog: getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT)?.number as number,
  rxClkBias: getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.DOUBLE)?.number as number,
  rxClkDrift: getTypedData(randomNumber(RandomNumberType.FLOAT), TypeData.FLOAT)?.number as number,
  timeSystem: 0,
  datum: 19,
  nrSV: getTypedData(randomNumber(RandomNumberType.UINT), TypeData.UINT8)?.number as number,
  waCorrInfo: 0b0001_1111,
  referenceID: getTypedData(randomNumber(RandomNumberType.UINT), TypeData.UINT16)?.number as number,
  meanCorrAge: getTypedData(randomNumber(RandomNumberType.UINT), TypeData.UINT16)?.number as number,
  signalInfo: 0b1111_1111_1111_1111_1111_1111_1111_1111,
  alertFlag: 0b0000_0001,
  padding: null,
  metadata: {
    mode: { 
      pvtSolution: 'FIXED',
      reserved45: 0b00,
      determiningPosition: false,
      flag2D3D: true,
    },
    error: 'NO_ERROR',
    timesytem: 'GPS',
    datum: 'DGNSS/RTK base station',
    waCorrInfo: {
      clockCorrection: true,
      rangeCorrection: true,
      ionosphericInformation: true,
      orbitAccuracy: true,
      DO229: true,
      reserved: 0b000,
    },
    signalInfo: {
      0: { signal: 'L1CA', constellation: 'GPS', carrierFrequency: 1575.42, rinexCode: '1C' },
      1: { signal: 'L1P', constellation: 'GPS', carrierFrequency: 1575.42, rinexCode:'1W' },
      2: { signal: 'L2P', constellation: 'GPS', carrierFrequency: 1227.60, rinexCode: '2W' },
      3: { signal: 'L2C', constellation: 'GPS', carrierFrequency: 1227.60, rinexCode: '2L' },
      4: { signal: 'L5', constellation: 'GPS', carrierFrequency: 1176.45, rinexCode: '5Q' },
      5: { signal: 'L1C', constellation: 'GPS', carrierFrequency: 1575.42, rinexCode: '1L' },
      6: { signal: 'L1CA', constellation: 'QZSS', carrierFrequency: 1575.42, rinexCode: '1C' },
      7: { signal: 'L2C', constellation: 'QZSS', carrierFrequency: 1227.60, rinexCode: '2L' },
      8: { signal: 'L1CA',  constellation: 'GLONASS', carrierFrequency: 1602.00 /*+ (FreqNr - 8) * 9 / 16*/,  rinexCode: '1C' },
      9: { signal: 'L1P', constellation: 'GLONASS', carrierFrequency: 1602.00 /*+ (FreqNr - 8) * 9 / 16*/, rinexCode: '1P' },
      10: { signal: 'L2P', constellation: 'GLONASS', carrierFrequency: 1246.00 /*+ (FreqNr - 8) * 7 /16*/, rinexCode: '2P' },
      11: { signal: 'L2CA', constellation: 'GLONASS', carrierFrequency: 1246.00 /*+ (FreqNr - 8) * 7 / 16*/, rinexCode: '2C' },
      12: { signal: 'L3', constellation: 'GLONASS', carrierFrequency: 1202.025, rinexCode: '3Q' },
      13: { signal: 'B1C', constellation: 'BeiDou', carrierFrequency: 1575.42, rinexCode: '1P' },
      14: { signal: 'B2a', constellation: 'BeiDou', carrierFrequency: 1176.45, rinexCode: '5P' },
      15: { signal: 'L5', constellation: 'NavIC/IRNSS', carrierFrequency: 1176.45, rinexCode: '5A' },
      16: { signal: 'Reserved' },
      17: { signal: 'E1 (L1BC)', constellation: 'Galileo', carrierFrequency: 1575.42, rinexCode: '1C' },
      18: { signal: 'Reserved' },
      19: { signal: 'E6 (E6BC)', constellation: 'Galileo', carrierFrequency: 1278.75, rinexCode: '6C' },
      20: { signal: 'E5a', constellation: 'Galileo', carrierFrequency: 1176.45, rinexCode: '5Q' },
      21: { signal: 'E5b', constellation: 'Galileo', carrierFrequency: 1207.14, rinexCode: '7Q' },
      22: { signal: 'E5 AltBoc', constellation: 'Galileo', carrierFrequency: 1191.795, rinexCode: '8Q' },
      23: { signal: 'LBand', constellation: 'MSS', /* carrierFrequency: L-band beam speciﬁc, */ rinexCode: 'NA' },
      24: { signal: 'L1CA', constellation: 'SBAS', carrierFrequency: 1575.42, rinexCode: '1C' },
      25: { signal: 'L5', constellation: 'SBAS', carrierFrequency: 1176.45, rinexCode: '5I' },
      26: { signal: 'L5', constellation: 'QZSS', carrierFrequency: 1176.45, rinexCode: '5Q' },
      27: { signal: 'L6', constellation: 'QZSS', carrierFrequency: 1278.75 },
      28: { signal: 'B1I', constellation: 'BeiDou', carrierFrequency: 1561.098, rinexCode: '2I' },
      29: { signal: 'B2I', constellation: 'BeiDou', carrierFrequency: 1207.14, rinexCode: '7I' },
      30: { signal: 'B3I', constellation: 'BeiDou', carrierFrequency: 1268.52, rinexCode: '6I' },
      31: { signal: 'Reserved' },
    },
    alertFlag: {
      raimIntegrityFlag: 'RAIM_SUCCESSFULL',
      galileoIntegrityFailed: false,
      galileoIonosphericStorm: false,
      reserved4: false,
      reserved57: 0b00,
    }
  }
}

const getNameFrameDataRev0 = (input: PVTGeodeticRev0 = defaultInputRev0) => {
  const frameName = 'PVTGeodetic'
  // Mode
  const { number: mode, buffer: modeBuffer } = getTypedData(input.mode, TypeData.UINT8) as TypedData
  // Error
  const { number: error, buffer: errorBuffer } = getTypedData(input.error, TypeData.UINT8) as TypedData
  // Latitude
  const { number: latitude, buffer: latitudeBuffer } = getTypedData(input.latitude as number, TypeData.DOUBLE) as TypedData
  // Longitude
  const { number: longitude, buffer: longitudeBuffer } = getTypedData(input.longitude as number, TypeData.DOUBLE) as TypedData
  // Height
  const { number: height, buffer: heightBuffer } = getTypedData(input.height as number, TypeData.DOUBLE) as TypedData
  // Undulation
  const { number: undulation, buffer: undulationBuffer } = getTypedData(input.undulation as number, TypeData.FLOAT) as TypedData
  // Vn
  const { number: vn, buffer: vnBuffer } = getTypedData(input.vn as number, TypeData.FLOAT) as TypedData
  // Ve
  const { number: ve, buffer: veBuffer } = getTypedData(input.ve as number, TypeData.FLOAT) as TypedData
  // Vu
  const { number: vu, buffer: vuBuffer } = getTypedData(input.vu as number, TypeData.FLOAT) as TypedData
  // COG
  const { number: cog, buffer: cogBuffer } = getTypedData(input.cog as number, TypeData.FLOAT) as TypedData
  // RxClkBias
  const { number: rxClkBias, buffer: rxClkBiasBuffer } = getTypedData(input.rxClkBias as number, TypeData.DOUBLE) as TypedData
  // RxClkDrift
  const { number: rxClkDrift, buffer: rxClkDriftBuffer } = getTypedData(input.rxClkDrift as number, TypeData.FLOAT) as TypedData
  // TimeSystem
  const { number: timeSystem, buffer: timeSystemBuffer } = getTypedData(input.timeSystem as number, TypeData.UINT8) as TypedData
  // Datum
  const { number: datum, buffer: datumBuffer } = getTypedData(input.datum as number, TypeData.UINT8) as TypedData
  // NrSV
  const { number: nrSV, buffer: nrSVBuffer } = getTypedData(input.nrSV as number, TypeData.UINT8) as TypedData
  // WACorrInfo
  const { number: waCorrInfo, buffer: waCorrInfoBuffer } = getTypedData(input.waCorrInfo as number, TypeData.UINT8) as TypedData
  // ReferenceID
  const { number: referenceID, buffer: referenceIDBuffer } = getTypedData(input.referenceID as number, TypeData.UINT16) as TypedData
  // MeanCorrAge
  const { number: meanCorrAge, buffer: meanCorrAgeBuffer } = getTypedData(input.meanCorrAge as number, TypeData.UINT16) as TypedData
  // SignalInfo
  const { number: signalInfo, buffer: signalInfoBuffer } = getTypedData(input.signalInfo as number, TypeData.UINT32) as TypedData
  // AlertFlag
  const { number: alertFlag, buffer: alertFlagBuffer } = getTypedData(input.alertFlag as number, TypeData.UINT8) as TypedData
  // Padding
  const auxBuffer = Buffer.concat([modeBuffer, errorBuffer, latitudeBuffer, longitudeBuffer, heightBuffer, undulationBuffer, vnBuffer, veBuffer, vuBuffer, cogBuffer, rxClkBiasBuffer, rxClkDriftBuffer, timeSystemBuffer, datumBuffer, nrSVBuffer, waCorrInfoBuffer, referenceIDBuffer, meanCorrAgeBuffer, signalInfoBuffer, alertFlagBuffer])
  // const paddingLength = length - auxBuffer.length
  // const { padding, paddingBuffer } = (paddingLength > 0)
  //   ? { padding: 0, paddingBuffer: Buffer.from(Array(paddingLength).fill(0)) }
  //   : { padding: null, paddingBuffer: Buffer.from([]) }
  const padding = null 
  const paddingBuffer = Buffer.from([]) 

  const frame: PVTGeodeticRev0 = {
    revision: input.revision,
    mode, error, latitude, longitude, height, undulation, vn, ve, vu, cog, rxClkBias, rxClkDrift, timeSystem, datum, nrSV, waCorrInfo, referenceID, meanCorrAge, signalInfo, alertFlag,
    padding,
    metadata: { ...input.metadata }
  }

  const data = Buffer.concat([auxBuffer, paddingBuffer])

  return { frameName, frame, data }
}

describe('Testing PVTGeodetic Revision 0', () => {

  const revision = 0

  test('Regular body', () => {
    const { frameName, frame, data } = getNameFrameDataRev0()
    const { name, body } = pvtGeodetic(revision, data) as { name: string, body: PVTGeodeticRev0 }
    const bodyKeys = Object.keys(body as object)
    const frameKeys = Object.keys(frame)
    expect(name).toBe(frameName)
    expect(bodyKeys.length).toBe(frameKeys.length)
    expect(body).toStrictEqual(frame)
  })

  test('Nullable fields', () => {
    const input = structuredClone(defaultInputRev0)
    input.latitude = DO_NOT_USE_FLOAT
    input.longitude = DO_NOT_USE_FLOAT
    input.height = DO_NOT_USE_FLOAT
    input.undulation = DO_NOT_USE_FLOAT
    input.vn = DO_NOT_USE_FLOAT
    input.ve = DO_NOT_USE_FLOAT
    input.vu = DO_NOT_USE_FLOAT
    input.cog = DO_NOT_USE_FLOAT
    input.rxClkBias = DO_NOT_USE_FLOAT
    input.rxClkDrift = DO_NOT_USE_FLOAT
    input.timeSystem = DO_NOT_USE_UINT8
    input.datum = DO_NOT_USE_UINT8
    input.nrSV = DO_NOT_USE_UINT8
    input.waCorrInfo = DO_NOT_USE_UINT32
    input.referenceID = DO_NOT_USE_UINT16
    input.meanCorrAge = DO_NOT_USE_UINT16
    input.signalInfo = DO_NOT_USE_UINT32
    input.alertFlag = DO_NOT_USE_UINT32
    input.metadata = {
      ...input.metadata,
      timesytem: null,
      datum: null,
      waCorrInfo: null,
      signalInfo: null,
      alertFlag: null
    }

    const { data } = getNameFrameDataRev0(input)
    const { body } = pvtGeodetic(revision, data) as { name: string, body: PVTGeodeticRev0 }

    input.latitude = null
    input.longitude = null
    input.height = null
    input.undulation = null
    input.vn = null
    input.ve = null
    input.vu = null
    input.cog = null
    input.rxClkBias = null
    input.rxClkDrift = null
    input.timeSystem = null
    input.datum = null
    input.nrSV = null
    input.waCorrInfo = null
    input.referenceID = null
    input.meanCorrAge = null
    input.signalInfo = null
    input.alertFlag = null

    // expect(body).toStrictEqual(input)
    expect(body).toMatchObject(input)
  })

  test('Mode field', () => {
    const input = structuredClone(defaultInputRev0)
    const START = 0b0000_0000
    const END = 0b0000_1111
    for (let i = START; i <= END; i++) {
      input.mode = i
      input.metadata = {
        ...input.metadata,
        mode: {
          pvtSolution: (i < 13 && i !== 9 && i !== 11) ? PVTSolution[i] : 'UNKNOWN',
          reserved45: 0b00,
          determiningPosition: false,
          flag2D3D: false
        }
      }
      const { data } = getNameFrameDataRev0(input)
      const { body } = pvtGeodetic(revision, data) as { name: string, body: PVTGeodeticRev0 }
      // expect(body).toStrictEqual(input)
      expect(body).toMatchObject(input)
    }
  })

  test('Error field', () => {
    const input = structuredClone(defaultInputRev0)
    const START = 0b0000_0000
    const END = 0b1111_1111
    for (let i = START; i <= END; i++) {
      input.error = i
      input.metadata = {
        ...input.metadata,
        error: (i < 11) ? ErrorPVT[i] : 'UNKNOWN',
      }
      const { data } = getNameFrameDataRev0(input)
      const { body } = pvtGeodetic(revision, data) as { name: string, body: PVTGeodeticRev0 }
      // expect(body).toStrictEqual(input)
      expect(body).toMatchObject(input)
    }
  })

  test('TimeSystem field', () => {
    const input = structuredClone(defaultInputRev0)
    const START = 0b0000_0000
    const END = 0b1111_1111
    for (let i = START; i <= END; i++) {
      input.timeSystem = i
      input.metadata = {
        ...input.metadata,
        timesytem: (i < 6 && i !== 2) ? TimeSystem[i] : 'UNKNOWN'
      }
      const { data } = getNameFrameDataRev0(input)
      const { body } = pvtGeodetic(revision, data) as { name: string, body: PVTGeodeticRev0 }
      if (i === END) {
        input.timeSystem = null
        input.metadata.timesytem = null
      }
      // expect(body).toStrictEqual(input)
      expect(body).toMatchObject(input)
    }
  })

  test('Datum field', () => {
    const input = structuredClone(defaultInputRev0)
    const START = 0b0000_0000
    const END = 0b1111_1111
    for (let i = START; i <= END; i++) {
      input.datum = i
      input.metadata = {
        ...input.metadata,
        datum: ([0, 19, 30, 31, 32, 33, 34, 35, 250, 251].includes(i)) ? Datum[i] : 'UNKNOWN'
      }
      const { data } = getNameFrameDataRev0(input)
      const { body } = pvtGeodetic(revision, data) as { name: string, body: PVTGeodeticRev0 }
      if (i === END) {
        input.datum = null
        input.metadata.datum = null
      }
      // expect(body).toStrictEqual(input)
      expect(body).toMatchObject(input)
    }
  })

  test('WACorrInfo field', () => {
    const input = structuredClone(defaultInputRev0)
    const START = 0b0000_0000
    const END = 0b1111_1111
    for (let i = START; i <= END; i++) {
      input.waCorrInfo = i
      input.metadata = {
        ...input.metadata,
        waCorrInfo: {
          clockCorrection: bitState(i, 0),
          rangeCorrection: bitState(i, 1),
          ionosphericInformation: bitState(i, 2),
          orbitAccuracy: bitState(i, 3),
          DO229: bitState(i, 4),
          reserved: (i & 0b1110_0000) >>> 5,
        }
      }
      const { data } = getNameFrameDataRev0(input)
      const { body } = pvtGeodetic(revision, data) as { name: string, body: PVTGeodeticRev0 }
      if (i === START) {
        input.waCorrInfo = null
        input.metadata.waCorrInfo = null
      }
      // expect(body).toStrictEqual(input)
      expect(body).toMatchObject(input)
    }
  })

  test('SignalInfo field', () => {
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

    const input = structuredClone(defaultInputRev0)
    const START = 0b0000_0000_0000_0000_0000_0000_0000_0000
    const END = 0b0000_0000_0000_0000_0000_0000_0010_1000 // 40
    for (let i = START; i <= END; i++) {
      input.signalInfo = i
      input.metadata = {
        ...input.metadata,
        signalInfo: (i !== START) ? getSignalInfo(i) : null
      }
      const { data } = getNameFrameDataRev0(input)
      const { body } = pvtGeodetic(revision, data) as { name: string, body: PVTGeodeticRev0 }
      if (i === START) {
        input.signalInfo = null
        input.metadata.signalInfo = null
      }
      // expect(body).toStrictEqual(input)
      expect(body).toMatchObject(input)
    }
  })

  test('AlertFlag field', () => {
    const input = structuredClone(defaultInputRev0)
    const START = 0b0000_0000
    const END = 0b1111_1111
    for (let i = START; i <= END; i++) {
      input.alertFlag = i
      input.metadata = {
        ...input.metadata,
        alertFlag: {
          raimIntegrityFlag: RAIMIntegrityFlag[i & 0b0000_0011],
          galileoIntegrityFailed: bitState(i, 2),
          galileoIonosphericStorm: bitState(i, 3),
          reserved4: bitState(i, 4),
          reserved57: (i & 0b1110_0000) >>> 5,
        }
      }
      const { data } = getNameFrameDataRev0(input)
      const { body } = pvtGeodetic(revision, data) as { name: string, body: PVTGeodeticRev0 }
      if (i === START) {
        input.alertFlag = null
        input.metadata.alertFlag = null
      }
      // expect(body).toStrictEqual(input)
      expect(body).toMatchObject(input)
    }
  })
})
// Revision 1 -----------------------------------------------------------------
const defaultInputRev1: PVTGeodeticRev1 = {
  ...defaultInputRev0,
  revision: 1,
  nrBases: getTypedData(randomNumber(RandomNumberType.UINT), TypeData.UINT8)?.number as number,
  pppInfo: 0b0111_1111_1111_1111,
  metadata: {
    ...defaultInputRev0.metadata,
    pppInfo: {
      ageLastSeed: 0b1111_1111_1111,
      reserved: true,
      lastSeed: 'RTK_FIXED_SEED'
    }
  }
}

const getNameFrameDataRev1 = (input: PVTGeodeticRev1 = defaultInputRev1) => {
  const frameName = 'PVTGeodetic'
  // Mode
  const { number: mode, buffer: modeBuffer } = getTypedData(input.mode, TypeData.UINT8) as TypedData
  // Error
  const { number: error, buffer: errorBuffer } = getTypedData(input.error, TypeData.UINT8) as TypedData
  // Latitude
  const { number: latitude, buffer: latitudeBuffer } = getTypedData(input.latitude as number, TypeData.DOUBLE) as TypedData
  // Longitude
  const { number: longitude, buffer: longitudeBuffer } = getTypedData(input.longitude as number, TypeData.DOUBLE) as TypedData
  // Height
  const { number: height, buffer: heightBuffer } = getTypedData(input.height as number, TypeData.DOUBLE) as TypedData
  // Undulation
  const { number: undulation, buffer: undulationBuffer } = getTypedData(input.undulation as number, TypeData.FLOAT) as TypedData
  // Vn
  const { number: vn, buffer: vnBuffer } = getTypedData(input.vn as number, TypeData.FLOAT) as TypedData
  // Ve
  const { number: ve, buffer: veBuffer } = getTypedData(input.ve as number, TypeData.FLOAT) as TypedData
  // Vu
  const { number: vu, buffer: vuBuffer } = getTypedData(input.vu as number, TypeData.FLOAT) as TypedData
  // COG
  const { number: cog, buffer: cogBuffer } = getTypedData(input.cog as number, TypeData.FLOAT) as TypedData
  // RxClkBias
  const { number: rxClkBias, buffer: rxClkBiasBuffer } = getTypedData(input.rxClkBias as number, TypeData.DOUBLE) as TypedData
  // RxClkDrift
  const { number: rxClkDrift, buffer: rxClkDriftBuffer } = getTypedData(input.rxClkDrift as number, TypeData.FLOAT) as TypedData
  // TimeSystem
  const { number: timeSystem, buffer: timeSystemBuffer } = getTypedData(input.timeSystem as number, TypeData.UINT8) as TypedData
  // Datum
  const { number: datum, buffer: datumBuffer } = getTypedData(input.datum as number, TypeData.UINT8) as TypedData
  // NrSV
  const { number: nrSV, buffer: nrSVBuffer } = getTypedData(input.nrSV as number, TypeData.UINT8) as TypedData
  // WACorrInfo
  const { number: waCorrInfo, buffer: waCorrInfoBuffer } = getTypedData(input.waCorrInfo as number, TypeData.UINT8) as TypedData
  // ReferenceID
  const { number: referenceID, buffer: referenceIDBuffer } = getTypedData(input.referenceID as number, TypeData.UINT16) as TypedData
  // MeanCorrAge
  const { number: meanCorrAge, buffer: meanCorrAgeBuffer } = getTypedData(input.meanCorrAge as number, TypeData.UINT16) as TypedData
  // SignalInfo
  const { number: signalInfo, buffer: signalInfoBuffer } = getTypedData(input.signalInfo as number, TypeData.UINT32) as TypedData
  // AlertFlag
  const { number: alertFlag, buffer: alertFlagBuffer } = getTypedData(input.alertFlag as number, TypeData.UINT8) as TypedData
  // NrBases
  const { number: nrBases, buffer: nrBasesBuffer } = getTypedData(input.nrBases as number, TypeData.UINT8) as TypedData
  // PPPInfo
  const { number: pppInfo, buffer: pppInfoBuffer } = getTypedData(input.pppInfo as number, TypeData.UINT16) as TypedData
  // Padding
  const auxBuffer = Buffer.concat([modeBuffer, errorBuffer, latitudeBuffer, longitudeBuffer, heightBuffer, undulationBuffer, vnBuffer, veBuffer, vuBuffer, cogBuffer, rxClkBiasBuffer, rxClkDriftBuffer, timeSystemBuffer, datumBuffer, nrSVBuffer, waCorrInfoBuffer, referenceIDBuffer, meanCorrAgeBuffer, signalInfoBuffer, alertFlagBuffer, nrBasesBuffer, pppInfoBuffer])
  // const paddingLength = length - auxBuffer.length
  // const { padding, paddingBuffer } = (paddingLength > 0)
  //   ? { padding: 0, paddingBuffer: Buffer.from(Array(paddingLength).fill(0)) }
  //   : { padding: null, paddingBuffer: Buffer.from([]) }
  const padding = null 
  const paddingBuffer = Buffer.from([]) 

  const frame: PVTGeodeticRev1 = {
    revision: input.revision,
    mode, error, latitude, longitude, height, undulation, vn, ve, vu, cog, rxClkBias, rxClkDrift, timeSystem, datum, nrSV, waCorrInfo, referenceID, meanCorrAge, signalInfo, alertFlag, nrBases, pppInfo,
    padding,
    metadata: { ...input.metadata }
  }

  const data = Buffer.concat([auxBuffer, paddingBuffer])

  return { frameName, frame, data }
}

describe('Testing PVTGeodetic Revision 1', () => {

  const revision = 1

  test('Regular body', () => {
    const { frameName, frame, data } = getNameFrameDataRev1()
    const { name, body } = pvtGeodetic(revision, data) as { name: string, body: PVTGeodeticRev1 }
    const bodyKeys = Object.keys(body as object)
    const frameKeys = Object.keys(frame)
    expect(name).toBe(frameName)
    expect(bodyKeys.length).toBe(frameKeys.length)
    expect(body).toStrictEqual(frame)
  })

  test('Nullable fields', () => {
    const input = structuredClone(defaultInputRev1)
    input.latitude = DO_NOT_USE_FLOAT
    input.longitude = DO_NOT_USE_FLOAT
    input.height = DO_NOT_USE_FLOAT
    input.undulation = DO_NOT_USE_FLOAT
    input.vn = DO_NOT_USE_FLOAT
    input.ve = DO_NOT_USE_FLOAT
    input.vu = DO_NOT_USE_FLOAT
    input.cog = DO_NOT_USE_FLOAT
    input.rxClkBias = DO_NOT_USE_FLOAT
    input.rxClkDrift = DO_NOT_USE_FLOAT
    input.timeSystem = DO_NOT_USE_UINT8
    input.datum = DO_NOT_USE_UINT8
    input.nrSV = DO_NOT_USE_UINT8
    input.waCorrInfo = DO_NOT_USE_UINT32
    input.referenceID = DO_NOT_USE_UINT16
    input.meanCorrAge = DO_NOT_USE_UINT16
    input.signalInfo = DO_NOT_USE_UINT32
    input.alertFlag = DO_NOT_USE_UINT32
    input.nrBases = DO_NOT_USE_UINT32
    input.pppInfo = DO_NOT_USE_UINT32
    input.metadata = {
      ...input.metadata,
      timesytem: null,
      datum: null,
      waCorrInfo: null,
      signalInfo: null,
      alertFlag: null,
      pppInfo: null,
    }

    const { data } = getNameFrameDataRev1(input)
    const { body } = pvtGeodetic(revision, data) as { name: string, body: PVTGeodeticRev1 }

    input.latitude = null
    input.longitude = null
    input.height = null
    input.undulation = null
    input.vn = null
    input.ve = null
    input.vu = null
    input.cog = null
    input.rxClkBias = null
    input.rxClkDrift = null
    input.timeSystem = null
    input.datum = null
    input.nrSV = null
    input.waCorrInfo = null
    input.referenceID = null
    input.meanCorrAge = null
    input.signalInfo = null
    input.alertFlag = null
    input.nrBases = null
    input.pppInfo = null

    // expect(body).toStrictEqual(input)
    expect(body).toMatchObject(input)
  })

  test('PPPInfo field', () => {
    const input = structuredClone(defaultInputRev1)
    input.pppInfo = 0b0000_0000_0000_1000
    input.metadata = {
      ...input.metadata,
      pppInfo: {
        ageLastSeed: 0b0000_0000_1000,
        reserved: false,
        lastSeed: 'NOT_SEEDED'
      }
    }
    const { data: data1 } = getNameFrameDataRev1(input)
    const { body: body1 } = pvtGeodetic(revision, data1) as { name: string, body: PVTGeodeticRev2 }
    // expect(body1).toStrictEqual(input)
    expect(body1).toMatchObject(input)

    input.pppInfo = 0b0010_0000_0000_1000
    input.metadata = {
      ...input.metadata,
      pppInfo: {
        ageLastSeed: 0b0000_0000_1000,
        reserved: false,
        lastSeed: 'MANUAL_SEED'
      }
    }
    const { data: data2 } = getNameFrameDataRev1(input)
    const { body: body2 } = pvtGeodetic(revision, data2) as { name: string, body: PVTGeodeticRev2 }
    // expect(body2).toStrictEqual(input)
    expect(body2).toMatchObject(input)

    input.pppInfo = 0b0100_0000_0000_1000
    input.metadata = {
      ...input.metadata,
      pppInfo: {
        ageLastSeed: 0b0000_0000_1000,
        reserved: false,
        lastSeed: 'DGPS_SEED'
      }
    }
    const { data: data3 } = getNameFrameDataRev1(input)
    const { body: body3 } = pvtGeodetic(revision, data3) as { name: string, body: PVTGeodeticRev2 }
    // expect(body3).toStrictEqual(input)
    expect(body3).toMatchObject(input)

    input.pppInfo = 0b0110_0000_0000_1000
    input.metadata = {
      ...input.metadata,
      pppInfo: {
        ageLastSeed: 0b0000_0000_1000,
        reserved: false,
        lastSeed: 'RTK_FIXED_SEED'
      }
    }
    const { data: data4 } = getNameFrameDataRev1(input)
    const { body: body4 } = pvtGeodetic(revision, data4) as { name: string, body: PVTGeodeticRev2 }
    // expect(body4).toStrictEqual(input)
    expect(body4).toMatchObject(input)

    input.pppInfo = 0b1110_0000_0000_1000
    input.metadata = {
      ...input.metadata,
      pppInfo: {
        ageLastSeed: 0b0000_0000_1000,
        reserved: false,
        lastSeed: 'UNKNOWN'
      }
    }
    const { data: data5 } = getNameFrameDataRev1(input)
    const { body: body5 } = pvtGeodetic(revision, data5) as { name: string, body: PVTGeodeticRev2 }
    // expect(body5).toStrictEqual(input)
    expect(body5).toMatchObject(input)
  })
})
// Revision 2 -----------------------------------------------------------------
const defaultInputRev2: PVTGeodeticRev2 = {
  ...defaultInputRev1,
  revision: 2,
  latency: getTypedData(randomNumber(RandomNumberType.UINT), TypeData.UINT16)?.number as number,
  hAccuracy: getTypedData(randomNumber(RandomNumberType.UINT), TypeData.UINT16)?.number as number,
  vAccuracy: getTypedData(randomNumber(RandomNumberType.UINT), TypeData.UINT16)?.number as number,
  misc: getTypedData(0b1011_1111, TypeData.UINT8)?.number as number,
  metadata: {
    ...defaultInputRev1.metadata,
    misc: {
      baselinePointingBasestationARP: true,
      phaseCenterOffsetCompensated: true,
      propietary2: true,
      propietary3: true,
      propietary45: 0b11,
      arpPosition: 'ARP-to-marker offset is not zero',
    }
  }
}

const getNameFrameDataRev2 = (input: PVTGeodeticRev2 = defaultInputRev2) => {
  const frameName = 'PVTGeodetic'
  // Mode
  const { number: mode, buffer: modeBuffer } = getTypedData(input.mode, TypeData.UINT8) as TypedData
  // Error
  const { number: error, buffer: errorBuffer } = getTypedData(input.error, TypeData.UINT8) as TypedData
  // Latitude
  const { number: latitude, buffer: latitudeBuffer } = getTypedData(input.latitude as number, TypeData.DOUBLE) as TypedData
  // Longitude
  const { number: longitude, buffer: longitudeBuffer } = getTypedData(input.longitude as number, TypeData.DOUBLE) as TypedData
  // Height
  const { number: height, buffer: heightBuffer } = getTypedData(input.height as number, TypeData.DOUBLE) as TypedData
  // Undulation
  const { number: undulation, buffer: undulationBuffer } = getTypedData(input.undulation as number, TypeData.FLOAT) as TypedData
  // Vn
  const { number: vn, buffer: vnBuffer } = getTypedData(input.vn as number, TypeData.FLOAT) as TypedData
  // Ve
  const { number: ve, buffer: veBuffer } = getTypedData(input.ve as number, TypeData.FLOAT) as TypedData
  // Vu
  const { number: vu, buffer: vuBuffer } = getTypedData(input.vu as number, TypeData.FLOAT) as TypedData
  // COG
  const { number: cog, buffer: cogBuffer } = getTypedData(input.cog as number, TypeData.FLOAT) as TypedData
  // RxClkBias
  const { number: rxClkBias, buffer: rxClkBiasBuffer } = getTypedData(input.rxClkBias as number, TypeData.DOUBLE) as TypedData
  // RxClkDrift
  const { number: rxClkDrift, buffer: rxClkDriftBuffer } = getTypedData(input.rxClkDrift as number, TypeData.FLOAT) as TypedData
  // TimeSystem
  const { number: timeSystem, buffer: timeSystemBuffer } = getTypedData(input.timeSystem as number, TypeData.UINT8) as TypedData
  // Datum
  const { number: datum, buffer: datumBuffer } = getTypedData(input.datum as number, TypeData.UINT8) as TypedData
  // NrSV
  const { number: nrSV, buffer: nrSVBuffer } = getTypedData(input.nrSV as number, TypeData.UINT8) as TypedData
  // WACorrInfo
  const { number: waCorrInfo, buffer: waCorrInfoBuffer } = getTypedData(input.waCorrInfo as number, TypeData.UINT8) as TypedData
  // ReferenceID
  const { number: referenceID, buffer: referenceIDBuffer } = getTypedData(input.referenceID as number, TypeData.UINT16) as TypedData
  // MeanCorrAge
  const { number: meanCorrAge, buffer: meanCorrAgeBuffer } = getTypedData(input.meanCorrAge as number, TypeData.UINT16) as TypedData
  // SignalInfo
  const { number: signalInfo, buffer: signalInfoBuffer } = getTypedData(input.signalInfo as number, TypeData.UINT32) as TypedData
  // AlertFlag
  const { number: alertFlag, buffer: alertFlagBuffer } = getTypedData(input.alertFlag as number, TypeData.UINT8) as TypedData
  // NrBases
  const { number: nrBases, buffer: nrBasesBuffer } = getTypedData(input.nrBases as number, TypeData.UINT8) as TypedData
  // PPPInfo
  const { number: pppInfo, buffer: pppInfoBuffer } = getTypedData(input.pppInfo as number, TypeData.UINT16) as TypedData
  // Latency
  const { number: latency, buffer: latencyBuffer } = getTypedData(input.latency as number, TypeData.UINT16) as TypedData
  // HAccuracy
  const { number: hAccuracy, buffer: hAccuracyBuffer } = getTypedData(input.hAccuracy as number, TypeData.UINT16) as TypedData
  // VAccuracy
  const { number: vAccuracy, buffer: vAccuracyBuffer } = getTypedData(input.vAccuracy as number, TypeData.UINT16) as TypedData
  // Misc
  const { number: misc, buffer: miscBuffer } = getTypedData(input.misc as number, TypeData.UINT8) as TypedData
  // Padding
  const auxBuffer = Buffer.concat([modeBuffer, errorBuffer, latitudeBuffer, longitudeBuffer, heightBuffer, undulationBuffer, vnBuffer, veBuffer, vuBuffer, cogBuffer, rxClkBiasBuffer, rxClkDriftBuffer, timeSystemBuffer, datumBuffer, nrSVBuffer, waCorrInfoBuffer, referenceIDBuffer, meanCorrAgeBuffer, signalInfoBuffer, alertFlagBuffer, nrBasesBuffer, pppInfoBuffer, latencyBuffer, hAccuracyBuffer, vAccuracyBuffer, miscBuffer])
  // const paddingLength = length - auxBuffer.length
  // const { padding, paddingBuffer } = (paddingLength > 0)
  //   ? { padding: 0, paddingBuffer: Buffer.from(Array(paddingLength).fill(0)) }
  //   : { padding: null, paddingBuffer: Buffer.from([]) }
  const padding = null 
  const paddingBuffer = Buffer.from([]) 

  const frame: PVTGeodeticRev2 = {
    revision: input.revision,
    mode, error, latitude, longitude, height, undulation, vn, ve, vu, cog, rxClkBias, rxClkDrift, timeSystem, datum, nrSV, waCorrInfo, referenceID, meanCorrAge, signalInfo, alertFlag, nrBases, pppInfo, latency, hAccuracy, vAccuracy, misc,
    padding,
    metadata: { ...input.metadata }
  }

  const data = Buffer.concat([auxBuffer, paddingBuffer])

  return { frameName, frame, data }
}

describe('Testing PVTGeodetic Revision 2', () => {

  const revision = 2

  test('Regular body', () => {
    const { frameName, frame, data } = getNameFrameDataRev2()
    const { name, body } = pvtGeodetic(revision, data) as { name: string, body: PVTGeodeticRev2 }
    const bodyKeys = Object.keys(body as object)
    const frameKeys = Object.keys(frame)
    expect(name).toBe(frameName)
    expect(bodyKeys.length).toBe(frameKeys.length)
    expect(body).toStrictEqual(frame)
  })

  test('Nullable fields', () => {
    const input = structuredClone(defaultInputRev2)
    input.latitude = DO_NOT_USE_FLOAT
    input.longitude = DO_NOT_USE_FLOAT
    input.height = DO_NOT_USE_FLOAT
    input.undulation = DO_NOT_USE_FLOAT
    input.vn = DO_NOT_USE_FLOAT
    input.ve = DO_NOT_USE_FLOAT
    input.vu = DO_NOT_USE_FLOAT
    input.cog = DO_NOT_USE_FLOAT
    input.rxClkBias = DO_NOT_USE_FLOAT
    input.rxClkDrift = DO_NOT_USE_FLOAT
    input.timeSystem = DO_NOT_USE_UINT8
    input.datum = DO_NOT_USE_UINT8
    input.nrSV = DO_NOT_USE_UINT8
    input.waCorrInfo = DO_NOT_USE_UINT32
    input.referenceID = DO_NOT_USE_UINT16
    input.meanCorrAge = DO_NOT_USE_UINT16
    input.signalInfo = DO_NOT_USE_UINT32
    input.alertFlag = DO_NOT_USE_UINT32
    input.nrBases = DO_NOT_USE_UINT32
    input.pppInfo = DO_NOT_USE_UINT32
    input.latency = DO_NOT_USE_UINT16
    input.hAccuracy = DO_NOT_USE_UINT16
    input.vAccuracy = DO_NOT_USE_UINT16
    input.metadata = {
      ...input.metadata,
      timesytem: null,
      datum: null,
      waCorrInfo: null,
      signalInfo: null,
      alertFlag: null,
      pppInfo: null,
    }

    const { data } = getNameFrameDataRev2(input)
    const { body } = pvtGeodetic(revision, data) as { name: string, body: PVTGeodeticRev2 }

    input.latitude = null
    input.longitude = null
    input.height = null
    input.undulation = null
    input.vn = null
    input.ve = null
    input.vu = null
    input.cog = null
    input.rxClkBias = null
    input.rxClkDrift = null
    input.timeSystem = null
    input.datum = null
    input.nrSV = null
    input.waCorrInfo = null
    input.referenceID = null
    input.meanCorrAge = null
    input.signalInfo = null
    input.alertFlag = null
    input.nrBases = null
    input.pppInfo = null
    input.latency = null
    input.hAccuracy = null
    input.vAccuracy = null

    // expect(body).toStrictEqual(input)
    expect(body).toMatchObject(input)
  })

  test('Misc field', () => {
    const input = structuredClone(defaultInputRev2)
    input.misc = 0b0000_0000
    input.metadata = {
      ...input.metadata,
      misc: {
        baselinePointingBasestationARP: false,
        phaseCenterOffsetCompensated: false,
        propietary2: false,
        propietary3: false,
        propietary45: 0b00,
        arpPosition: 'Unknown'
      }
    }
    const { data: data1 } = getNameFrameDataRev2(input)
    const { body: body1 } = pvtGeodetic(revision, data1) as { name: string, body: PVTGeodeticRev2 }
    // expect(body).toStrictEqual(input)
    expect(body1).toMatchObject(input)

    input.misc = 0b0100_0000
    input.metadata.misc.arpPosition = 'ARP-to-marker offset is zero'
    const { data: data2 } = getNameFrameDataRev2(input)
    const { body: body2 } = pvtGeodetic(revision, data2) as { name: string, body: PVTGeodeticRev2 }
    // expect(body).toStrictEqual(input)
    expect(body2).toMatchObject(input)

    input.misc = 0b1000_0000
    input.metadata.misc.arpPosition = 'ARP-to-marker offset is not zero'
    const { data: data3 } = getNameFrameDataRev2(input)
    const { body: body3 } = pvtGeodetic(revision, data3) as { name: string, body: PVTGeodeticRev2 }
    // expect(body).toStrictEqual(input)
    expect(body3).toMatchObject(input)

    input.misc = 0b1100_0000
    input.metadata.misc.arpPosition = 'UNKNOWN'
    const { data: data4 } = getNameFrameDataRev2(input)
    const { body: body4 } = pvtGeodetic(revision, data4) as { name: string, body: PVTGeodeticRev2 }
    // expect(body).toStrictEqual(input)
    expect(body4).toMatchObject(input)
  })
})
