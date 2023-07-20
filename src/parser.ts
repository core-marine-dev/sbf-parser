import {
  BODY_INDEX,
  CRC_INDEX,
  CRC_LENGTH,
  DO_NOT_USE_TOW,
  DO_NOT_USE_WNC,
  HEADER_LENGTH,
  ID_INDEX,
  LENGTH_INDEX,
  LENGTH_LENGTH,
  MINIMAL_FRAME_LENGTH,
  SYNC_FLAG_BUFFER, TIME_LENGTH, TOW_INDEX, TOW_LENGTH, TWO_BYTES_MAX, WNC_INDEX, WNC_LENGTH
} from "./shared/constants"
import { Firmware, SBFBodyData, SBFBodyDataParser, SBFFrame, SBFHeader, SBFID, SBFParser, SBFParsingStatus, SBFResponse, SBFTime } from "./shared/types"
import { computedCRC } from "./shared/utils"
import { getFirmareParser, getFirmwares, isAvailableFirmware, throwFirmwareError } from "./firmware"
import { wnTowToGpsTimestamp } from 'gpstime'

export class Parser implements SBFParser {
  // Internal Buffer
  protected _buffer: Buffer = Buffer.from([])
  get bufferLength() { return this._buffer.byteLength }

  protected _bufferLimit: number = TWO_BYTES_MAX
  get bufferLimit() { return this._bufferLimit }
  set bufferLimit(limit: number) {
    if (typeof limit !== 'number') throw new Error('limit has to be a number')
    if (limit < 0) throw new Error('limit has to be a positive integer')
    if (limit < 1) throw new Error('limit has to be a positive integer greater than zero')
    this._bufferLimit = Math.trunc(limit)
    this.setBuffer()
  }
  // Internal Parsed Frames
  protected _frames: SBFResponse[] = []
  // Firmware
  protected _firmware: Firmware = '4.10.1'
  protected _parser: SBFBodyDataParser = getFirmareParser(this._firmware)
  get firmware() { return this._firmware }
  set firmware(fw: Firmware) {
    if (typeof fw !== 'string') throw new Error('firmware has to be a string')
    if (!isAvailableFirmware(fw)) throwFirmwareError(fw)
    this._firmware = fw
    this._parser = getFirmareParser(fw)
  }
  // Memory
  protected _memory: boolean = false
  get memory() { return this._memory }
  set memory(mem: boolean) {
    if (typeof mem !== 'boolean') throw new Error('memory has to be boolean')
    this._memory = mem
  }

  constructor(firmware: Firmware = '4.10.1', memory: boolean = false) {
    this.firmware = firmware
    this.memory = memory
  }

  getAvailableFirmwares(): Firmware[] {
    return getFirmwares()
  }
  
  addData(data: Buffer) {
    // Check input data is Buffer
    if (!Buffer.isBuffer(data)) { throw new Error('data has to be a Buffer') }
    // Add data
    this._buffer = (this._memory) ? Buffer.concat([this._buffer, data]) : data
    // Parse data
    this.parseData()
  }

  getFrames(): SBFResponse[] {
    const frames = structuredClone(this._frames)
    this._frames = []
    return frames
  }

  protected parseData() {
    let frames = [] as SBFResponse[]
    let pivot = 0
    // Get last Index
    const lastIndex = this._buffer.lastIndexOf(SYNC_FLAG_BUFFER)
    do {
      // Get start of next frame
      const index = this._buffer.indexOf(SYNC_FLAG_BUFFER, pivot)
      if (index === -1) {
        this._buffer = Buffer.from([])
        break
      }
      // Refactor buffer
      const buffer = this._buffer.subarray(index)
      // Check buffer has the minimun length
      if (buffer.length < MINIMAL_FRAME_LENGTH) {
        console.debug(`parseData: Not enough data get a frame`)
        this._buffer = this._buffer.subarray(lastIndex)
        break
      }
      // Get frame
      const { status, frame: sbfFrame } = this.getSBFFrame(buffer)
      // Correct frame
      if (status === SBFParsingStatus.OK) {
        frames.push(sbfFrame)
        pivot = index + sbfFrame.buffer.length
        continue
      }
      // Incomplete frame and last incomplete frame
      if (status === SBFParsingStatus.MISSING_BYTES && index === lastIndex) {
        this._buffer = this._buffer.subarray(lastIndex)
        break
      }
      // pivot = index + SYNC_LENTGH
      pivot = index + 1
    } while (true)
    // Update frames
    this.updateFrames(frames)
    // Limit buffer
    this.setBuffer()
  }

