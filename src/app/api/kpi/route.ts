import { NextRequest, NextResponse } from 'next/server'
import type { KPIData } from '@/types/kpi'

// API URL en format JSON pour les données en temps réel
const KOBO_API_URL = 'https://kc.kobotoolbox.org/api/v1/data/3359402?format=json'

interface KoboSubmission {
  _id?: string
  _submission_time?: string
  
  // Champs possibles selon le format des données
  numero_session?: string | number
  Session?: string | number
  attentes_session?: string | number
  Satisfaction_attentes?: string | number
  thematique_session_pertinence?: string | number
  Pertinence_thematique?: string | number
  qualite_presentations_session?: string | number
  Qualite_presentations?: string | number
  intervenants_session_satisfaction?: string | number
  Satisfaction_intervenants?: string | number
  connaissances_session_acquise_utilite?: string | number
  Utilite_connaissances?: string | number
  qualite_moderation_session?: string | number
  Qualite_moderation?: string | number
  echanges_session?: string | number
  Qualite_echanges?: string | number
  logistique_session?: string | number
  Qualite_logistique?: string | number
  thematique_session_defi_pays?: string | number
  Defi_pays?: string | number
  recommandation_session?: string | number
  Recommandation?: string | number
  __version__?: string
  _uuid?: string
  _index?: number
}

function parseScore(value: string | number | undefined): number {
  if (value === undefined || value === null || value === '') return 0
  const num = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(num) ? 0 : Math.max(0, Math.min(5, num))
}

function parseSessionId(value: string | number | undefined): number {
  if (value === undefined || value === null || value === '') return 0
  const num = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(num) ? 0 : num
}

function getSessionId(submission: KoboSubmission): number {
  // Essayer les différents noms de champs possibles
  const sessionId = submission.numero_session || submission.Session
  return parseSessionId(sessionId)
}

function getAttentes(submission: KoboSubmission): number {
  return parseScore(submission.attentes_session ?? submission.Satisfaction_attentes)
}

function getPertinence(submission: KoboSubmission): number {
  return parseScore(submission.thematique_session_pertinence ?? submission.Pertinence_thematique)
}

function getQualitePresentations(submission: KoboSubmission): number {
  return parseScore(submission.qualite_presentations_session ?? submission.Qualite_presentations)
}

function getSatisfactionIntervenants(submission: KoboSubmission): number {
  return parseScore(submission.intervenants_session_satisfaction ?? submission.Satisfaction_intervenants)
}

function getUtiliteConnaissances(submission: KoboSubmission): number {
  return parseScore(submission.connaissances_session_acquise_utilite ?? submission.Utilite_connaissances)
}

function getQualiteModeration(submission: KoboSubmission): number {
  return parseScore(submission.qualite_moderation_session ?? submission.Qualite_moderation)
}

function getEchanges(submission: KoboSubmission): number {
  return parseScore(submission.echanges_session ?? submission.Qualite_echanges)
}

function getLogistique(submission: KoboSubmission): number {
  return parseScore(submission.logistique_session ?? submission.Qualite_logistique)
}

function getDefiPays(submission: KoboSubmission): number {
  return parseScore(submission.thematique_session_defi_pays ?? submission.Difi_pays ?? submission.Difi ?? submission.Défi ?? submission.Défi_pays ?? submission.Difi_pays)
}

function getRecommandation(submission: KoboSubmission): number {
  return parseScore(submission.recommandation_session ?? submission.Recommandation)
}

function parseKoboDate(dateString: string): string {
  if (!dateString) return ''
  try {
    // Format JSON: YYYY-MM-DDTHH:MM:SS ou DD/MM/YYYY HH:MM
    if (dateString.includes('T')) {
      return dateString.split('T')[0]
    }
    // Format DD/MM/YYYY HH:MM
    const parts = dateString.split(' ')
    if (parts.length >= 1) {
      const datePart = parts[0]
      const [day, month, year] = datePart.split('/')
      if (day && month && year) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
    }
    return dateString
  } catch {
    return dateString
  }
}

function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const squareDiffs = values.map(val => Math.pow(val - mean, 2))
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length
  return Math.sqrt(avgSquareDiff)
}

