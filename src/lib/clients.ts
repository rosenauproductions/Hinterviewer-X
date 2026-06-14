import registryData from '../../clients/registry.json'

export interface ClientRecord {
  id: string
  name: string
  description?: string
  /** Public Supabase project ref — used to build https://{ref}.supabase.co */
  supabaseProjectRef?: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  netlifySiteHint?: string
}

const clients = registryData.clients as ClientRecord[]

export function listClients(): ClientRecord[] {
  return clients
}

export function getClientById(id: string): ClientRecord | undefined {
  return clients.find((c) => c.id === id)
}

export function resolveActiveClientId(): string {
  return process.env.NEXT_PUBLIC_CLIENT_ID?.trim() || ''
}

export function getActiveClient(): ClientRecord | null {
  const id = resolveActiveClientId()
  if (!id) return null
  return getClientById(id) ?? null
}

/** Supabase URL from registry ref, or explicit NEXT_PUBLIC_SUPABASE_URL */
export function resolveSupabaseUrl(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (explicit) return explicit

  const client = getActiveClient()
  const ref = client?.supabaseProjectRef?.trim()
  if (ref) return `https://${ref}.supabase.co`

  return undefined
}

export function validateClientSelection(): {
  ok: boolean
  clientId: string
  missingClientId: boolean
  unknownClientId: boolean
  client: ClientRecord | null
} {
  const clientId = resolveActiveClientId()
  if (!clientId) {
    return {
      ok: false,
      clientId: '',
      missingClientId: true,
      unknownClientId: false,
      client: null,
    }
  }
  const client = getClientById(clientId)
  if (!client) {
    return {
      ok: false,
      clientId,
      missingClientId: false,
      unknownClientId: true,
      client: null,
    }
  }
  return {
    ok: true,
    clientId,
    missingClientId: false,
    unknownClientId: false,
    client,
  }
}
