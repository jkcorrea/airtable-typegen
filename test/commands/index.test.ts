/* eslint-disable @typescript-eslint/no-empty-function */
import { test } from '@oclif/test'
import fse from 'fs-extra'
import fs from 'node:fs'

import { AIRTABLE_API_BASE, AIRTABLE_API_BASE_META_PATH, AIRTABLE_API_VERSION } from '../../src/utils/constants'

import basesMeta from '../fixtures/bases-meta.json'
import tablesMeta from '../fixtures/tables-meta.json'

jest.mock('fs-extra')

const mockedWriteFile = jest.mocked(fse.writeFile, { shallow: true })

const tableMetaPrefix = `${AIRTABLE_API_VERSION}${AIRTABLE_API_BASE_META_PATH}`

const tsGeneratedFile = fs.readFileSync('test/fixtures/ts-generated.ts.txt', 'utf-8')
const zodGeneratedFile = fs.readFileSync('test/fixtures/zod-generated.ts.txt', 'utf-8')

describe('e2e', () => {
  const baseId = basesMeta.bases[0].id
  process.env.AIRTABLE_TYPEGEN_ACCESS_TOKEN = 'my-secret-token'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test
    .nock(AIRTABLE_API_BASE, { allowUnmocked: false }, (api) => {
      api.get(tableMetaPrefix).reply(200, basesMeta)
      api.get(`${tableMetaPrefix}/${baseId}/tables`).reply(200, tablesMeta)
    })
    .stdout()
    .command(['.', baseId])
    .it('successfuly generates typescript interfaces', () => {
      expect(mockedWriteFile.mock.calls).toHaveLength(1)
      expect(mockedWriteFile.mock.lastCall?.[0]).toContain('apartments.ts')
      expect(mockedWriteFile.mock.lastCall?.[1].toString().trim()).toBe(tsGeneratedFile.trim())
    })

  test
    .nock(AIRTABLE_API_BASE, { allowUnmocked: false }, (api) => {
      api.get(`${tableMetaPrefix}/${baseId}/tables`).reply(200, tablesMeta)
      api.get(tableMetaPrefix).reply(200, basesMeta)
    })
    .stdout()
    .command(['.', baseId, '-z'])
    .it('successfuly generates zod schemas', () => {
      expect(mockedWriteFile.mock.calls).toHaveLength(1)
      expect(mockedWriteFile.mock.lastCall?.[0]).toContain('apartments.ts')
      expect(mockedWriteFile.mock.lastCall?.[1].toString().trim()).toBe(zodGeneratedFile.trim())
    })
})
