export interface User {
  id?: string;
  nome?: string;
  nivel?: number;
  email?: string;
  cargo?: string;
  ativo?: boolean;
  permissions?: string[];
}
