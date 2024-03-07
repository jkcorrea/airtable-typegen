import airtable from 'airtable'
import { z } from 'zod'

import { FurnitureSchema } from './airtable-schemas'

// WARNING: DO NOT DO THIS IN PROD
// You should never expose your Airtable API key to the client.
// I'm only doing this here because this app is never deployed and I don't want to wire up a backend.
airtable.apiKey = import.meta.env.VITE_AIRTABLE_API_KEY

export default async function fetchAirtableData() {
  const Base = airtable.base('app0JmQpZFn7YCI4C')
  const data = await Base('Furniture').select().all()
  const rawRows = data.map((row) => row.fields)
  const rows = z.array(FurnitureSchema).safeParse(rawRows)
  if (rows.success) {
    return rows.data
  } else {
    throw new Error(`Airtable data failed to parse:\n${rows.error}`)
  }
}
