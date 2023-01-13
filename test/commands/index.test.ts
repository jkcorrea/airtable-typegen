import { test } from '@oclif/test'
import { expect } from 'chai'
import fs from 'node:fs'
import sinon, { SinonStub } from 'sinon'

import { AIRTABLE_API_BASE, AIRTABLE_API_BASE_META_PATH, AIRTABLE_API_VERSION } from '../../src/utils/constants'

import basesMeta from '../fixtures/bases-meta.json'
import tablesMeta from '../fixtures/tables-meta.json'

const tableMetaPrefix = `${AIRTABLE_API_VERSION}${AIRTABLE_API_BASE_META_PATH}`

const tsGeneratedFile = fs.readFileSync('test/fixtures/ts-generated.ts.txt', 'utf-8')
const zodGeneratedFile = fs.readFileSync('test/fixtures/zod-generated.ts.txt', 'utf-8')

describe('e2e', () => {
  const baseId = basesMeta.bases[0].id
  process.env.AIRTABLE_TYPEGEN_ACCESS_TOKEN = 'my-secret-token'

  test
    .nock(AIRTABLE_API_BASE, { allowUnmocked: false }, (api) => {
      api.get(tableMetaPrefix).reply(200, basesMeta)
      api.get(`${tableMetaPrefix}/${baseId}/tables`).reply(200, tablesMeta)
    })
    .stub(fs, 'writeFile', sinon.stub())
    .stdout()
    .command(['.', baseId])
    .it('successfuly generates typescript interfaces', () => {
      const stubWrite = fs.writeFile as unknown as SinonStub
      expect(stubWrite.calledOnceWith('apartments.ts', tsGeneratedFile))
    })

  test
    .nock(AIRTABLE_API_BASE, { allowUnmocked: false }, (api) => {
      api.get(`${tableMetaPrefix}/${baseId}/tables`).reply(200, tablesMeta)
      api.get(tableMetaPrefix).reply(200, basesMeta)
    })
    .stub(fs, 'writeFile', sinon.stub())
    .stdout()
    .command(['.', baseId, '-z'])
    .it('successfuly generates zod schemas', () => {
      const stubWrite = fs.writeFile as unknown as SinonStub
      expect(stubWrite.calledOnceWith('apartments.ts', zodGeneratedFile))
    })
})
