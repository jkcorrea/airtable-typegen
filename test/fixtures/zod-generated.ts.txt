import { z } from 'zod'

export const AirtableThumbnailSchema = z.object({
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
})

export const ApartmentsPros = z.enum([
  'Good View',
  'Architecture/Design',
  'Natural light/Tall windows',
  'High Ceilings',
  'Rooftop/Balcony',
  'Decent Gym',
  'Pool',
  'Spacious',
  'Good Community Amenities',
  'Great Location',
])

export const ApartmentsCons = z.enum([
  'Cookie cutter design/fixtures',
  'Poor lighting',
  'Small shower',
  'No view (view of street/another building/etc)',
  'Bad Location',
  'Small Room',
])

export const ApartmentsVisited = z.enum([
  'Want to',
  'Scheduled',
  'Visited',
  'Table for now',
])

export const ApartmentsSchema = z.object({
  name: z.string(),
  link: z.string(),
  quickNotes: z.string(),
  pictures: z.array(AirtableAttachmentSchema),
  rent: z.number().positive(),
  squareFeet: z.number().int().positive(),
  ratingDisregardingPrice: z.number().min(0).max(5),
  valueRatingPrice: z.number().min(0).max(5),
  pros: z.array(ApartmentsPros),
  cons: z.array(ApartmentsCons),
  district: z.array(z.string()),
  visited: ApartmentsVisited,
  visitNotes: z.string(),
  comments: z.string(),
  test1: z.number().int().positive(),
  test2: z.array(z.string()),
  imagesFromTest2: z.union([z.array(z.string()), z.array(z.boolean()), z.array(z.number()), z.array(z.record(z.unknown()))]),
})
export type Apartments = z.infer<typeof ApartmentsSchema>

export const DistrictsSchema = z.object({
  name: z.string(),
  images: z.array(AirtableAttachmentSchema),
  description: z.string(),
  apartments: z.array(z.string()),
  apartments_2: z.array(z.string()),
})
export type Districts = z.infer<typeof DistrictsSchema>
