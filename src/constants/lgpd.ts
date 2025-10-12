export const LGPD_CONSENT_VERSION = '1.0.0';

export const LGPD_PURPOSES = {
  INVENTORY_MANAGEMENT: 'inventory_management',
  EMPLOYEE_TRACKING: 'employee_tracking',
  TOOL_LENDING: 'tool_lending',
  MAINTENANCE_HISTORY: 'maintenance_history',
};

export const DATA_RETENTION_PERIODS = {
  LOANS: 5 * 365, // 5 years in days
  EMPLOYEE_RECORDS: 5 * 365,
  TOOL_HISTORY: 3 * 365,
  AUDIT_LOGS: 5 * 365,
};

export const DATA_CATEGORIES = {
  PERSONAL: 'personal',
  PROFESSIONAL: 'professional',
  OPERATIONAL: 'operational',
  AUDIT: 'audit',
};

export const LEGAL_BASIS = {
  CONSENT: 'consent',
  LEGITIMATE_INTEREST: 'legitimate_interest',
  LEGAL_OBLIGATION: 'legal_obligation',
  CONTRACT_EXECUTION: 'contract_execution',
};
