# SBF Parser

**SBF Parser** is a library to read SBF data from Septentrio devices.

> SBF is private binary protocol of Septentrio trademark which uses in its own GNSS devices.

Firmwares and frames implemented:

<details>
  <summary>4.10.1</summary>

  - [x] GNSS Attitude
    - [x] AttCovEuler
    - [x] AttEuler
    - [x] AuxAntPositions
    - [x] EndOfAtt

  - [ ] GNSS Position Velocity Time
    - [ ]  PVTCartesian
    - [x]  PVTGeodetic - Revision 2
    - [ ]  PosCovCartesian
    - [ ]  PosCovGeodetic
    - [ ]  VelCovCartesian
    - [ ]  VelCovGeodetic
    - [x]  DOP
    - [ ]  PosCart
    - [ ]  PosLocal
    - [ ]  PosProjected
    - [ ]  BaseVectorCart
    - [ ]  BaseVectorGeod
    - [x]  PVTSupport
    - [x]  PVTSupportA
    - [x]  EndOfPVT

  - [x]  Receiver Time
    - [x]  Receiver Time
    - [x]  xPPPSOffset

</details>

## API

This library has two access points:

1. `availableFirmwares()` -> string[] firmwares
2. `SBFParser([firmware: Firmware = '4.10.1', memory: boolean = false])` -> Parser Object

First function is to get available firmwares supported by the library.

Second is the Parser class to work with. It has three public attributes, and two methods.

Attributes:

- `firmware` -> firmware setted
- `memory` -> memory setted
- `bufferLimit` -> maximum internal buffer data in bytes supported
- `bufferSize` (read only) -> internal buffer data storage

Methods:

- `addData(data: Buffer)` -> To add data
- `getFrames(): SBFResponse[]` -> To get parsed frames. It returns an array of `SBFResponse` objects

## How to use it

This is important

### 1. Importing parser

First of all, import the parser

```typescript
import { SBFParser } from 'sbf-parser'
```

### 2. Creating an instance

Then you should instance a new parser object with one of this three ways

The constructor is this

```typescript
SBFParser([firmware: Firmware = '4.10.1', memory: boolean = false])
```

1. `firmware` (`'4.10.1'` by default) is an string parameter with one of the supported firmwares
    To know supported firmwares just consult with

    ```typescript
    import { availableFirmwares } from 'sbf-parser'
    const firmwares = availableFirmwares()
    ```

2. `memory` (disabled by default) is a boolean parameter to enable or disable memory
    - memory = false -> each time data is added, it clear internal buffer and add new one data
    - memory = true -> each time data is added, it is attached to the internal buffer

So the constructor could be of this three options:

- `const parser = new SBFParser()` -> firmware = `'4.10.1'`, memory = `false`
- `const parser = new SBFParser(fw)` -> firmware = `fw`, memory = `false`
- `const parser = new SBFParser(fw, mem)` -> firmware = `fw`, memory = `mem`

### 3. Adding data

You can enable or disable `memory` whatever you want. If you enable it, you can add many times and then parsed when you need it. If you have `memory` disabled, each time you add data it will overwrite the previous data.

```typescript
parser.memory = true
parser.memory = false
```

Data added have to be a `Buffer` instance or you get an exception.

```typescript
const data1 = Buffer.from([...])
const data2 = Buffer.from([...])
// ...
parser.addData(data1)
parser.addData(data2)
// ...
```

### 4. Parsing data

Each time data is added, internally it is parsed. So `parser.bufferLength` is the remained data that cannot be parsed, maybe because is incompleted.

To get parsed frames is just

```typescript
const frames = parser.getFrames()
```

Parsed frames are an array of objects, `SBFResponse[]`, where each object, `SBFResponse` is like this

```typescript
type SBFResponse = {
  name: string,
  number: number,
  version: number,
  frame: SBFFrame,
  buffer: Buffer,
}

type SBFFrame = {
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
```

When you get the parsed frames from the data, they are removed from parser objects.

```typescript
parser.addData(data)
parser.getFrames().length // return x
parser.getFrames().length // return 0
```

## Notes

`bufferLimit` it is used to stored an incompleted frame if `memory` is enabled. So you can add the needed it data later.

`bufferLimit` is set to 65535 bytes which is more than enough to store an incompleted frame.

It is not recommended you change its value if you don't understand well the protocol SBF or how it works.
