import { TableMetadata } from '../schemas/api'
import { FieldMetadata } from '../schemas/fields'
import { getFieldEnumName } from './helpers'

export function getZodType(table: TableMetadata, field: FieldMetadata) {
  switch (field.type) {
    case 'autoNumber':
      return 'z.number().int().positive()'
    case 'barcode':
      return 'z.object({ text: z.string(), type: z.string() })'
    case 'button':
      return 'z.object({ label: z.string() }).merge(z.record(z.unknown()))'
    case 'checkbox':
      return 'z.boolean()'
    case 'count':
      return 'z.number().int().nonnegative()'
    case 'createdBy':
    case 'lastModifiedBy':
    case 'singleCollaborator':
      return 'AirtableCollaboratorSchema'
    case 'date':
    case 'dateTime':
    case 'createdTime':
    case 'lastModifiedTime':
      return 'z.coerce.date()'
    case 'number':
    case 'percent':
    case 'currency': {
      if ('options' in field && field.options.precision === 0) {
        return 'z.number().int().positive()'
      } else {
        return 'z.number().positive()'
      }
    }
    case 'duration':
      return 'z.number()'
    case 'rating':
      return 'z.number().min(0).max(5)'
    case 'email':
      return 'z.string().email()'
    case 'multilineText':
    case 'phoneNumber':
    case 'singleLineText':
    case 'url':
    case 'richText':
      return 'z.string()'
    case 'rollup':
    case 'formula':
      return 'z.string().or(z.number())'
    case 'multipleCollaborators':
      return 'z.array(AirtableCollaboratorSchema)'
    case 'multipleAttachments':
      return 'z.array(AirtableAttachmentSchema)'
    case 'multipleLookupValues':
      return 'z.union([z.array(z.string()), z.array(z.boolean()), z.array(z.number()), z.array(z.record(z.unknown()))])'
    case 'multipleRecordLinks':
      return 'z.array(z.string())'
    case 'singleSelect':
      return getFieldEnumName(table, field)
    case 'multipleSelects':
      return `z.array(${getFieldEnumName(table, field)})`
    // TODO not sure what this one is
    case 'externalSyncSource':
      return 'z.unknown()'
  }

  // @ts-expect-error - we should never fall through to here, but just in case
  throw new Error(`Unrecognized field type: ${field.type} (on field '${field.name}')`)
}

export const CollaboratorZodTmpl = `export const AirtableCollaboratorSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
})`

export const AttachmentZodTmpl = `export const AirtableThumbnailSchema = z.object({
  url: z.string(),
  width: z.number(),
  height: z.number(),
})

export const AirtableAttachmentSchema = z.object({
  id: z.string(),
  url: z.string(),
  filename: z.string(),
  size: z.number(),
  type: z.string(),
  thumbnails: z.object({
    small: AirtableThumbnailSchema,
    large: AirtableThumbnailSchema,
    full: AirtableThumbnailSchema,
  }).optional(),
})`

export function getTsType(field: FieldMetadata) {
  switch (field.type) {
    case 'number':
    case 'count':
    case 'currency':
    case 'percent':
    case 'rating':
    case 'autoNumber':
    case 'duration':
      return 'number'
    case 'email':
    case 'multilineText':
    case 'phoneNumber':
    case 'singleLineText':
    case 'url':
    case 'richText':
      return 'string'
    case 'rollup':
    case 'formula':
      return 'number | string'
    case 'barcode':
      return `{ text: string; type: string; }`
    case 'button':
      return `{ label: string; } & Record<string, unknown>`
    case 'checkbox':
      return 'boolean'
    case 'createdBy':
    case 'lastModifiedBy':
    case 'singleCollaborator':
      return 'IAirtableCollaborator'
    case 'multipleCollaborators':
      return `Array<IAirtableCollaborator>`
    // Dates are strings in the API
    case 'date':
    case 'dateTime':
    case 'createdTime':
    case 'lastModifiedTime':
      return 'string'
    case 'multipleAttachments':
      return 'Array<IAirtableAttachment>'
    case 'multipleLookupValues':
      return 'Array<string | boolean | number | Record<string, unknown>>'
    case 'multipleRecordLinks':
      return 'Array<string>'
    case 'singleSelect':
      return field.options.choices.map((choice) => `'${choice.name.replace(/'/g, "\\\'")}'`).join(' | ')
    case 'multipleSelects':
      return `Array<${field.options.choices.map((choice) => `'${choice.name.replace(/'/g, "\\\'")}'`).join(' | ')}>`
    // TODO not sure what this one is
    case 'externalSyncSource':
      return 'unknown'
  }

  // @ts-expect-error - we should never fall through to here, but just in case
  throw new Error(`Unrecognized field type: ${field.type} (on field '${field.name}')`)
}

export const CollaboratorTsTmpl = `export interface IAirtableCollaborator {
  id: string
  email: string
  name: string
}`

export const AttachmentTsTmpl = `export interface IAirtableThumbnail {
  url: string
  width: number
  height: number
}

export interface IAirtableAttachment {
  id: string
  url: string
  filename: string
  size: number
  type: string
  thumbnails?: {
    small: IAirtableThumbnail
    large: IAirtableThumbnail
    full: IAirtableThumbnail
  }
}`
