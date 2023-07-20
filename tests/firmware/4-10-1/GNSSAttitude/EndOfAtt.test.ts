import { endOfAtt } from '../../../../src/firmware/4-10-1/GNSSAttitude/EndOfAtt' 
/* EndOfAtt -> Number: 5943 => "OnChange" interval: default PVT output rate
  This block marks the end of transmission of all GNSS-attitude related blocks 
  belonging to the same epoch.

  EndOfAtt -------------------------------------------------------------
  Block fields           Type    Units Do-Not-Use  Description
  Padding                uint                      Padding bytes
*/
describe('Testing EndOfAtt', () => {
  test('Regular body', () => {
    const frameName = 'EndOfAtt'
    const { name, body } = endOfAtt(0, Buffer.from([]))
    expect(name).toBe(frameName)
    expect(body.padding).toBeNull()
  })
  test('Padding length', () => {
    const { body: body1 } = endOfAtt(0, Buffer.from([]))
    expect(body1.padding).toBeNull()
    const { body: body2 } = endOfAtt(0, Buffer.from([23, 45, 78]))
    expect(body2.padding).not.toBeNull()
  })
})
