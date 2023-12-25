import { z } from 'zod'

import { DateFormat, DurationFormat, SelectColors, TimeFormat, TimeZone } from './misc'

/**
 * All Airtable field types, according to:
 * https://airtable.com/api/meta
 */
export const AllFieldTypes = z.enum([
  'autoNumber',
  'barcode',
  'button',
  'checkbox',
  'count',
  'createdBy',
  'createdTime',
  'currency',
  'date',
  'dateTime',
  'duration',
  'email',
  'externalSyncSource',
  'formula',
  'lastModifiedBy',
  'lastModifiedTime',
  'multilineText',
  'multipleAttachments',
  'multipleCollaborators',
  'multipleLookupValues',
  'multipleRecordLinks',
  'multipleSelects',
  'number',
  'percent',
  'phoneNumber',
  'rating',
  'richText',
  'rollup',
  'singleCollaborator',
  'singleLineText',
  'singleSelect',
  'url',
]);

/**
 * Computed fields cannot be updated via the API.
 * WARN: This list has not been verified for completeness/correctness.
 */
export const ReadonlyFieldTypes = z.enum([
  'autoNumber',
  'button',
  'count',
  'createdBy',
  'createdTime',
  'externalSyncSource',
  'formula',
  'lastModifiedBy',
  'lastModifiedTime',
  'multipleLookupValues',
  'rollup',
]);

/**
 * Basic field types do not required any extra metadata to infer their TypeScript/Zod type
 */
export const BasicFieldTypes = z.enum([
  'autoNumber',
  'barcode',
  'button',
  'checkbox',
  'count',
  'createdBy',
  'email',
  'lastModifiedBy',
  'multilineText',
  'multipleAttachments',
  'multipleCollaborators',
  'multipleLookupValues',
  'multipleRecordLinks',
  'phoneNumber',
  'richText',
  'singleCollaborator',
  'singleLineText',
  'url',
]);

const BasicField = z.object({
  type: BasicFieldTypes,
  name: z.string(),
  id: z.string(),
});

const numberTypes = z.enum(['number', 'currency', 'percent']);

const PreciseNumberSubField = z.object({
  type: numberTypes,
  options: z.object({
    precision: z.number().min(0).max(8),
  }),
});

const DurationSubField = z.object({
  type: z.literal('duration'),
  options: z.object({ durationFormat: DurationFormat }),
});

const PreciseNumberField = BasicField.extend({
  type: numberTypes,
  options: z.object({
    precision: z.number().min(0).max(8),
  }),
});

const DateSubField = z.object({
  type: z.literal('date'),
  options: z.object({ dateFormat: DateFormat }),
});

const DateTimeSubField = z.object({
  type: z.literal('dateTime'),
  options: z.object({
    dateFormat: DateFormat,
    timeFormat: TimeFormat,
    timeZone: TimeZone,
  }),
});

const DateField = BasicField.merge(DateSubField);

const DateTimeField = BasicField.merge(DateTimeSubField);

const CreatedTimeField = BasicField.extend({
  type: z.literal('createdTime'),
  options: z.object({
    result: z.discriminatedUnion('type', [DateSubField, DateTimeSubField]),
  }),
});

const ExternalSyncSourceField = BasicField.extend({
  type: z.literal('externalSyncSource'),
  options: z.object({
    choices: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: SelectColors.optional(),
      }),
    ),
  }),
});

const LastModifiedTimeField = BasicField.extend({
  type: z.literal('lastModifiedTime'),
  options: z.object({
    result: z.discriminatedUnion('type', [DateSubField, DateTimeSubField]),
  }),
});

const FormulaField = BasicField.extend({
  type: z.literal('formula'),
  options: z.object({
    formula: z.string(),
    isValid: z.boolean(),
    referencedFieldIds: z.array(z.string()),
    result: z.nullable(z.discriminatedUnion('type', [
      DateSubField,
      DateTimeSubField,
      DurationSubField,
      PreciseNumberSubField,
      z.object({ type: z.literal('singleLineText') }),
    ])),
  }),
});
export type FormulaFieldType = z.infer<typeof FormulaField>;

const RollupField = BasicField.extend({
  type: z.literal('rollup'),
  options: z.object({
    result: z.nullable(z.discriminatedUnion('type', [
      DateSubField,
      DateTimeSubField,
      DurationSubField,
      PreciseNumberSubField,
      z.object({ type: z.literal('singleLineText') }),
    ])),
    isValid: z.boolean(),
    referencedFieldIds: z.array(z.string()),
    recordLinkFieldId: z.nullable(z.string()),
    fieldIdInLinkedTable: z.nullable(z.string()),
  }),
});
export type RollupFieldType = z.infer<typeof RollupField>;

const DurationField = BasicField.extend({
  type: z.literal('duration'),
  options: z.object({ durationFormat: DurationFormat }),
});

const MultipleSelectsField = BasicField.extend({
  type: z.literal('multipleSelects'),
  options: z.object({
    choices: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: SelectColors.optional(),
      }),
    ),
  }),
});

const SingleSelectField = MultipleSelectsField.extend({
  type: z.literal('singleSelect'),
});

const RatingField = BasicField.extend({
  type: z.literal('rating'),
  options: z.object({
    color: z.enum([
      'yellowBright',
      'orangeBright',
      'redBright',
      'pinkBright',
      'purpleBright',
      'blueBright',
      'cyanBright',
      'tealBright',
      'greenBright',
      'grayBright',
    ]),
    icon: z.enum(['star', 'heart', 'thumbsUp', 'flag', 'dot']),
    max: z.number().min(1).max(10),
  }),
});

export const FieldMetadataSchema = z.discriminatedUnion('type', [
  BasicField,
  CreatedTimeField,
  DateField,
  DateTimeField,
  DurationField,
  ExternalSyncSourceField,
  FormulaField,
  LastModifiedTimeField,
  MultipleSelectsField,
  PreciseNumberField,
  RatingField,
  RollupField,
  SingleSelectField,
]);

export type FieldMetadata = z.infer<typeof FieldMetadataSchema>;
