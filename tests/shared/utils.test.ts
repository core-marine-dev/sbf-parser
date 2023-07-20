import { crc16xmodem } from 'crc'
import { bitState, computedCRC, getNullableValue, getPadding } from '../../src/shared/utils'

describe('Test shared utils', () => {
  test('computedCRC', () => {
    const buffer = Buffer.from([0, 1, 2, 3, 4])
    const crc = crc16xmodem(buffer)
    expect(computedCRC(buffer)).toBe(crc)
  }),

  test('bitState', () => {
    const number = 0b11001010
    expect(bitState(number, 0)).toBeFalsy()
    expect(bitState(number, 1)).toBeTruthy()
    expect(bitState(number, 2)).toBeFalsy()
    expect(bitState(number, 3)).toBeTruthy()
    expect(bitState(number, 4)).toBeFalsy()
    expect(bitState(number, 5)).toBeFalsy()
    expect(bitState(number, 6)).toBeTruthy()
    expect(bitState(number, 7)).toBeTruthy()
  }),

  test('getPadding', () => {
    const buffer = Buffer.from([0, 1, 2, 3, 4])
    let index = 0
    let length = 0
    for (let index = 0; index < buffer.byteLength; index ++) {
      const subLength = buffer.byteLength - index
      for (let length = 0; length < subLength; length++) {
        const result = getPadding(buffer, index, length)
        if (length === 0) {
          expect(result).toBeNull()
        } else {
          expect(result).toBe(buffer.readUIntLE(index, length))
        }
      }
    }
  }),

  test('getNullableValue', () => {
    let value: any = null
    const callback = (e: string) => e.toUpperCase()
    let result = getNullableValue(value, callback)
    expect(result).toBeNull()
    value = 'hello there'
    result = getNullableValue(value, callback)
    expect(result).toBe(value.toUpperCase())
  })
})