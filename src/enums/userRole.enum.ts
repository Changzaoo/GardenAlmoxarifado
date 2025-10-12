/**
 * Enum de Níveis de Permissão de Usuário
 */

export enum NivelPermissaoEnum {
  ADMIN = 'admin',
  MASTER = 'master',
  GERENTE = 'gerente',
  SUPERVISOR = 'supervisor',
  USUARIO = 'usuario',
  ALMOXARIFE = 'almoxarife',
  FUNCIONARIO = 'funcionario',
  VISUALIZADOR = 'visualizador'
}

export const NivelPermissaoLabels: Record<NivelPermissaoEnum, string> = {
  [NivelPermissaoEnum.ADMIN]: 'Administrador',
  [NivelPermissaoEnum.MASTER]: 'Master',
  [NivelPermissaoEnum.GERENTE]: 'Gerente',
  [NivelPermissaoEnum.SUPERVISOR]: 'Supervisor',
  [NivelPermissaoEnum.USUARIO]: 'Usuário',
  [NivelPermissaoEnum.ALMOXARIFE]: 'Almoxarife',
  [NivelPermissaoEnum.FUNCIONARIO]: 'Funcionário',
  [NivelPermissaoEnum.VISUALIZADOR]: 'Visualizador'
};

export const NivelPermissaoHierarchy: Record<NivelPermissaoEnum, number> = {
  [NivelPermissaoEnum.ADMIN]: 100,
  [NivelPermissaoEnum.MASTER]: 90,
  [NivelPermissaoEnum.GERENTE]: 80,
  [NivelPermissaoEnum.SUPERVISOR]: 70,
  [NivelPermissaoEnum.ALMOXARIFE]: 60,
  [NivelPermissaoEnum.USUARIO]: 50,
  [NivelPermissaoEnum.FUNCIONARIO]: 40,
  [NivelPermissaoEnum.VISUALIZADOR]: 10
};

/**
 * Verifica se um nível de permissão tem autoridade sobre outro
 */
export function hasHigherPermission(
  nivel1: NivelPermissaoEnum,
  nivel2: NivelPermissaoEnum
): boolean {
  return NivelPermissaoHierarchy[nivel1] > NivelPermissaoHierarchy[nivel2];
}

/**
 * Verifica se um nível de permissão tem pelo menos a autoridade de outro
 */
export function hasPermissionOrHigher(
  nivelUsuario: NivelPermissaoEnum,
  nivelRequerido: NivelPermissaoEnum
): boolean {
  return NivelPermissaoHierarchy[nivelUsuario] >= NivelPermissaoHierarchy[nivelRequerido];
}
