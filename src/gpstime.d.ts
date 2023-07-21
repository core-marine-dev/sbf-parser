import 'gpstime'

declare module 'gpstime' {
  export const wnTowToGpsTimestamp: (wn: number, tow: number) => Date
}