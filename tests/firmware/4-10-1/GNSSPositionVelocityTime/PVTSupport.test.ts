import { ptvSupport } from '../../../../src/firmware/4-10-1/GNSSPositionVelocityTime/PVTSupport'
/* PVTSupport -> Number: 4076 => "OnChange" interval: default PVT output rate
  This block contains various internal parameters that can be used for
  maintenance and support.

  The detailed definition of this block is not available.

  EndOfAtt -------------------------------------------------------------
  UNKNOWN
*/
describe('Testing EndOfPVT', () => {
  test('Regular body', () => {
    const frameName = 'PVTSupport'
    const data = Buffer.from([])
    const { name, body } = ptvSupport(0, data)
    expect(name).toBe(frameName)
    expect(body).toStrictEqual(data)
  })
})