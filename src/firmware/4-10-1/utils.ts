import { GNSSSignal } from "./types";
/*
  GNSS signals have been used in the PVT computations.
  If a bit i is set, the signal type having index i has been used. 
  The signal numbers are listed below. Bit 0 (GPS-C/A) is the LSB of SignalInfo.

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
*/
export const GNSSSignals: Record<number, GNSSSignal> = {
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
  32: { signal: 'L1C', constellation: 'QZSS', carrierFrequency: 1575.42, rinexCode: '1L' },
  33: { signal: 'L1S', constellation: 'QZSS', carrierFrequency: 1575.42, rinexCode: '1Z' },
  34: { signal: 'B2b', constellation: 'BeiDou', carrierFrequency: 1207.14, rinexCode: '7D' },
  35: { signal: 'Reserved' },
}

export const getGNSSSignal = (num: number): GNSSSignal | null => GNSSSignals[num] || null
