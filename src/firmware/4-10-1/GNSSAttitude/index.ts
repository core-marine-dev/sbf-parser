import { SBFBodyDataMap } from "../../../shared/types"
import { attCovEuler } from "./AttCovEuler"
import { attEuler } from "./AttEuler"
import { auxAntPositions } from "./AuxAntPositions"
import { endOfAtt } from "./EndOfAtt"

const blocks: SBFBodyDataMap = new Map()
// 5938 - AttEuler
blocks.set(5938, attEuler)
// 5939 - AttCovEuler
blocks.set(5939, attCovEuler)
// 5942 - AuxAntPositions
blocks.set(5942, auxAntPositions)
// 5943- EndOfAtt
blocks.set(5943, endOfAtt)
export { blocks }
