export interface SessionScore {
  session: number;
  score: number;
}

export interface SessionCount {
  session: number;
  count: number;
}

export interface DailyScore {
  date: string;
  score: number;
}

export interface KPIData {
  // KPIs globaux (NON affectés par les filtres)
  NOMBRE_REPONSES: number;
  SCORE_MOYEN_PAR_SESSION: SessionScore[];
  NOMBRE_REPONSES_PAR_SESSION: SessionCount[];
  MEILLEURE_SESSION: SessionScore;
  PIRE_SESSION: SessionScore;
  ECART_TYPE_GLOBAL: number;
  SCORE_GLOBAL_PAR_JOUR: DailyScore[];
  SCORE_SESSIONS_EXCELLENTES: number;

  // KPIs filtrés (affectés par les filtres)
  SCORE_MOYEN_GLOBAL_FILTERED: number;
  SCORE_RECOMMANDATION_FILTERED: number;
  SCORE_ATTENTES_FILTERED: number;
  SCORE_THEMATIQUE_PERTINENCE_FILTERED: number;
  SCORE_QUALITE_PRESENTATIONS_FILTERED: number;
  SCORE_INTERVENANTS_FILTERED: number;
  SCORE_UTILITE_CONNAISSANCES_FILTERED: number;
  SCORE_MODERATION_FILTERED: number;
  SCORE_ECHANGES_FILTERED: number;
  SCORE_LOGISTIQUE_FILTERED: number;
  SCORE_DEFI_PAYS_FILTERED: number;
  POURCENTAGE_RECOMMANDATION_FORTE_FILTERED: number;
  POURCENTAGE_DEFI_PAYS_FILTERED: number;

  // Métadonnées
  DATE_MIN_SUBMISSION: string;
  DATE_MAX_SUBMISSION: string;
  SESSIONS_DISPONIBLES: number[];
}

export interface FilterState {
  sessions: number[];
  startDate: string | null;
  endDate: string | null;
}