  protected getSBFFrame(buffer: Buffer): { status: SBFParsingStatus, frame: SBFResponse } {
    let status: SBFParsingStatus = SBFParsingStatus.OK
    let sbfFrame: SBFResponse = {} as SBFResponse
    // HEADER
    const header = this.getHeader(buffer)
    sbfFrame.frame = { header } as SBFFrame
    // Check length
    const frameLength = header.length
    if (buffer.length < frameLength) {
      console.debug('getSBFFrame: SBF Frame is incomplete')
      status = SBFParsingStatus.MISSING_BYTES
      return { status, frame: sbfFrame }
    }
    if ((frameLength % 4) !== 0) {
      console.debug('getSBFFrame: SBF Frame length is wrong')
      status = SBFParsingStatus.ERROR_LENGTH
      return { status, frame: sbfFrame }
    }
    const bodyLength = frameLength - (HEADER_LENGTH + TIME_LENGTH)
    const frameBuffer = buffer.subarray(0, frameLength)
    sbfFrame.buffer = frameBuffer
    // Check CRC
    const crc = this.getCalculatecCRC(frameBuffer, bodyLength)
    if (crc !== header.crc) {
      console.debug(`getSBFFrame: Invalid CRC - should be ${header.crc} -> get it ${crc}`)
      status = SBFParsingStatus.ERROR_CRC
      return { status, frame: sbfFrame }
    }
    // TIME
    const time = this.getTime(frameBuffer)
    sbfFrame.frame.time = time
    // BODY
    sbfFrame.number = header.id.blockNumber
    sbfFrame.version = header.id.blockRevision
    const bodyBuffer = frameBuffer.subarray(BODY_INDEX, BODY_INDEX + bodyLength)
    const { name, body } = this.getBodyData(header.id.blockNumber, header.id.blockRevision, bodyBuffer)
    sbfFrame.name = name
    sbfFrame.frame.body = body
    return { status, frame: sbfFrame }
  }

  protected getNumberVersion(id: Buffer): SBFID {
    // ID = 16 bits = 2 bytes
    // 00-12 bits -> block number
    // 13-15 bits -> block version
    const number0 = id[0]
    const number1 = id[1] & 0b00011111
    const number = Buffer.from([number0, number1]).readUInt16LE()
    const revisionByte = (id[1] & 0b11100000) >>> 5
    const revision = Buffer.from([revisionByte]).readUIntLE(0, 1)
    return {
      blockNumber: number,
      blockRevision: revision
    }
  }

  protected getCalculatecCRC(frame: Buffer, bodyLength: number) {
    const start = ID_INDEX
    const end = BODY_INDEX + bodyLength
    const rawData = frame.subarray(start, end)
    return computedCRC(rawData)
  }

  protected getHeader(data: Buffer): SBFHeader {
    // 00-01 bytes -> Sync    char
    // 02-03 bytes -> CRC     uint16 LE
    // 04-05 bytes -> ID      uint16 LE
    // 06-07 bytes -> Length  uint16 LE
    // 08-.. bytes -> Rest    bytes
    const sync = data.toString('ascii', 0, CRC_INDEX)
    const crc = data.readUIntLE(CRC_INDEX, CRC_LENGTH)
    const idBuffer = data.subarray(ID_INDEX, LENGTH_INDEX)
    const id = this.getNumberVersion(idBuffer)
    const length = data.readUIntLE(LENGTH_INDEX, LENGTH_LENGTH)
    return { sync, crc, id, length }
  }

  protected getTime(data: Buffer): SBFTime {
    // 08-11 bytes -> TOW     uint32 LE | Do-Not-Use = 4294967295
    // 12-13 bytes -> WNc     uint16 LE | Do-Not-Use = 65535
    // 14-.. bytes -> Body
    const tow = data.readUIntLE(TOW_INDEX, TOW_LENGTH)
    const wnc = data.readUIntLE(WNC_INDEX, WNC_LENGTH)
    const time: SBFTime = {
      tow: (tow !== DO_NOT_USE_TOW) ? tow : null,
      wnc: (wnc !== DO_NOT_USE_WNC) ? wnc : null,
      timestamp: null,
      date: null
    }
    if (time.tow !== null && time.wnc !== null) {
      const date = wnTowToGpsTimestamp(wnc, tow)
      time.timestamp = date.getTime()
      time.date = date.toISOString()
    }
    return time
  }

  protected getBodyData(blockNumber: number, blockRevision: number, payload: Buffer): SBFBodyData {
    return this._parser(blockNumber, blockRevision, payload)
  }

  protected updateFrames(frames: SBFResponse[]) {
    if (frames.length > 0) {
      this._frames = (this._memory) ? this._frames.concat(frames) : frames
    }
  }

  protected setBuffer() {
    if (this._buffer.length > this._bufferLimit) {
      this._buffer = this._buffer.subarray(-this._bufferLimit)
    }
  }
}
