import { type Iframe, type InsertIframe } from "@shared/schema";

// We keep this generic structure even though we use Supabase, 
// to satisfy the template requirements.
export interface IStorage {
  // Add methods if we ever need internal storage
}

export class MemStorage implements IStorage {
  constructor() {}
}

export const storage = new MemStorage();
