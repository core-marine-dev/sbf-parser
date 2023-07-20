import { TypeData, getTypedData } from "./utils"

describe('Test typed data', () => {
  const num = -945645646.84546464646456465
  
  test('int8', () => {
    const data = getTypedData(num, TypeData.INT8)
    if (data !== null) {
      const { number, buffer } = data
      expect(number).toBe(buffer.readInt8())
    }
  })
  test('int16', () => {
    const data = getTypedData(num, TypeData.INT16)
    if (data !== null) {
      const { number, buffer } = data
      expect(number).toBe(buffer.readInt16LE())
    }
  })
  test('int32', () => {
    const data = getTypedData(num, TypeData.INT32)
    if (data !== null) {
      const { number, buffer } = data
      expect(number).toBe(buffer.readInt32LE())
    }
    // expect(data).toBe(null)
  })
  test('int64', () => {
    const data = getTypedData(num, TypeData.INT64)
    if (data !== null) {
      const { number, buffer } = data
      expect(number).toBe(buffer.readBigInt64LE())
    }
    // expect(data).toBe(null)
  })
  test('uint8', () => {
    const data = getTypedData(num, TypeData.UINT8)
    if (data !== null) {
      const { number, buffer } = data
      expect(number).toBe(buffer.readUInt8())
    }
  })
  test('uint16', () => {
    const data = getTypedData(num, TypeData.UINT16)
    if (data !== null) {
      const { number, buffer } = data
      expect(number).toBe(buffer.readUInt16LE())
    }
  })
  test('uint32', () => {
    const data = getTypedData(num, TypeData.UINT32)
    if (data !== null) {
      const { number, buffer } = data
      expect(number).toBe(buffer.readUInt32LE())
    }
    // expect(data).toBe(null)
  })
  test('uint64', () => {
    const data = getTypedData(num, TypeData.UINT64)
    // if (data !== null) {
    //   const { number, buffer } = data
    //   expect(number).toBe(buffer.readBigUInt64LE())
    // }
    expect(data).toBe(null)
  })
  test('float', () => {
    const data = getTypedData(num, TypeData.FLOAT)
    if (data !== null) {
      const { number, buffer } = data
      expect(number).toBe(buffer.readFloatLE())
    }
  })
  test('double', () => {
    const data = getTypedData(num, TypeData.DOUBLE)
    if (data !== null) {
      const { number, buffer } = data
      expect(number).toBe(buffer.readDoubleLE())
    }
  })
})