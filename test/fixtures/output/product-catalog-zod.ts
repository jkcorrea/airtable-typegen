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

export const FurnitureType = z.enum([
  'Beds',
  'Bookshelves',
  'Chairs',
  'Lighting',
  'Rugs',
  'Sofas',
  'Tables',
])

export const FurnitureMaterials = z.enum([
  'Brass',
  'Brushed nickel',
  'Corduroy',
  'Cotton',
  'Dark wood',
  'Foam beans',
  'Glass',
  'Glazed ceramic',
  'Indian wool',
  'Iron',
  'Lacquered ash',
  'Leather',
  'Leather cowhide',
  'Light wood',
  'Linen shade',
  'Marble',
  'Metal',
  'Mirror',
  'Poly-cotton shade',
  'Reclaimed wood',
  'Shiny black',
  'Solid maple',
  'Solid teak',
  'Stainless steel',
  'Steel',
  'Suede',
  'Tech suede',
  'Viscose',
  'Walnut',
  'Wool',
])

export const FurnitureColor = z.enum([
  'Beige',
  'Black',
  'Blue',
  'Blue purple',
  'Brown',
  'Cherry',
  'Cream',
  'Fern',
  'Framboise',
  'Gold',
  'Green',
  'Grey',
  'Matte black',
  'Orange',
  'Red',
  'Shiny black',
  'Silver',
  'Taupe',
  'Velvet',
  'White',
  'Yellow',
])

export const FurnitureSettings = z.enum([
  'Living room',
  'Office',
  'Outdoor',
  'Dining',
  'Bedroom',
])

export const FurnitureSchema = z.object({
  'Name': z.string().optional(),
  'Type': FurnitureType.optional(),
  'Images': z.array(AirtableAttachmentSchema).optional(),
  'Vendor': z.array(z.string()).optional(),
  'In stock': z.boolean().optional(),
  'Unit cost': z.number().positive().optional(),
  'Size (WxLxH)': z.string().optional(),
  'Materials': z.array(FurnitureMaterials).optional(),
  'Color': z.array(FurnitureColor).optional(),
  'Settings': z.array(FurnitureSettings).optional(),
  'Schematic': z.array(AirtableAttachmentSchema).optional(),
  'Designer': z.array(z.string()).optional(),
  'Description': z.string().optional(),
  'Link': z.string().optional(),
  'Notes': z.string().optional(),
  'Orders': z.array(z.string()).optional(),
  'Total units sold': z.string().or(z.number()),
  'Gross sales': z.string().or(z.number()),
})
export type Furniture = z.infer<typeof FurnitureSchema>

export const VendorsSchema = z.object({
  'Name': z.string().optional(),
  'Logo': z.array(AirtableAttachmentSchema).optional(),
  'Notes': z.string().optional(),
  'Closest showroom': z.string().optional(),
  'Phone number': z.string().optional(),
  'Sales contact': z.array(z.string()).optional(),
  'Catalog link': z.string().optional(),
  'Furniture': z.array(z.string()).optional(),
})
export type Vendors = z.infer<typeof VendorsSchema>

export const ClientsSchema = z.object({
  'Name': z.string().optional(),
  'Photos of space': z.array(AirtableAttachmentSchema).optional(),
  'Client orders': z.array(z.string()).optional(),
  'Billing address': z.string().optional(),
})
export type Clients = z.infer<typeof ClientsSchema>

export const ClientOrdersStatus = z.enum([
  'Preparing',
  'Invoiced',
  'Shipped',
  'Received',
])

export const ClientOrdersSchema = z.object({
  'Name': z.string().or(z.number()),
  'Client': z.array(z.string()).optional(),
  'Order no.': z.number().int().positive().optional(),
  'Fulfill by': z.coerce.date().optional(),
  'Status': ClientOrdersStatus.optional(),
  'Order line items': z.array(z.string()).optional(),
  'Total order cost': z.string().or(z.number()),
  'Invoice': z.array(AirtableAttachmentSchema).optional(),
  'Bill to': z.union([z.array(z.string()), z.array(z.boolean()), z.array(z.number()), z.array(z.record(z.unknown()))]),
})
export type ClientOrders = z.infer<typeof ClientOrdersSchema>

export const OrderLineItemsSchema = z.object({
  'Name': z.string().or(z.number()),
  'Furniture item': z.array(z.string()).optional(),
  'Price per unit': z.union([z.array(z.string()), z.array(z.boolean()), z.array(z.number()), z.array(z.record(z.unknown()))]),
  'Quantity': z.number().int().positive().optional(),
  'Total cost': z.string().or(z.number()),
  'Belongs to order': z.array(z.string()).optional(),
  'Image': z.union([z.array(z.string()), z.array(z.boolean()), z.array(z.number()), z.array(z.record(z.unknown()))]),
})
export type OrderLineItems = z.infer<typeof OrderLineItemsSchema>

export const DesignersSchema = z.object({
  'Name': z.string().optional(),
  'Photo': z.array(AirtableAttachmentSchema).optional(),
  'Bio': z.string().optional(),
  'Furniture': z.array(z.string()).optional(),
})
export type Designers = z.infer<typeof DesignersSchema>

export const VendorContactsSchema = z.object({
  'Name': z.string().optional(),
  'Vendors': z.array(z.string()).optional(),
  'Phone number': z.string().optional(),
  'Email': z.string().email().optional(),
})
export type VendorContacts = z.infer<typeof VendorContactsSchema>
