export type TypedData = {
  number: number,
  buffer: Buffer
}

export const enum TypeData {
  INT8,
  INT16,
  INT32,
  INT64,
  UINT8,
  UINT16,
  UINT32,
  UINT64,
  FLOAT,
  DOUBLE
}

export const getTypedData = (num: number, type: TypeData): TypedData | null => {
  let array
  let number: number = 0
  let buffer: Buffer = Buffer.from([])
  switch (type) {
    case TypeData.INT8:
      array = new Int8Array(1)
      array[0] = num
      buffer = Buffer.from(array.buffer, array.byteOffset, array.byteLength)
      number = buffer.readInt8()
      break
    case TypeData.INT16:
      array = new Int16Array(1)
      array[0] = num
      buffer = Buffer.from(array.buffer, array.byteOffset, array.byteLength)
      number = buffer.readInt16LE()
      break
    case TypeData.INT32:
      array = new Int32Array(1)
      array[0] = num
      buffer = Buffer.from(array.buffer, array.byteOffset, array.byteLength)
      number = buffer.readInt32LE()
      break
    // case TypeData.INT64:
    //   array = new BigInt64Array(1)
    //   buffer = Buffer.from(array.buffer, array.byteOffset, array.byteLength)
    //   number = buffer.readBigInt64LE()
    //   break
    case TypeData.UINT8:
      array = new Uint8Array(1)
      array[0] = num
      buffer = Buffer.from(array.buffer, array.byteOffset, array.byteLength)
      number = buffer.readUInt8()
      break
    case TypeData.UINT16:
      array = new Uint16Array(1)
      array[0] = num
      buffer = Buffer.from(array.buffer, array.byteOffset, array.byteLength)
      number = buffer.readUInt16LE()
      break
    case TypeData.UINT32:
      array = new Uint32Array(1)
      array[0] = num
      buffer = Buffer.from(array.buffer, array.byteOffset, array.byteLength)
      number = buffer.readUInt32LE()
      break
    // case TypeData.UINT64:
    //   array = new BigUint64Array(1)
      // buffer = Buffer.from(array.buffer, array.byteOffset, array.byteLength)
      // number = buffer.readBigUInt64LE()
    //   break
    case TypeData.FLOAT:
      array = new Float32Array(1)
      array[0] = num
      buffer = Buffer.from(array.buffer, array.byteOffset, array.byteLength)
      number = buffer.readFloatLE()
      break
    case TypeData.DOUBLE:
      array = new Float64Array(1)
      array[0] = num
      buffer = Buffer.from(array.buffer, array.byteOffset, array.byteLength)
      number = buffer.readDoubleLE()
      break
    default:
      return null
  }
  return { number, buffer }
}

export const enum RandomNumberType {
  'INT',
  'UINT',
  'FLOAT'
}

export const randomNumber = (type: RandomNumberType = RandomNumberType.INT, min: number = Number.MIN_SAFE_INTEGER, max: number = Number.MAX_SAFE_INTEGER): number => {
  const float = (Math.random() * max) + (Math.random() * min)
  if (type === RandomNumberType.FLOAT) return float
  const integer = Math.floor(float)
  if (type === RandomNumberType.INT) return integer
  return Math.abs(integer)
}