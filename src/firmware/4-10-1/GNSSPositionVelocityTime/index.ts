import { SBFBodyDataMap } from "../../../shared/types"
import { dop } from "./DOP"
import { endOfPVT } from "./EndOfPVT"
import { ptvSupport } from "./PVTSupport"
import { ptvSupportA } from "./PVTSupportA"
import { pvtGeodetic } from "./PVTGeodetic"

const blocks: SBFBodyDataMap = new Map()
// 4006 - PVTCartesian
// blocks.set(4006, pvtCartesian)
// 4007 - PVTGeodetic
blocks.set(4007, pvtGeodetic)
// 5905 - PosCovCartesian
// blocks.set(5905, posCovCartesian)
// 5906 - PosCovGeodetic
// blocks.set(5906, posCovGeodetic)
// 5907 - VelCovCartesian
// blocks.set(5907, velCovCartesian)
// 5908 - VelCovGeodetic
// blocks.set(5908, velCovGeodetic)
// 4001 - DOP
blocks.set(4001, dop)
// 4044 - PosCart
// blocks.set(4044, posCart)
// 4052 - PosLocal
// blocks.set(4052, posLocal)
// 4094 - PosProjected
// blocks.set(4094, posProjected)
// 4043 - BaseVectorCart
// blocks.set(4043, baseVectorCart)
// 4028 - BaseVectorGeod
// blocks.set(4028, baseVectorGeod)
// 4076 - PTVSupport
blocks.set(4076, ptvSupport)
// 4079 - PTVSupportA
blocks.set(4079, ptvSupportA)
// 5921 - EndOfPVT
blocks.set(5921, endOfPVT)
export { blocks }
