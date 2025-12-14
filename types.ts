export interface CaseSide {
  name: string;
  type?: string;
}

export interface CaseSides {
  Plaintiffs?: CaseSide[];
  Defendants?: CaseSide[];
  Third?: CaseSide[];
  Others?: CaseSide[];
}

export interface CaseDataJson {
  court?: string;
  judge?: string;
  case_category_2?: string;
  issue_result?: string;
  case_consideration?: string; // Level
  type?: string; // Alternative Level
  date_issue?: string; // dd.mm.yyyy
  date_of_entry?: string; // dd.mm.yyyy
  url?: string;
  sides?: CaseSides;
}

export interface CaseRecord {
  id?: string; // Generated or from API
  case_number: string;
  content_act: string; // The text content
  data_json: CaseDataJson;
}

export interface FilterState {
  court: string;
  judge: string;
  category: string;
  result: string;
  level: string;
  side: string;
  dateIssueFrom: string;
  dateIssueTo: string;
  dateEntryFrom: string;
  dateEntryTo: string;
  inForceOnly: boolean;
}

export type SortOption = 'date_desc' | 'date_asc' | 'entry_desc' | 'entry_asc' | 'court_asc' | 'judge_asc';

export interface SearchParams {
  query: string;
  caseNumber: string;
}
