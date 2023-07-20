import 'gpstime'

declare module 'gpstime' {
  let wnTowToGpsTimestamp: (wn: number, tow: number) => Date

  export { wnTowToGpsTimestamp }
}