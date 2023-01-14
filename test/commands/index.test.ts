/* eslint-disable @typescript-eslint/no-empty-function */
import { test } from '@oclif/test'
import fse from 'fs-extra'
import fs from 'node:fs'

import { AIRTABLE_API_BASE, AIRTABLE_API_BASE_META_PATH, AIRTABLE_API_VERSION } from '../../src/utils/constants'
import * as schemas from '../fixtures/output/product-catalog-zod'

import basesMeta from '../fixtures/api/bases-meta.json'
import productCatalogData from '../fixtures/api/product-catalog-data.json'
import tablesMeta from '../fixtures/api/tables-meta.json'

jest.mock('fs-extra')

const mockedWriteFile = jest.mocked(fse.writeFile, { shallow: true })

const tableMetaPrefix = `${AIRTABLE_API_VERSION}${AIRTABLE_API_BASE_META_PATH}`

/** Normalize line endings so we can compare on Windows & Unix */
const nrmlz = (str: string, normalized = '\r\n') => str.replace(/\r?\n/g, normalized)

const tsGeneratedSrc = nrmlz(fs.readFileSync('test/fixtures/output/product-catalog-ts.ts', 'utf-8'))
const zodGeneratedSrc = nrmlz(fs.readFileSync('test/fixtures/output/product-catalog-zod.ts', 'utf-8'))

// So that the command doesn't complain about missing env var
process.env.AIRTABLE_TYPEGEN_ACCESS_TOKEN = 'my-secret-token'

describe('e2e', () => {
  // Pull the base ID from the fixtures
  const baseMeta = basesMeta.bases[2]
  const baseId = baseMeta.id

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
    .it('Successfuly generates TypeScript interfaces', () => {
      expect(mockedWriteFile.mock.calls).toHaveLength(1)
      expect(mockedWriteFile.mock.lastCall?.[0]).toContain('product-catalog.ts')
      expect(nrmlz(mockedWriteFile.mock.lastCall?.[1].toString() ?? '')).toBe(tsGeneratedSrc)
    })

  test
    .nock(AIRTABLE_API_BASE, { allowUnmocked: false }, (api) => {
      api.get(`${tableMetaPrefix}/${baseId}/tables`).reply(200, tablesMeta)
      api.get(tableMetaPrefix).reply(200, basesMeta)
    })
    .stdout()
    .command(['.', baseId, '-z'])
    .it('Successfuly generates Zod schemas', () => {
      expect(mockedWriteFile.mock.calls).toHaveLength(1)
      expect(mockedWriteFile.mock.lastCall?.[0]).toContain('product-catalog.ts')
      expect(nrmlz(mockedWriteFile.mock.lastCall?.[1].toString() ?? '')).toBe(zodGeneratedSrc)
    })

  test.it('Zod schema parses Airtable API response', async () => {
    expect(async () => {
      for (const rec of productCatalogData.records) {
        schemas.FurnitureSchema.parse(rec.fields)
      }
    }).not.toThrow()
  })
})
