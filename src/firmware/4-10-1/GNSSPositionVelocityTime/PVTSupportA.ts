import { SBFBodyData } from "../../../shared/types"
/* PVTSupportA -> Number: 4079 => "OnChange" interval: default PVT output rate
  This block contains various internal parameters that can be used for
  maintenance and support.

  The detailed definition of this block is not available.

  EndOfAtt -------------------------------------------------------------
  UNKNOWN
*/
interface Response extends SBFBodyData {
  body: Buffer
}

export const ptvSupportA = (blockRevision: number, data: Buffer): Response => {
  const name = 'PVTSupportA'
  const body: Buffer = data
  return { name, body }
}