import { Padding, SBFBodyData } from "../../../shared/types"
import { getPadding } from "../../../shared/utils"
/* EndOfPVT -> Number: 5921 => "OnChange" interval: default PVT output rate
  This block marks the end of transmission of all PVT related blocks 
  belonging to the same epoch.

  EndOfAtt -------------------------------------------------------------
  Block fields           Type    Units Do-Not-Use  Description
  Padding                uint                      Padding bytes
*/
const PADDING_INDEX = 0

export type EndOfPVT = {
  padding: Padding
}

interface Response extends SBFBodyData {
  body: EndOfPVT
}

export const endOfPVT = (blockRevision: number, data: Buffer): Response => {
  const name = 'EndOfPVT'
  const PADDING_LENGTH = data.subarray(PADDING_INDEX).length
  const body: EndOfPVT = {
    padding: getPadding(data, PADDING_INDEX, PADDING_LENGTH),
  }
  return { name, body }
}