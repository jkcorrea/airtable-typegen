import { z } from 'zod'

import { FieldMetadataSchema } from './fields'

export const ViewMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['grid', 'form', 'calendar', 'gallery', 'kanban', 'block', 'levels', 'timeline']),
})
export type ViewMetadata = z.infer<typeof ViewMetadataSchema>

export const TableMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  primaryFieldId: z.string(),
  fields: z.array(FieldMetadataSchema),
  views: z.array(ViewMetadataSchema),
})
export type TableMetadata = z.infer<typeof TableMetadataSchema>

export const TableListMetadataSchema = z.object({
  tables: z.array(TableMetadataSchema),
})
export type TableListMetadata = z.infer<typeof TableListMetadataSchema>

export const BaseMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  permissionLevel: z.enum(['read', 'comment', 'edit', 'create']),
})
export type BaseMetadata = z.infer<typeof BaseMetadataSchema>

export const BaseListMetadataSchema = z.object({
  bases: z.array(BaseMetadataSchema),
})
export type BaseListMetadata = z.infer<typeof BaseListMetadataSchema>
