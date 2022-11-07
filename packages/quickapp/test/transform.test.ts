import { describe, expect, test } from 'vitest'
import { transformEscapESelector } from '../src/webpack'

describe.skip('transformer', () => {
  test('transformEscapESelector', () => {
    const test1 = '\n    "w-1.4",\n    "flex:col",\n    "w-1/3",\n    "90%",\n    "flex!row"\n  '
    const result = '\n    "w-1-d-4",\n    "flex-c-col",\n    "w-1-s-3",\n    "90-p-",\n    "flex-e-row"\n  '
    const res = transformEscapESelector(test1)
    // eslint-disable-next-line no-console
    console.log('res', res)
    expect(res).toBe(result)
  })
})
