import { Parser } from '../src/parser'
import { CRC_INDEX, LENGTH_INDEX, TOW_INDEX, TWO_BYTES_MAX } from '../src/shared/constants'
import { Firmware, SBFFrame, SBFResponse } from '../src/shared/types'

describe('Testing Parser', () => {
  const getSampleFrame = (): { frame: SBFFrame, buffer: Buffer } => {
    // Frame DOP -> 4001.0
    const frame: SBFFrame = {
      header: {
        sync: "$@",
        crc: 25430,
        id: {
          blockNumber: 4001,
          blockRevision: 0
        },
        length: 32
      },
      time: {
        tow: 380224000,
        wnc: 2264,
        timestamp: 2065456000000,
        date: "2035-06-14T17:46:40.000Z"
      },
      body: {
        nrSV: 15,
        reserved: 0,
        pDOP: 1.56,
        tDOP: 0.95,
        hDOP: 0.85,
        vDOP: 1.31,
        hpl: 32.8122444152832,
        vpl: 26.977102279663086,
        padding: null
      }
    }
    const buffer = Buffer.from([36, 64, 86, 99, 161, 15, 32, 0, 0, 194, 169, 22, 216, 8, 15, 0, 156, 0, 95, 0, 85, 0, 131, 0, 189, 63, 3, 66, 27, 209, 215, 65])
    return { frame, buffer }
  }

  test('Default', () => {
    let firmware: Firmware = '4.10.1'
    let memory = false
    let parser = new Parser()
    expect(parser.memory).toBe(memory)
    expect(parser.firmware).toBe(firmware)
    // Change memory
    memory = true
    parser.memory = memory
    expect(parser.memory).toBe(memory)
    // Same with constructor
    parser = new Parser(firmware, memory)
    expect(parser.memory).toBe(memory)
    expect(parser.firmware).toBe(firmware)
    // Buffer limit
    expect(parser.bufferLength).toBe(0)
    expect(parser.bufferLimit).toBe(TWO_BYTES_MAX)
  })

  test('Firmware', () => {
    let firmware: any = 45
    expect(() => new Parser(firmware)).toThrow()
    firmware = 'alskgj'
    expect(() => new Parser(firmware)).toThrow()
    const firmwares: Firmware[] = ['4.10.1']
    expect(new Parser().getAvailableFirmwares()).toStrictEqual(firmwares)
  })

  test('Adding Data', () => {
    let frames: SBFResponse[]
    const { frame, buffer } = getSampleFrame()
    const pivot = Math.trunc(buffer.byteLength / 2)
    const firstHalf = buffer.subarray(0, pivot)
    const secondHalf = buffer.subarray(pivot)
    // Parser
    const sbf = new Parser()
    // No Memory
    sbf.memory = false
    sbf.addData(buffer)
    expect(sbf.bufferLength).toBe(0)
    frames = sbf.getFrames()
    expect(frames.length).toBe(1)
    expect(frames[0].frame).toMatchObject(frame)
    
    sbf.addData(firstHalf)
    frames = sbf.getFrames()
    expect(frames.length).toBe(0)
    expect(sbf.bufferLength).toBe(pivot)
    
    sbf.addData(secondHalf)
    expect(sbf.bufferLength).toBe(0)
    frames = sbf.getFrames()
    expect(frames.length).toBe(0)
    
    // Memory
    sbf.memory = true
    sbf.addData(buffer)
    expect(sbf.bufferLength).toBe(0)
    frames = sbf.getFrames()
    expect(frames.length).toBe(1)
    
    sbf.addData(firstHalf)
    expect(sbf.bufferLength).toBe(pivot)
    frames = sbf.getFrames()
    expect(frames.length).toBe(0)
    
    sbf.addData(secondHalf)
    expect(sbf.bufferLength).toBe(0)
    frames = sbf.getFrames()
    expect(frames.length).toBe(1)
    expect(frames[0].frame).toMatchObject(frame)
  })

  test('Error parsing', () => {
    // Parser
    const sbf = new Parser()
    sbf.memory = false
    // Frames
    let frames: SBFResponse[]
    // Example frame
    const { frame, buffer } = getSampleFrame()
    // Not enough data
    const notMinimalData = buffer.subarray(0, TOW_INDEX)
    sbf.addData(notMinimalData)
    frames = sbf.getFrames()
    expect(frames.length).toBe(0)
    // Incomplete Frame
    const incomplete = buffer.subarray(0, buffer.byteLength - 2)
    sbf.addData(incomplete)
    frames = sbf.getFrames()
    expect(frames.length).toBe(0)
    // Length is wrong
    const wrongLength = Buffer.from(buffer)
    const wrongLength16 = new Uint16Array([frame.header.length - 2])
    const wrongLenght8 = new Uint8Array(wrongLength16.buffer, wrongLength16.byteOffset, wrongLength16.byteLength)
    wrongLength[LENGTH_INDEX] = wrongLenght8[0]
    wrongLength[LENGTH_INDEX + 1] = wrongLenght8[1]
    sbf.addData(wrongLength)
    frames = sbf.getFrames()
    expect(frames.length).toBe(0)
    // Length is not multiple of 4
    const not4multipleLength = Buffer.from(buffer)
    const not4multipleLength16 = new Uint16Array([frame.header.length - 2])
    const not4multipleLength8 = new Uint8Array(not4multipleLength16.buffer, not4multipleLength16.byteOffset, not4multipleLength16.byteLength)
    not4multipleLength[LENGTH_INDEX] = not4multipleLength8[0]
    not4multipleLength[LENGTH_INDEX + 1] = not4multipleLength8[1]
    sbf.addData(not4multipleLength)
    frames = sbf.getFrames()
    expect(frames.length).toBe(0)
    // CRC is wrong
    const crcError = Buffer.from(buffer)
    const crc16 = new Uint16Array([frame.header.crc - 1])
    const crc8 = new Uint8Array(crc16.buffer, crc16.byteOffset, crc16.byteLength)
    crcError[CRC_INDEX] = crc8[0]
    crcError[CRC_INDEX + 1] = crc8[1]
    sbf.addData(crcError)
    frames = sbf.getFrames()
    expect(frames.length).toBe(0)
  })

  test('Max buffer', () => {
    // Parser
    const sbf = new Parser()
    sbf.memory = true
    expect(sbf.bufferLimit).toBe(TWO_BYTES_MAX)
    sbf.bufferLimit = 16
    expect(sbf.bufferLimit).toBe(16)
    // Frames
    let frames: SBFResponse[]
    // Example frame
    const { frame, buffer } = getSampleFrame()
    // 
    const pivot = Math.trunc(buffer.byteLength / 2)
    const firstHalf = buffer.subarray(0, pivot)
    // const secondHalf = buffer.subarray(pivot)
    sbf.bufferLimit = pivot - 2
    sbf.addData(firstHalf)
    frames = sbf.getFrames()
    expect(frames.length).toBe(0)
    expect(sbf.bufferLength).toBe(pivot - 2)
  })
})