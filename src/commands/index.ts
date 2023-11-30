import { Command, Flags } from '@oclif/core'
import { paramCase, pascalCase } from 'change-case'
import * as dotenv from 'dotenv'
import fs from 'fs-extra'
import { table } from 'node:console'
import path from 'node:path'

import { BaseListMetadataSchema, BaseMetadata, TableListMetadataSchema, TableMetadata } from '../schemas/api'
import { AIRTABLE_API_BASE, AIRTABLE_API_BASE_META_PATH, AIRTABLE_API_VERSION } from '../utils/constants'
import {
  AttachmentTsTmpl,
  AttachmentZodTmpl,
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
    } else {
      this.log('Generating TypeScript definitions')
      data = await this.generateTSDefinitions(baseMeta, tableMeta, flags.mapping)
    }

    const filepath = flags.output ?? `${paramCase(baseMeta.name)}.${flags.js ? 'js' : 'ts'}`
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

    const tableIds: string[] = [];
    tableIds.push(`export const TableIds = {`);
    for (const table of tables) {
      tableIds.push(`  ${pascalCase(table.name)}: '${table.id}',`);
      // Generate enums for all select fields of this table
      for (const field of table.fields) {
        if (field.type === 'singleSelect' || field.type === 'multipleSelects') {
          const enumName = getFieldEnumName(table, field)
          lines.push(`export const ${enumName} = z.enum([`)
          for (const choice of field.options.choices) {
            lines.push(`  '${choice.name.replace("'", "\\\'")}',`)
          }
          lines.push('])')
          lines.push('')
        }
      }

      const tableSchemaName = `${pascalCase(table.name)}Schema`
      const tableTypeName = pascalCase(table.name)
      lines.push(`export const ${tableSchemaName} = z.object({`)

      for (const field of table.fields) {
        const fieldName = field.name
        const fieldType = getZodType(table, field)
        // NOTE: Airtable API will NOT return a field if it's blank
        // so almost everything has to be marked optional unfortunately
        const isReadonly = isReadonlyField(field)
        const suffix = isReadonly ? ',' : '.optional(),'
        lines.push(`  '${fieldName.replace("'", "\\\'")}': ${fieldType}${suffix}`)
      }

      lines.push('})')
      lines.push(`export type ${tableTypeName} = z.infer<typeof ${tableSchemaName}>`)
      lines.push('')

      if (includeMapping) {
        lines.push(`export const ${tableTypeName}FieldIdMapping = {`)

        for (const field of table.fields) {
          const fieldName = field.name
          const fieldId = field.id
          lines.push(`  '${fieldName.replace("'", '\\\'')}': '${fieldId}',`)
        }

        lines.push('} as const;')
        lines.push('')
      }
    }

    tableIds.push(`} as const;`);

    lines.push(...tableIds);
    lines.push('');

    return lines.join('\n')
  }

  private async generateJSFieldMappings(base: BaseMetadata, tables: TableMetadata[]) {
    const lines: string[] = []

    for (const table of tables) {
      const tableName = pascalCase(table.name)
      lines.push(`export const ${tableName}FieldIdMapping = {`)

      for (const field of table.fields) {
        const fieldName = field.name
        const fieldId = field.id
        lines.push(`  '${fieldName.replace("'", '\\\'')}': '${fieldId}',`)
      }

      lines.push('};');
      lines.push('');
    }

    return lines.join('\n')
  }

  private async generateTSDefinitions(base: BaseMetadata, tables: TableMetadata[], includeMapping: boolean) {
    const lines: string[] = []

    const allFields = tables.map((t) => t.fields).flat()
    if (hasAttachmentField(allFields)) {
      lines.push(AttachmentTsTmpl)
      lines.push('')
    }
    if (hasCollaboratorField(allFields)) {
      lines.push(CollaboratorTsTmpl)
      lines.push('')
    }

    for (const table of tables) {
      const tableName = pascalCase(table.name)
      lines.push(`export interface ${tableName} {`)

      for (const field of table.fields) {
        const fieldName = field.name
        const fieldType = getTsType(field)
        // NOTE: Airtable API will NOT return a field if it's blank
        // so almost everything has to be marked optional unfortunately
        const isReadonly = isReadonlyField(field)
        lines.push(`  '${fieldName.replace("'", '\\\'')}'${isReadonly ? '' : '?'}: ${fieldType}`)
      }

      lines.push('}')
      lines.push('')

      if (includeMapping) {
        lines.push(`export const ${tableName}FieldIdMapping = {`)

        for (const field of table.fields) {
          const fieldName = field.name
          const fieldId = field.id
          lines.push(`  '${fieldName.replace("'", '\\\'')}': '${fieldId}',`)
        }

        lines.push('} as const;')
        lines.push('')
      }
    }

    lines.push('}')
    lines.push('')

    return lines.join('\n')
  }
}

export = Main
