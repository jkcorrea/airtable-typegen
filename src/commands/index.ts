import { Command, Flags } from '@oclif/core'
import { paramCase, pascalCase } from 'change-case'
import * as dotenv from 'dotenv'
import fs from 'fs-extra'
import path from 'node:path'

import { BaseListMetadataSchema, BaseMetadata, TableListMetadataSchema, TableMetadata } from '../schemas/api'
import { AIRTABLE_API_BASE, AIRTABLE_API_BASE_META_PATH, AIRTABLE_API_VERSION } from '../utils/constants'
import {
  AttachmentPyImpl,
  AttachmentTsTmpl,
  AttachmentZodTmpl,
  CollaboratorPyImpl,
  CollaboratorTsTmpl,
  CollaboratorZodTmpl,
  getTsType,
  getZodType,
} from '../utils/field-mappings'
import { getFieldEnumName, hasAttachmentField, hasCollaboratorField, isReadonlyField } from '../utils/helpers'
import httpRequest from '../utils/http-request'

dotenv.config()

const ARG_NAME = 'baseId'

class Main extends Command {
  static description = `Generate TypeScript types and/or Zod schemas from an Airtable Base.
Will read your Airtable API key from the AIRTABLE_TYPEGEN_ACCESS_TOKEN environment variable.
Reads environment from .env file if present in current working directory.`

  static examples = [
    `$ airtable-typegen appABC123
> Outputs TypeScript definitions to ./base-name.ts`,
    `$ airtable-typegen appABC123 -t MyTable,tblUOInmv7kanMKjr
> Outputs TypeScript definitions to ./base-name.ts for the specified tables`,
    `$ airtable-typegen appABC123 -z -o ./src/schemas/airtable.ts
> Outputs Zod schemas to ./src/schemas/airtable.ts`,
  ]

  static flags = {
    version: Flags.version({ char: 'v' }),
    output: Flags.string({
      char: 'o',
      description: 'The file (relative to CWD) to write generated code to (defaults to "base-name.ts")',
      required: false,
    }),
    zod: Flags.boolean({
      char: 'z',
      description: 'Generate Zod schemas instead of TypeScript definitions',
      required: false,
    }),
    mapping: Flags.boolean({
      char: 'm',
      description: 'Generate field mappings',
      required: false,
    }),
    js: Flags.boolean({
      char: 'j',
      description: 'Generate JS field mappings only',
      required: false,
    }),
    py: Flags.boolean({
      char: 'p',
      description: 'Generate Python field mappings only',
      required: false,
    }),
    tables: Flags.string({
      char: 't',
      description: 'A comma-separated list of tables (names or ids) to generate from (defaults to all tables)',
      required: false,
    }),
  }

  static args = [
    {
      name: ARG_NAME,
      description: 'The Airtable Base ID (looks like appABC123XYZ). Can specify multiple.',
      required: true,
    },
  ]

  private accessToken = process.env.AIRTABLE_TYPEGEN_ACCESS_TOKEN
  private baseId: string | undefined

