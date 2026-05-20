export interface IntuneConfig {
  method: string;
  steps: string[];
  settings_path: string | null;
  oma_uri: string | null;
  data_type: string | null;
  value: string;
}

export interface GPOConfig {
  steps: string[];
  policy_path: string;
  setting_name: string;
  value: string;
  admx: string | null;
  registry_key: string | null;
  registry_value: string | null;
  registry_data: string | null;
}

export interface PowerShellScripts {
  detection: string;
  implementation: string;
  validation: string;
}

export interface EntraConfig {
  applicable: boolean;
  steps: string[];
  portal_path: string | null;
  policy_type: string | null;
  settings: { name: string; value: string }[];
  conditional_access: boolean;
  ca_policy_name: string | null;
  graph_api: string | null;
  powershell: string | null;
  notes: string | null;
}

export interface Rollback {
  intune: string;
  gpo: string;
  entra: string | null;
  powershell: string;
}

export interface ScriptsResult {
  detection: string;
  implementation: string;
  validation: string;
  rollback: Rollback;
}

export interface Reference {
  title: string;
  url: string;
  type: string;
}

export interface GuideResult {
  confidence: 'High' | 'Medium' | 'Low';
  summary: string;
  category: string;
  affected_os: string[];
  user_impact: 'Low' | 'Medium' | 'High';
  platforms: string[];
  intune: IntuneConfig;
  gpo: GPOConfig;
  entra: EntraConfig;
  validation_steps: string[];
  risks: string[];
  references: Reference[];
  // Scripts loaded on demand
  scripts?: ScriptsResult;
}

export interface HistoryItem {
  id: string;
  query: string;
  ts: string;
  confidence: string;
}

export interface FavoriteItem {
  id: string;
  query: string;
  ts: string;
}
