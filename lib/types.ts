// Declared as `type` aliases (not `interface`) so their shapes are assignable
// to Record<string, unknown> — a requirement for supabase-js's GenericTable.
// Interfaces are not assignable to Record<string, unknown> (they can be
// augmented via declaration merging), which makes insert/upsert types resolve
// to `never`.
export type Team = {
  team_id: string;
  team_name: string;
  participant_1: string;
  participant_2: string | null;
  participant_3: string | null;
  attendance: boolean;
  checkin_time: string | null; // ISO timestamp string
  created_at?: string;
}

// Master participant record — imported from the uploaded CSV into Supabase.
// Mirrors public.participants (see supabase/schema.sql). Future modules
// (QR, email, attendance, reports) read from this table.
export type Participant = {
  id: string;
  team_number: string;
  participant_name: string;
  participant_email: string | null;
  participant_phone: string | null;
  college: string | null;
  registration_type: string | null;
  course: string | null;
  registered_at: string | null;
  created_at?: string;
  updated_at?: string;
}

// Fields the import route supplies on insert/upsert. id, created_at and
// updated_at are database-generated, so they're omitted here.
export type ParticipantInsert = Omit<
  Participant,
  "id" | "created_at" | "updated_at"
>;

// Minimal Supabase Database type so the client gets typed query results.
// The empty Views/Functions/Enums/CompositeTypes keys are required for the
// schema to satisfy supabase-js's GenericSchema constraint — without them
// insert/upsert payloads resolve to `never`. Extend Tables when adding tables.
export interface Database {
  public: {
    Tables: {
      teams: {
        Row: Team;
        Insert: Omit<Team, "created_at">;
        Update: Partial<Team>;
        Relationships: [];
      };
      participants: {
        Row: Participant;
        Insert: ParticipantInsert;
        Update: Partial<Participant>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
