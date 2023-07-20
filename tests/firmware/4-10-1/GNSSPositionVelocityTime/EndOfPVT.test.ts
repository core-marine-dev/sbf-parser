import { endOfPVT } from '../../../../src/firmware/4-10-1/GNSSPositionVelocityTime/EndOfPVT'
/* EndOfPVT -> Number: 5921 => "OnChange" interval: default PVT output rate
  This block marks the end of transmission of all PVT related blocks 
  belonging to the same epoch.

  EndOfAtt -------------------------------------------------------------
  Block fields           Type    Units Do-Not-Use  Description
  Padding                uint                      Padding bytes
*/
describe('Testing EndOfPVT', () => {
  test('Regular body', () => {
    const frameName = 'EndOfPVT'
    const { name, body } = endOfPVT(0, Buffer.from([]))
    expect(name).toBe(frameName)
    expect(body.padding).toBeNull()
  })
  test('Padding length', () => {
    const data1 = Buffer.from([])
    const { body: body1 } = endOfPVT(0, data1)
    expect(body1.padding).toBeNull()
    const data2 = Buffer.from([23, 45, 78])
    const { body: body2 } = endOfPVT(0, data2)
    expect(body2.padding).not.toBeNull()
    expect(body2.padding).toBe(data2.readUIntLE(0, data2.length))
  })
})