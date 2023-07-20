export type SBFFrame = {
  header: SBFHeader,
  time: SBFTime,
  body: SBFBody,
}

export type SBFHeader = {
  sync: string,
  crc: number,
  id: SBFID,
  length: number
}

export type SBFID = {
  blockNumber: number,
  blockRevision: number
}

export interface SBFTime {
  tow: number | null,
  wnc: number | null,
  timestamp?: number | null,
  date?: string | null
}

export type SBFBody = object | null

export type Padding = number | null

export type SBFResponse = {
  name: string,
  number: number,
  version: number,
  frame: SBFFrame,
  buffer: Buffer,
}

export interface SBFBodyData {
  name: string,
  body: SBFBody
}

export const enum SBFParsingStatus {
  OK,
  MISSING_BYTES,
  ERROR_LENGTH,
  ERROR_CRC,
}

export type SBFBodyDataParser = (blockNumber: number, blockRevision: number, data: Buffer) => SBFBodyData
export type SBFBodyDataBlockParser = (blockRevision: number, data: Buffer) => SBFBodyData
export type SBFBodyDataMap = Map<number, SBFBodyDataBlockParser>

export type Firmware = `${number}.${number}.${number}` | `${number}.${number}` | `${number}`

export interface SBFParser {
  getAvailableFirmwares(): Firmware[]
  addData(data: Buffer): void,
  getFrames(): SBFResponse[]
}