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
      return 'z.object({ label: z.string(), url: z.string().url().optional() })'
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
    case 'number': // is number definitely positive?
    case 'percent':
    case 'currency': {
      if ('options' in field && field.options.precision === 0) {
        return 'z.number().int()'
      } else {
        return 'z.number()'
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
    case 'richText':
      return 'z.string()'
    case 'url':
      return 'z.string().url()'
    case 'rollup':
      if (['number', 'currency', 'percent'].includes(field.options.result?.type || "")) {
        // @ts-ignore
        if (field.options.result?.options?.precision === 0) {
          return 'z.number().int()'
        }
        return 'z.number()'
      }
      return 'z.union([z.string(), z.array(z.string())])'
    case 'formula':
      if (['number', 'currency', 'percent'].includes(field.options.result?.type || "")) {
        // @ts-ignore
        if (field.options.result?.options?.precision === 0) {
          return 'z.number().int()'
        }
        return 'z.number()'
      }
      return 'z.string()'
    case 'multipleCollaborators':
      return 'z.array(AirtableCollaboratorSchema)'
    case 'multipleAttachments':
      return 'z.array(AirtableAttachmentSchema)'
    case 'multipleLookupValues':
      if (['number', 'currency', 'percent'].includes(field.options.result?.type || "")) {
        return 'z.array(z.number())'
      } else if (field.options.result?.type === 'multipleAttachments') {
        return 'z.array(AirtableAttachmentSchema)'
      } else if (field.options.result?.type === 'checkbox') {
        return 'z.array(z.boolean())'
      } else {
        // TODO can also handle single/multiple select case...
        // should be able to just call this function again? 
        // But would need to do more clever lookup for single/multi select
        // also a url lookup field would look very different too
        return 'z.array(z.string())'
      }
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
      // if AirTable ever includes formulas in their rollup metadata, this could be further refined away from string | Array<string>
      // this could be done by looking for non-numeric string join functions like CONCATENATE() or ARRAYJOIN()
      return ['number', 'currency', 'percent'].includes(field.options.result?.type || "") ? 'number' : 'string | Array<string>';
    case 'formula':
      return ['number', 'currency', 'percent'].includes(field.options.result?.type || "") ? 'number' : 'string';
    // return 'number | string'
    case 'barcode':
      return `{ text: string; type: string; }`
    case 'button':
      return `{ label: string; url?: string; }`
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
      if (['number', 'currency', 'percent'].includes(field.options.result?.type || "")) {
        return 'Array<number>'
      } else if (field.options.result?.type === 'multipleAttachments') {
        return 'Array<IAirtableAttachment>'
      } else if (field.options.result?.type === 'checkbox') {
        return 'Array<boolean>'
      } else {
        // TODO can also handle single/multiple select case...
        // should be able to just call this function again? 
        // But would need to do more clever lookup for single/multi select
        return 'Array<string>'
      }
    case 'multipleRecordLinks':
      return 'Array<string>'
    case 'singleSelect':
      return field.options.choices.map((choice) => `'${choice.name.replace("'", "\\\'")}'`).join(' | ')
    case 'multipleSelects':
      return `Array<${field.options.choices.map((choice) => `'${choice.name.replace("'", "\\\'")}'`).join(' | ')}>`
    // TODO not sure what this one is
    case 'externalSyncSource':
      return 'unknown'
  }

  // @ts-expect-error - we should never fall through to here, but just in case
  throw new Error(`Unrecognized field type: ${field.type} (on field '${field.name}')`)
}

export function getPythonType(field: FieldMetadata): string {
  switch (field.type) {
    case 'number':
    case 'currency':
    case 'percent':
      if (field.options.precision === 0)
        return 'int';
      return 'float';
    case 'duration':
      return 'float';
    case 'rating':
    case 'count':
    case 'autoNumber':
      return 'int';
    case 'email':
    case 'multilineText':
    case 'phoneNumber':
    case 'singleLineText':
    case 'url':
    case 'richText':
      return 'str';
    case 'rollup':
      // if AirTable ever includes formulas in their rollup metadata, this could be further refined away from string | Array<string>
      // this could be done by looking for non-numeric string join functions like CONCATENATE() or ARRAYJOIN()
      return ['number', 'currency', 'percent'].includes(field.options.result?.type || "") ? 'float' : 'Union[float, str]';
    case 'formula':
      return ['number', 'currency', 'percent'].includes(field.options.result?.type || "") ? 'float' : 'str';
    case 'barcode':
      return '{text: str, type: str}';
    case 'button':
      return '{label: str, url?: str}';
    case 'checkbox':
      return 'bool';
    case 'createdBy':
    case 'lastModifiedBy':
    case 'singleCollaborator':
      return 'IAirtableCollaborator';
    case 'multipleCollaborators':
      return 'list[IAirtableCollaborator]';
    case 'date':
    case 'dateTime':
    case 'createdTime':
    case 'lastModifiedTime':
      return 'str';
    case 'multipleAttachments':
      return 'list[IAirtableAttachment]';
    case 'multipleLookupValues':
      if (['number', 'currency', 'percent'].includes(field.options.result?.type || "")) {
        return 'list[float]'
      } else if (field.options.result?.type === 'multipleAttachments') {
        return 'list[IAirtableAttachment]'
      } else if (field.options.result?.type === 'checkbox') {
        return 'list[bool]'
      } else {
        // TODO can also handle single/multiple select case...
        // should be able to just call this function again? 
        // But would need to do more clever lookup for single/multi select
        return 'list[string]'
      }
    case 'multipleRecordLinks':
      return 'list[str]';
    case 'singleSelect':
      const choices = field.options?.choices.map((choice) => `'${choice.name.replace("'", "\\\'")}'`);
      return choices ? `Union[${choices.join(', ')}]` : 'str';
    case 'multipleSelects':
      const multiChoices = field.options?.choices.map((choice) => `'${choice.name.replace("'", "\\\'")}'`);
      return multiChoices ? `list[Union[${multiChoices.join(', ')}]]` : 'list[str]';
    case 'externalSyncSource':
      return 'Any'; // Replace 'Any' with the appropriate type for unknown in Python
    default:
      return 'Any';
  }
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

export const CollaboratorPyImpl = `class IAirtableCollaborator(TypedDict):
  id: str
  email: str
  name: str
`

export const AttachmentPyImpl = `class IAirtableThumbnail(TypedDict):
  url: str
  width: int
  height: int

class IAirtableThumbnails(TypedDict):
  small: IAirtableThumbnail
  large: IAirtableThumbnail
  full: IAirtableThumbnail

class IAirtableAttachment(TypedDict):
  id: str
  url: str
  filename: str
  size: int
  type: str
  thumbnails: Optional[IAirtableThumbnails]
`