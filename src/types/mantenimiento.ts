export interface WPPlugin {
  name: string;
  slug: string;
  status: "active" | "inactive";
  version_actual: string;
  version_nueva: string | null;
  requiere_actualizacion: boolean;
  isUpdatedThisMonth?: boolean;
}
