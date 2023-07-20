import { SBFBodyDataMap } from "../../../shared/types"
import { receiverTime } from "./ReceiverTime"
import { xppsOffset } from "./xPPSOffset"

const blocks: SBFBodyDataMap = new Map()
// 5914 - ReceiverTime
blocks.set(5914, receiverTime)
// 5911 - xPPSOffset
blocks.set(5911, xppsOffset)

export { blocks }
