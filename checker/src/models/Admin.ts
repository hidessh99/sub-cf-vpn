export interface Admin {
  id: number;
  username: string;
  password?: string; // Optional so we can exclude it when passing around
  created_at: string;
  updated_at: string;
}
