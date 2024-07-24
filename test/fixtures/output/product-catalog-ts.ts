export interface IAirtableThumbnail {
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
}

export interface Furniture {
  'Name'?: string
  'Type'?: 'Beds' | 'Bookshelves' | 'Chairs' | 'Lighting' | 'Rugs' | 'Sofas' | 'Tables' | 'Baker\'s Racks and Carpenter\'s Tables'
  'Images'?: Array<IAirtableAttachment>
  'Vendor'?: Array<string>
  'In stock'?: boolean
  'Unit cost'?: number
  'Size (WxLxH)'?: string
  'Materials'?: Array<'Brass' | 'Brushed nickel' | 'Corduroy' | 'Cotton' | 'Dark wood' | 'Foam beans' | 'Glass' | 'Glazed ceramic' | 'Indian wool' | 'Iron' | 'Lacquered ash' | 'Leather' | 'Leather cowhide' | 'Light wood' | 'Linen shade' | 'Marble' | 'Metal' | 'Mirror' | 'Poly-cotton shade' | 'Reclaimed wood' | 'Shiny black' | 'Solid maple' | 'Solid teak' | 'Stainless steel' | 'Steel' | 'Suede' | 'Tech suede' | 'Viscose' | 'Walnut' | 'Wool'>
  'Color'?: Array<'Beige' | 'Black' | 'Blue' | 'Blue purple' | 'Brown' | 'Cherry' | 'Cream' | 'Fern' | 'Framboise' | 'Gold' | 'Green' | 'Grey' | 'Matte black' | 'Orange' | 'Red' | 'Shiny black' | 'Silver' | 'Taupe' | 'Velvet' | 'White' | 'Yellow'>
  'Settings'?: Array<'Living room' | 'Office' | 'Outdoor' | 'Dining' | 'Bedroom' | 'Child\'s or infant\'s room'>
  'Schematic'?: Array<IAirtableAttachment>
  'Designer'?: Array<string>
  'Description'?: string
  'Link'?: string
  'Notes'?: string
  'Orders'?: Array<string>
  'Total units sold': number | string
  'Gross sales': number | string
}

export interface Vendors {
  'Name'?: string
  'Logo'?: Array<IAirtableAttachment>
  'Notes'?: string
  'Closest showroom'?: string
  'Phone number'?: string
  'Sales contact'?: Array<string>
  'Catalog link'?: string
  'Furniture'?: Array<string>
}

export interface Clients {
  'Name'?: string
  'Photos of space'?: Array<IAirtableAttachment>
  'Client orders'?: Array<string>
  'Billing address'?: string
}

export interface ClientOrders {
  'Name': number | string
  'Client'?: Array<string>
  'Order no.'?: number
  'Fulfill by'?: string
  'Status'?: 'Preparing' | 'Invoiced' | 'Shipped' | 'Received'
  'Order line items'?: Array<string>
  'Total order cost': number | string
  'Invoice'?: Array<IAirtableAttachment>
  'Bill to': Array<string | boolean | number | Record<string, unknown>>
}

export interface OrderLineItems {
  'Name': number | string
  'Furniture item'?: Array<string>
  'Price per unit': Array<string | boolean | number | Record<string, unknown>>
  'Quantity'?: number
  'Total cost': number | string
  'Belongs to order'?: Array<string>
  'Image': Array<string | boolean | number | Record<string, unknown>>
}

export interface Designers {
  'Name'?: string
  'Photo'?: Array<IAirtableAttachment>
  'Bio'?: string
  'Furniture'?: Array<string>
}

export interface VendorContacts {
  'Name'?: string
  'Vendors'?: Array<string>
  'Phone number'?: string
  'Email'?: string
}