  private async fetchAirtableApi<T>(reqPath: string): Promise<T> {
    if (!this.accessToken) {
      this.error(
        'No Airtable Access Token token provided. Make sure to set the AIRTABLE_TYPEGEN_ACCESS_TOKEN environment variable.',
        {
          exit: 1,
        },
      )
    }

    return httpRequest({
      hostname: AIRTABLE_API_BASE.replace(/https?:\/\//, ''),
      path: AIRTABLE_API_VERSION + reqPath,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Main)
    this.baseId = args[ARG_NAME]

    this.log('Fetching Airtable metadata')
    const baseMeta = await this.getBaseMetadata()
    const tableMeta = await this.getTableMetadata(flags.tables?.split(','))

    let data: string
    if (flags.zod) {
      this.log('Generating Zod schemas')
      data = await this.generateZodSchemas(baseMeta, tableMeta, flags.mapping)
    } else if (flags.js) {
      this.log('Generating JavaScript mappings')
      data = await this.generateJSFieldMappings(baseMeta, tableMeta)
    } else if (flags.py) {
      this.log('Generating Python mappings')
      data = await this.generatePythonFieldMappings(baseMeta, tableMeta)
    } else {
      this.log('Generating TypeScript definitions')
      data = await this.generateTSDefinitions(baseMeta, tableMeta, flags.mapping)
    }

    const filepath = flags.output ?? `${paramCase(baseMeta.name)}.${flags.js ? 'js' : flags.py ? 'py' : 'ts'}`
    const output = path.resolve(process.cwd(), filepath)
    await fs.ensureFile(output)
    await fs.writeFile(output, data)
    this.log('Done!')
  }

  /**
   * @param allowlist A list of table names or IDs to filter for
   * @returns Metadata for all (or allowlisted) tables in the specified base
   */
  private async getTableMetadata(allowlist?: string[]): Promise<TableMetadata[]> {
    const res = await this.fetchAirtableApi(`${AIRTABLE_API_BASE_META_PATH}/${this.baseId}/tables`)

    // write res to file
    await fs.writeFile('res.json', JSON.stringify(res))
    const metadata = TableListMetadataSchema.parse(res)

    if (!allowlist) return metadata.tables

    const tables: TableMetadata[] = []
    for (const table of metadata.tables) {
      if (allowlist.includes(table.id) || allowlist.includes(table.name)) {
        tables.push(table)
      }
    }

    if (tables.length !== allowlist.length) {
      const requestedTables = allowlist.join(', ')
      const foundTables = tables.map((t) => t.name).join(', ')
      this.error(`Could not find all tables:\n\nRequested: ${requestedTables}\nFound: ${foundTables}`, {
        exit: 1,
      })
    }

    return tables
  }

  /**
   * @returns Metadata for the specified base
   */
  private async getBaseMetadata() {
    const res = await this.fetchAirtableApi(AIRTABLE_API_BASE_META_PATH)
    const metadata = BaseListMetadataSchema.parse(res)
    const baseMeta = metadata.bases.find((b) => b.id === this.baseId)
    if (!baseMeta) {
      this.error(`Could not find base with ID ${this.baseId}`, {
        exit: 1,
      })
    }

    return baseMeta
  }

  private async generateZodSchemas(base: BaseMetadata, tables: TableMetadata[], includeMapping: boolean) {
    const lines: string[] = []
    lines.push("import { z } from 'zod'")

    lines.push('')

    const allFields = tables.map((t) => t.fields).flat()
    if (hasAttachmentField(allFields)) {
      lines.push(AttachmentZodTmpl)
      lines.push('')
    }
    if (hasCollaboratorField(allFields)) {
      lines.push(CollaboratorZodTmpl)
      lines.push('')
    }

    const tableIds: string[] = []
    const tableIdToObjectMappings: string[] = []

    if (includeMapping) {
      tableIds.push(`export const TableIds = {`)
      tableIdToObjectMappings.push(`export const TableIdToObjectMapping = {`)
    }

    for (const table of tables) {
      // Generate enums for all select fields of this table
      for (const field of table.fields) {
        if (field.type === 'singleSelect' || field.type === 'multipleSelects') {
          const enumName = getFieldEnumName(table, field)
          lines.push(`export const ${enumName} = z.enum([`)
          for (const choice of field.options.choices) {
            lines.push(`  '${choice.name.replace("'", "\\'")}',`)
          }
          lines.push('])')
          lines.push('')
        }
      }

      // Generate schemas table
      const tableSchemaName = `${pascalCase(table.name)}Schema`
      const tableTypeName = pascalCase(table.name)
      lines.push(`export const ${tableSchemaName} = z.object({`)

      for (const field of table.fields) {
        const fieldName = field.name
        const fieldType = getZodType(table, field)
        // NOTE: Airtable API will NOT return a field if it's blank
        // so almost everything has to be marked optional unfortunately
        const isReadonly = isReadonlyField(field)
        const suffix = isReadonly ? '.readonly(),' : '.optional(),'
        lines.push(`  '${fieldName.replace("'", "\\'")}': ${fieldType}${suffix}`)
      }
      lines.push('})')
      lines.push(`export type ${tableTypeName} = z.infer<typeof ${tableSchemaName}>`)
      lines.push('')
      //end

      // Generate schemas insertabletable
      const insertabletableSchemaName = `${pascalCase(table.name)}InsertableSchema`
      const insertabletableTypeName = `${pascalCase(table.name)}Insertable`
      lines.push(`export const ${insertabletableSchemaName} = z.object({`)

      for (const field of table.fields) {
        const fieldName = field.name
        const fieldType = getZodType(table, field)
        // NOTE: Airtable API will NOT return a field if it's blank
        // so almost everything has to be marked optional unfortunately
        const isReadonly = isReadonlyField(field)
        if (!isReadonly) {
          const suffix = '.optional(),'
          lines.push(`  '${fieldName.replace("'", "\\'")}': ${fieldType}${suffix}`)
        }
      }
      lines.push('})')
      lines.push(`export type ${insertabletableTypeName} = z.infer<typeof ${insertabletableSchemaName}>`)
      lines.push('')
      // end

      if (includeMapping) {
        const mappingTableName = `${tableTypeName}FieldIdMapping`

        tableIds.push(`  '${pascalCase(table.name)}': '${table.id}',`)
        tableIdToObjectMappings.push(`  '${table.id}': ${mappingTableName},`)
        lines.push(`export const ${mappingTableName} = {`)

        for (const field of table.fields) {
          const fieldName = field.name
          const fieldId = field.id
          lines.push(`  '${fieldName.replace("'", "\\'")}': '${fieldId}',`)
        }

        lines.push('} as const;')
        lines.push('')
      }
    }

    if (includeMapping) {
      tableIds.push(`} as const;`)
      tableIdToObjectMappings.push(`} as const;`)
    }

    lines.push(...tableIds)
    lines.push('')

    lines.push(...tableIdToObjectMappings)
    lines.push('')

    return lines.join('\n')
  }

  private async generateJSFieldMappings(base: BaseMetadata, tables: TableMetadata[]) {
    const lines: string[] = []
    const tableIds: string[] = []
    const tableIdToObjectMappings: string[] = []

    tableIds.push(`export const TableIds = {`)
    tableIdToObjectMappings.push(`export const TableIdToObjectMapping = {`)

    for (const table of tables) {
      const tableName = pascalCase(table.name)

      const mappingTableName = `${tableName}FieldIdMapping`
      lines.push(`export const ${mappingTableName} = {`)
      tableIds.push(`  '${table.name}': '${table.id}',`)
      tableIdToObjectMappings.push(`  '${table.id}': ${mappingTableName},`)

      for (const field of table.fields) {
        const fieldName = field.name
        const fieldId = field.id
        lines.push(`  '${fieldName.replace("'", "\\'")}': '${fieldId}',`)
      }

      lines.push('};')
      lines.push('')
    }

    tableIds.push(`};`)
    tableIdToObjectMappings.push(`};`)

    lines.push(...tableIds)
    lines.push('')
    lines.push(...tableIdToObjectMappings)
    lines.push('')

    return lines.join('\n')
  }

  private async generatePythonFieldMappings(base: BaseMetadata, tables: TableMetadata[]) {
    const lines: string[] = []
    const tableIds: string[] = []
    const tableIdToObjectMappings: string[] = []

    lines.push('from typing import Optional, TypedDict')

    const allFields = tables.map((t) => t.fields).flat()
    if (hasAttachmentField(allFields)) {
      lines.push(AttachmentPyImpl)
      lines.push('')
    }
    if (hasCollaboratorField(allFields)) {
      lines.push(CollaboratorPyImpl)
      lines.push('')
    }

    tableIds.push(`TableIds = {`)
    tableIdToObjectMappings.push(`TableIdToObjectMapping = {`)

    for (const table of tables) {
      const tableName = pascalCase(table.name)

      const mappingTableName = `${tableName}FieldIdMapping`
      lines.push(`${mappingTableName} = {`)
      tableIds.push(`  '${pascalCase(table.name)}': '${table.id}',`)
      tableIdToObjectMappings.push(`  '${table.id}': ${mappingTableName},`)

      for (const field of table.fields) {
        const fieldName = field.name
        const fieldId = field.id
        lines.push(`  '${fieldName.replace("'", "\\'")}': '${fieldId}',`)
      }

      lines.push('}')
      lines.push('')
    }

    tableIds.push(`};`)
    tableIdToObjectMappings.push(`}`)

    lines.push(...tableIds)
    lines.push('')
    lines.push(...tableIdToObjectMappings)
    lines.push('')

    return lines.join('\n')
  }

  private async generateTSDefinitions(base: BaseMetadata, tables: TableMetadata[], includeMapping: boolean) {
    const lines: string[] = []

    lines.push('// @ts-nocheck')
    lines.push(
      `// We are ignoring the type errors related to FieldSet this because AirTables SDKs don't have a correct value for the FieldSet`,
    )
    lines.push("import { FieldSet } from 'airtable'")

    const allFields = tables.map((t) => t.fields).flat()
    if (hasAttachmentField(allFields)) {
      lines.push(AttachmentTsTmpl)
      lines.push('')
    }
    if (hasCollaboratorField(allFields)) {
      lines.push(CollaboratorTsTmpl)
      lines.push('')
    }

    const tableIds: string[] = []
    const tableIdToObjectMappings: string[] = []

    tableIds.push(`export const TableIds = {`)
    tableIdToObjectMappings.push(`export const TableIdToObjectMapping = {`)

    for (const table of tables) {
      const tableName = pascalCase(table.name)
      lines.push(`export interface ${tableName} extends FieldSet {`)

      for (const field of table.fields) {
        const fieldName = field.name
        const fieldType = getTsType(field)
        // NOTE: Airtable API will NOT return a field if it's blank
        // so almost everything has to be marked optional unfortunately
        const isReadonly = isReadonlyField(field)
        lines.push(`  '${fieldName.replace("'", "\\'")}'${isReadonly ? '' : '?'}: ${fieldType}`)
      }

      lines.push('}')
      lines.push('')

      const mappingTableName = `${tableName}FieldIdMapping`
      lines.push(`export const ${mappingTableName} = {`)
      tableIds.push(`  '${table.name}': '${table.id}',`)
      tableIdToObjectMappings.push(`  '${table.id}': ${mappingTableName},`)

      for (const field of table.fields) {
        const fieldName = field.name
        const fieldId = field.id
        lines.push(`  '${fieldName.replace("'", "\\'")}': '${fieldId}',`)
      }

      lines.push('} as const;')
      lines.push('')
    }

    tableIds.push(`} as const;`)
    tableIdToObjectMappings.push(`} as const;`)

    lines.push(...tableIds)
    lines.push('')
    lines.push(...tableIdToObjectMappings)
    lines.push('')

    lines.push('export type TableKey = keyof typeof TableIds;')
    lines.push('export type TableId = typeof TableIds[TableKey];')
    lines.push('export type TableType = typeof TableIdToObjectMapping[TableId];')
    lines.push('')

    return lines.join('\n')
  }
}

export = Main
