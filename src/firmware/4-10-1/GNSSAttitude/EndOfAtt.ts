import { SBFBodyData } from "../../../shared/types"
import { getPadding } from "../../../shared/utils"
/* EndOfAtt -> Number: 5943 => "OnChange" interval: default PVT output rate
  This block marks the end of transmission of all GNSS-attitude related blocks 
  belonging to the same epoch.

  EndOfAtt -------------------------------------------------------------
  Block fields           Type    Units Do-Not-Use  Description
  Padding                uint                      Padding bytes
*/
const PADDING_INDEX = 0

type EndOfAtt = {
  padding: number | null
}

interface Response extends SBFBodyData {
  body: EndOfAtt
}

export const endOfAtt = (blockRevision: number, data: Buffer): Response => {
  const name = 'EndOfAtt'
  const PADDING_LENGTH = data.subarray(PADDING_INDEX).length
  const body: EndOfAtt = {
    padding: getPadding(data, PADDING_INDEX, PADDING_LENGTH),
  }
  return { name, body }
}