function calculateMean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionsParam = searchParams.get('sessions')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Fetch JSON data from KoboToolbox
    const response = await fetch(KOBO_API_URL, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store', // Pas de cache pour avoir les données en temps réel
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('KoboToolbox API error:', response.status, errorText)
      throw new Error(`Failed to fetch data from KoboToolbox: ${response.status} ${errorText}`)
    }

    const jsonData: KoboSubmission[] = await response.json()

    if (!Array.isArray(jsonData)) {
      throw new Error('Invalid data format from KoboToolbox')
    }

    // Parse and prepare all data
    const allData = jsonData.map(sub => ({
      sessionId: getSessionId(sub),
      date: sub._submission_time ? parseKoboDate(sub._submission_time) : '',
      satisfactionAttentes: getAttentes(sub),
      pertinenceThematique: getPertinence(sub),
      qualitePresentations: getQualitePresentations(sub),
      satisfactionIntervenants: getSatisfactionIntervenants(sub),
      utiliteConnaissances: getUtiliteConnaissances(sub),
      qualiteModeration: getQualiteModeration(sub),
      qualiteEchanges: getEchanges(sub),
      qualiteLogistique: getLogistique(sub),
      recommandation: getRecommandation(sub),
      defiPays: getDefiPays(sub),
    }))

    // Get all unique session IDs
    const allSessionIds = [...new Set(allData.map(d => d.sessionId))].filter(id => id > 0).sort((a, b) => a - b)

    // Get date range
    const validDates = allData.filter(d => d.date).map(d => d.date)
    const minDate = validDates.length > 0 ? Math.min(...validDates.map(d => new Date(d).getTime())) : Date.now()
    const maxDate = validDates.length > 0 ? Math.max(...validDates.map(d => new Date(d).getTime())) : Date.now()
    const dateMinSubmission = new Date(minDate).toISOString().split('T')[0]
    const dateMaxSubmission = new Date(maxDate).toISOString().split('T')[0]

    // Parse filter parameters
    const selectedSessions = sessionsParam ? sessionsParam.split(',').map(s => parseInt(s.trim(), 10)).filter(s => !isNaN(s)) : []

    // Apply filters
    const filteredData = allData.filter(d => {
      const sessionMatch = selectedSessions.length === 0 || selectedSessions.includes(d.sessionId) || d.sessionId === 0
      const startDateMatch = !startDate || !d.date || d.date >= startDate
      const endDateMatch = !endDate || !d.date || d.date <= endDate
      return sessionMatch && startDateMatch && endDateMatch
    })

    // Helper to calculate from filtered data
    const getFilteredMean = (getValue: (d: any) => number) => calculateMean(filteredData.map(getValue).filter(v => v > 0))
    const getAllMean = (getValue: (d: any) => number) => calculateMean(allData.map(getValue).filter(v => v > 0))

    // Calculate GLOBAL KPIs (non-filtered)
    const nombreReponses = allData.length

    // Score moyen par session (global) - using average of all scores for a session
    const scoreMoyenParSession = allSessionIds.map(sessionId => {
      const sessionData = allData.filter(d => d.sessionId === sessionId)
      const allScores = sessionData.flatMap(d => [
        d.satisfactionAttentes,
        d.pertinenceThematique,
        d.qualitePresentations,
        d.satisfactionIntervenants,
        d.utiliteConnaissances,
        d.qualiteModeration,
        d.qualiteEchanges,
        d.qualiteLogistique,
      ]).filter(s => s > 0)
      return {
        session: sessionId,
        score: calculateMean(allScores)
      }
    }).sort((a, b) => b.score - a.score)

    // Nombre de réponses par session (global)
    const nombreReponsesParSession = allSessionIds.map(sessionId => {
      return {
        session: sessionId,
        count: allData.filter(d => d.sessionId === sessionId).length
      }
    }).sort((a, b) => b.count - a.count)

    // Meilleure session (global)
    const meilleureSession = scoreMoyenParSession.length > 0 
      ? scoreMoyenParSession.reduce((best, current) => current.score > best.score ? current : best, scoreMoyenParSession[0])
      : { session: 0, score: 0 }

    // Pire session (global)
    const pireSession = scoreMoyenParSession.length > 0
      ? scoreMoyenParSession.reduce((worst, current) => current.score < worst.score ? current : worst, scoreMoyenParSession[0])
      : { session: 0, score: 0 }

    // Écart type global (global)
    const allAttentesScores = allData.map(d => d.satisfactionAttentes).filter(s => s > 0)
    const ecartTypeGlobal = calculateStandardDeviation(allAttentesScores)

    // Score global par jour (global)
    const scoresByDate = new Map<string, number[]>()
    allData.forEach(d => {
      if (d.date && d.satisfactionAttentes > 0) {
        if (!scoresByDate.has(d.date)) scoresByDate.set(d.date, [])
        scoresByDate.get(d.date)!.push(d.satisfactionAttentes)
      }
    })
    const scoreGlobalParJour = Array.from(scoresByDate.entries())
      .map(([date, scores]) => ({ date, score: calculateMean(scores) }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Sessions excellentes (global) - sessions with average score >= 4
    const sessionsExcellentCount = scoreMoyenParSession.filter(s => s.score >= 4).length

    // Calculate FILTERED KPIs
    const scoreMoyenGlobalFiltered = getFilteredMean(d => d.satisfactionAttentes)
    const scoreRecommandationFiltered = getFilteredMean(d => d.recommandation)
    const scoreAttentesFiltered = getFilteredMean(d => d.satisfactionAttentes)
    const scoreThematiquePertinenceFiltered = getFilteredMean(d => d.pertinenceThematique)
    const scoreQualitePresentationsFiltered = getFilteredMean(d => d.qualitePresentations)
    const scoreIntervenantsFiltered = getFilteredMean(d => d.satisfactionIntervenants)
    const scoreUtiliteConnaissancesFiltered = getFilteredMean(d => d.utiliteConnaissances)
    const scoreModerationFiltered = getFilteredMean(d => d.qualiteModeration)
    const scoreEchangesFiltered = getFilteredMean(d => d.qualiteEchanges)
    const scoreLogistiqueFiltered = getFilteredMean(d => d.qualiteLogistique)
    const scoreDefiPaysFiltered = getFilteredMean(d => d.defiPays)

    // % Recommandation Forte (recommandation >= 4)
    const filteredRecommendationScores = filteredData.map(d => d.recommandation).filter(s => s > 0)
    const pourcentageRecommandationForteFiltered = filteredRecommendationScores.length > 0
      ? (filteredRecommendationScores.filter(s => s >= 4).length / filteredRecommendationScores.length) * 100
      : 0

    // % Défi Pays (moyenne des scores / 5 * 100)
    const pourcentageDefiPaysFiltered = (scoreDefiPaysFiltered / 5) * 100

    const kpiData: KPIData = {
      // KPIs globaux (NON affectés par les filtres)
      NOMBRE_REPONSES: nombreReponses,
      SCORE_MOYEN_PAR_SESSION: scoreMoyenParSession,
      NOMBRE_REPONSES_PAR_SESSION: nombreReponsesParSession,
      MEILLEURE_SESSION: meilleureSession,
      PIRE_SESSION: pireSession,
      ECART_TYPE_GLOBAL: ecartTypeGlobal,
      SCORE_GLOBAL_PAR_JOUR: scoreGlobalParJour,
      SCORE_SESSIONS_EXCELLENTES: sessionsExcellentCount,

      // KPIs filtrés (affectés par les filtres)
      SCORE_MOYEN_GLOBAL_FILTERED: scoreMoyenGlobalFiltered,
      SCORE_RECOMMANDATION_FILTERED: scoreRecommandationFiltered,
      SCORE_ATTENTES_FILTERED: scoreAttentesFiltered,
      SCORE_THEMATIQUE_PERTINENCE_FILTERED: scoreThematiquePertinenceFiltered,
      SCORE_QUALITE_PRESENTATIONS_FILTERED: scoreQualitePresentationsFiltered,
      SCORE_INTERVENANTS_FILTERED: scoreIntervenantsFiltered,
      SCORE_UTILITE_CONNAISSANCES_FILTERED: scoreUtiliteConnaissancesFiltered,
      SCORE_MODERATION_FILTERED: scoreModerationFiltered,
      SCORE_ECHANGES_FILTERED: scoreEchangesFiltered,
      SCORE_LOGISTIQUE_FILTERED: scoreLogistiqueFiltered,
      SCORE_DEFI_PAYS_FILTERED: scoreDefiPaysFiltered,
      POURCENTAGE_RECOMMANDATION_FORTE_FILTERED: pourcentageRecommandationForteFiltered,
      POURCENTAGE_DEFI_PAYS_FILTERED: pourcentageDefiPaysFiltered,

      // Métadonnées
      DATE_MIN_SUBMISSION: dateMinSubmission,
      DATE_MAX_SUBMISSION: dateMaxSubmission,
      SESSIONS_DISPONIBLES: allSessionIds,
    }

    return NextResponse.json(kpiData, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('Error fetching KPI data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KPI data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
