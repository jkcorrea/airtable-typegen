import { pascalCase } from 'change-case'

import { TableMetadata } from '../schemas/api'
import { FieldMetadata, ReadonlyFieldTypes } from '../schemas/fields'

export function isReadonlyField(field: FieldMetadata) {
  return Object.keys(ReadonlyFieldTypes.Enum).includes(field.type)
}

export function hasCollaboratorField(fields: FieldMetadata[]) {
  return fields.some((f) =>
    ['singleCollaborator', 'multipleCollaborators', 'lastModifiedBy', 'createdBy'].includes(f.type),
  )
}

export function hasAttachmentField(fields: FieldMetadata[]) {
  return fields.some((f) => f.type === 'multipleAttachments')
}

export function getFieldEnumName(table: TableMetadata, field: FieldMetadata) {
  return `${pascalCase(table.name)}${pascalCase(field.name)}`
}
