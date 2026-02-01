'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { 
  Filter, TrendingUp, TrendingDown, AlertCircle, 
  CheckCircle2, Calendar, Users, BarChart3, 
  PieChart as PieChartIcon, Activity, Star, MessageSquare 
} from 'lucide-react'
import type { KPIData, FilterState } from '@/types/kpi'

// AAEA Colors
const COLOR_BLEU_NUIT = '#2D338F'
const COLOR_VERT_MENTHE = '#039A5A'
const COLOR_BLEU_CERULEEN = '#00AEEF'
const COLOR_NOIR = '#000000'
const COLOR_SESSION_A_AMELIORER = '#F08080'

// Dynamic Score Colors
const COLOR_EXCELLENTE = 'rgb(3, 154, 90)'
const COLOR_SATISFAISANTE = 'rgb(0, 174, 239)'
const COLOR_INSUFFISANTE = 'rgb(240, 128, 128)'

const getScoreDynamicColor = (score: number) => {
  if (score >= 4) return COLOR_EXCELLENTE
  if (score >= 3) return COLOR_SATISFAISANTE
  return COLOR_INSUFFISANTE
}

const getScoreLabel = (score: number) => {
  if (score >= 4) return 'Excellente'
  if (score >= 3) return 'Satisfaisante'
  return 'Insuffisante'
}

const getConsensusLabel = (ecartType: number) => {
  if (ecartType < 0.5) return { label: 'Forte', color: COLOR_VERT_MENTHE }
  if (ecartType < 1.0) return { label: 'Moyenne', color: COLOR_BLEU_CERULEEN }
  return { label: 'Faible', color: COLOR_SESSION_A_AMELIORER }
}

export default function Dashboard() {
  const [data, setData] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    sessions: [],
    startDate: null,
    endDate: null
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (filters.sessions.length > 0) {
        params.append('sessions', filters.sessions.join(','))
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate)
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate)
      }
      
      const url = params.toString() 
        ? `/api/kpi?${params.toString()}`
        : '/api/kpi'
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch KPI data')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters])

  const toggleSession = (sessionId: number) => {
    setFilters(prev => ({
      ...prev,
      sessions: prev.sessions.includes(sessionId)
        ? prev.sessions.filter(s => s !== sessionId)
        : [...prev.sessions, sessionId]
    }))
  }

  const clearFilters = () => {
    setFilters({ sessions: [], startDate: null, endDate: null })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchData}>Réessayer</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const scoreGlobalColor = getScoreDynamicColor(data.SCORE_MOYEN_GLOBAL_FILTERED)
  const consensus = getConsensusLabel(data.ECART_TYPE_GLOBAL)

  const recommendPieData = [
    { name: 'Recommandation Forte', value: data.POURCENTAGE_RECOMMANDATION_FORTE_FILTERED, color: getScoreDynamicColor(data.SCORE_RECOMMANDATION_FILTERED) },
    { name: 'Autre', value: 100 - data.POURCENTAGE_RECOMMANDATION_FORTE_FILTERED, color: '#E5E7EB' }
  ]

  const defiPieData = [
    { name: 'Défi Thématique', value: data.POURCENTAGE_DEFI_PAYS_FILTERED, color: getScoreDynamicColor(data.SCORE_DEFI_PAYS_FILTERED) },
    { name: 'Autre', value: 100 - data.POURCENTAGE_DEFI_PAYS_FILTERED, color: '#E5E7EB' }
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header - 3 Colonnes Égales */}
      <header className="bg-white border-b-2 shadow-sm" style={{ borderColor: COLOR_BLEU_NUIT }}>
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Colonne gauche - Logo */}
            <div className="flex justify-center">
              <img
                src="/logo_aaea.jpg"
                alt="AAEA Logo"
                className="h-64 w-64 object-contain"
              />
            </div>
            
            {/* Colonne centre - Titre avec couleur BLEU_NUIT */}
            <div className="text-center">
              <h1 
                className="text-2xl md:text-3xl font-bold mb-2"
                style={{ color: COLOR_BLEU_NUIT }}
              >
                Evaluation des Sessions - ICE 2026
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                Indicateurs de satisfaction des sessions
              </p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <Badge style={{ backgroundColor: scoreGlobalColor, color: 'white' }}>
                  {getScoreLabel(data.SCORE_MOYEN_GLOBAL_FILTERED)}
                </Badge>
                <Badge variant="outline">
                  Score: {data.SCORE_MOYEN_GLOBAL_FILTERED.toFixed(2)}/5
                </Badge>
              </div>
            </div>
            
            {/* Colonne droite - Badge réponses + bouton filtres */}
            <div className="flex flex-col items-center gap-3">
              <Badge 
                variant="outline" 
                className="text-lg px-4 py-2"
                style={{ 
                  borderColor: getScoreDynamicColor(data.SCORE_MOYEN_GLOBAL_FILTERED),
                  color: getScoreDynamicColor(data.SCORE_MOYEN_GLOBAL_FILTERED)
                }}
              >
                <Users className="h-5 w-5 mr-2" />
                {data.NOMBRE_REPONSES} Réponses
              </Badge>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtres
                {filters.sessions.length > 0 || filters.startDate || filters.endDate ? (
                  <Badge variant="secondary" className="ml-1">
                    Actif
                  </Badge>
                ) : null}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Panneau de Filtres */}
      {showFilters && (
        <div className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="space-y-6">
              {/* Filtre Sessions - 100% width */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Sessions</Label>
                <div className="max-h-48 overflow-y-auto border rounded p-2 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                    {data.SESSIONS_DISPONIBLES.map(sessionId => (
                      <div key={sessionId} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`session-${sessionId}`}
                          checked={filters.sessions.includes(sessionId)}
                          onCheckedChange={() => toggleSession(sessionId)}
                        />
                        <Label
                          htmlFor={`session-${sessionId}`}
                          className="text-sm cursor-pointer whitespace-nowrap"
                        >
                          Session {sessionId}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filtre Dates - 2 cols */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Filtre Date Début */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Date de début</Label>
                  <Input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value || null }))}
                    min={data.DATE_MIN_SUBMISSION}
                    max={data.DATE_MAX_SUBMISSION}
                  />
                </div>

                {/* Filtre Date Fin */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Date de fin</Label>
                  <Input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value || null }))}
                    min={data.DATE_MIN_SUBMISSION}
                    max={data.DATE_MAX_SUBMISSION}
                  />
                </div>
              </div>
            
              {/* Légende des couleurs + bouton reset */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: COLOR_EXCELLENTE }}></div>
                    <span>Excellente (≥4)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: COLOR_SATISFAISANTE }}></div>
                    <span>Satisfaisante (3)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: COLOR_INSUFFISANTE }}></div>
                    <span>Insuffisante (≤2)</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Réinitialiser les filtres
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 flex-grow">
        <div className="space-y-6">
          {/* KPIs Principaux */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Score Moyen Global */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Score Moyen Global</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2" style={{ color: getScoreDynamicColor(data.SCORE_MOYEN_GLOBAL_FILTERED) }}>
                  {data.SCORE_MOYEN_GLOBAL_FILTERED.toFixed(2)}
                </div>
                <Progress 
                  value={(data.SCORE_MOYEN_GLOBAL_FILTERED / 5) * 100} 
                  className="h-2"
                  style={{ 
                    '& [role=progressbar]': { backgroundColor: getScoreDynamicColor(data.SCORE_MOYEN_GLOBAL_FILTERED) }
                  }}
                />
              </CardContent>
            </Card>

            {/* Recommandation */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  Recommandation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2" style={{ color: getScoreDynamicColor(data.SCORE_RECOMMANDATION_FILTERED) }}>
                  {data.SCORE_RECOMMANDATION_FILTERED.toFixed(2)}
                </div>
                <Progress 
                  value={(data.SCORE_RECOMMANDATION_FILTERED / 5) * 100} 
                  className="h-2"
                  style={{ 
                    '& [role=progressbar]': { backgroundColor: getScoreDynamicColor(data.SCORE_RECOMMANDATION_FILTERED) }
                  }}
                />
              </CardContent>
            </Card>

            {/* Sessions Excellent */}
            <Card style={{ borderColor: COLOR_VERT_MENTHE }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Sessions Excellent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2" style={{ color: COLOR_VERT_MENTHE }}>
                  {data.SCORE_SESSIONS_EXCELLENTES}
                </div>
                <p className="text-xs text-gray-500">Score ≥ 4</p>
              </CardContent>
            </Card>

            {/* % Recommandation Forte */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-600">% Recommandation Forte</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie
                      data={recommendPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={40}
                      dataKey="value"
                    >
                      {recommendPieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center text-2xl font-bold mt-2" style={{ color: getScoreDynamicColor(data.SCORE_RECOMMANDATION_FILTERED) }}>
                  {data.POURCENTAGE_RECOMMANDATION_FORTE_FILTERED.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            {/* % Défi Thématique pour votre pays */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-600">% Défi Thématique pour votre pays</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie
                      data={defiPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={40}
                      dataKey="value"
                    >
                      {defiPieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center text-2xl font-bold mt-2" style={{ color: getScoreDynamicColor(data.SCORE_DEFI_PAYS_FILTERED) }}>
                  {data.POURCENTAGE_DEFI_PAYS_FILTERED.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critères de Qualité */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Critères de Qualité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Satisfaction Attentes</span>
                    <span className="font-bold" style={{ color: getScoreDynamicColor(data.SCORE_ATTENTES_FILTERED) }}>
                      {data.SCORE_ATTENTES_FILTERED.toFixed(2)}
                    </span>
                  </div>
                  <Progress 
                    value={(data.SCORE_ATTENTES_FILTERED / 5) * 100} 
                    className="h-2"
                    style={{ 
                      '& [role=progressbar]': { backgroundColor: getScoreDynamicColor(data.SCORE_ATTENTES_FILTERED) }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pertinence Thématique</span>
                    <span className="font-bold" style={{ color: getScoreDynamicColor(data.SCORE_THEMATIQUE_PERTINENCE_FILTERED) }}>
                      {data.SCORE_THEMATIQUE_PERTINENCE_FILTERED.toFixed(2)}
                    </span>
                  </div>
                  <Progress 
                    value={(data.SCORE_THEMATIQUE_PERTINENCE_FILTERED / 5) * 100} 
                    className="h-2"
                    style={{ 
                      '& [role=progressbar]': { backgroundColor: getScoreDynamicColor(data.SCORE_THEMATIQUE_PERTINENCE_FILTERED) }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Qualité Présentations</span>
                    <span className="font-bold" style={{ color: getScoreDynamicColor(data.SCORE_QUALITE_PRESENTATIONS_FILTERED) }}>
                      {data.SCORE_QUALITE_PRESENTATIONS_FILTERED.toFixed(2)}
                    </span>
                  </div>
                  <Progress 
                    value={(data.SCORE_QUALITE_PRESENTATIONS_FILTERED / 5) * 100} 
                    className="h-2"
                    style={{ 
                      '& [role=progressbar]': { backgroundColor: getScoreDynamicColor(data.SCORE_QUALITE_PRESENTATIONS_FILTERED) }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Satisfaction Intervenants</span>
                    <span className="font-bold" style={{ color: getScoreDynamicColor(data.SCORE_INTERVENANTS_FILTERED) }}>
                      {data.SCORE_INTERVENANTS_FILTERED.toFixed(2)}
                    </span>
                  </div>
                  <Progress 
                    value={(data.SCORE_INTERVENANTS_FILTERED / 5) * 100} 
                    className="h-2"
                    style={{ 
                      '& [role=progressbar]': { backgroundColor: getScoreDynamicColor(data.SCORE_INTERVENANTS_FILTERED) }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Utilité Connaissances</span>
                    <span className="font-bold" style={{ color: getScoreDynamicColor(data.SCORE_UTILITE_CONNAISSANCES_FILTERED) }}>
                      {data.SCORE_UTILITE_CONNAISSANCES_FILTERED.toFixed(2)}
                    </span>
                  </div>
                  <Progress 
                    value={(data.SCORE_UTILITE_CONNAISSANCES_FILTERED / 5) * 100} 
                    className="h-2"
                    style={{ 
                      '& [role=progressbar]': { backgroundColor: getScoreDynamicColor(data.SCORE_UTILITE_CONNAISSANCES_FILTERED) }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Qualité Modération</span>
                    <span className="font-bold" style={{ color: getScoreDynamicColor(data.SCORE_MODERATION_FILTERED) }}>
                      {data.SCORE_MODERATION_FILTERED.toFixed(2)}
                    </span>
                  </div>
                  <Progress 
                    value={(data.SCORE_MODERATION_FILTERED / 5) * 100} 
                    className="h-2"
                    style={{ 
                      '& [role=progressbar]': { backgroundColor: getScoreDynamicColor(data.SCORE_MODERATION_FILTERED) }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Qualité Échanges</span>
                    <span className="font-bold" style={{ color: getScoreDynamicColor(data.SCORE_ECHANGES_FILTERED) }}>
                      {data.SCORE_ECHANGES_FILTERED.toFixed(2)}
                    </span>
                  </div>
                  <Progress 
                    value={(data.SCORE_ECHANGES_FILTERED / 5) * 100} 
                    className="h-2"
                    style={{ 
                      '& [role=progressbar]': { backgroundColor: getScoreDynamicColor(data.SCORE_ECHANGES_FILTERED) }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Qualité Logistique</span>
                    <span className="font-bold" style={{ color: getScoreDynamicColor(data.SCORE_LOGISTIQUE_FILTERED) }}>
                      {data.SCORE_LOGISTIQUE_FILTERED.toFixed(2)}
                    </span>
                  </div>
                  <Progress 
                    value={(data.SCORE_LOGISTIQUE_FILTERED / 5) * 100} 
                    className="h-2"
                    style={{ 
                      '& [role=progressbar]': { backgroundColor: getScoreDynamicColor(data.SCORE_LOGISTIQUE_FILTERED) }
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs Globaux - Graphiques */}
          <div className="space-y-6">
            {/* Score Moyen par Session - 100% width */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Score Moyen par Session
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.SCORE_MOYEN_PAR_SESSION}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="session" 
                      label={{ value: 'Session', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      domain={[0, 5]}
                      label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Bar dataKey="score" fill={COLOR_BLEU_CERULEEN} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Volume de Réponses par Session - 100% width */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Volume de Réponses par Session
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.NOMBRE_REPONSES_PAR_SESSION}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="session"
                      label={{ value: 'Session', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Réponses', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLOR_VERT_MENTHE} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Évolution Temporelle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Évolution Temporelle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.SCORE_GLOBAL_PAR_JOUR}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
                    />
                  <YAxis 
                    domain={[0, 5]}
                    label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
                    />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke={COLOR_BLEU_NUIT}
                    strokeWidth={2}
                    dot={{ fill: COLOR_BLEU_NUIT, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Meilleure et Pire Session */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Meilleure Session */}
            <Card style={{ borderColor: COLOR_VERT_MENTHE, borderWidth: 2 }}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: COLOR_VERT_MENTHE }}>
                  <CheckCircle2 className="h-5 w-5" />
                  Meilleure Session
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2" style={{ color: getScoreDynamicColor(data.MEILLEURE_SESSION.score) }}>
                    {data.MEILLEURE_SESSION.score.toFixed(2)}
                  </div>
                  <p className="text-xl font-semibold mb-1">Session {data.MEILLEURE_SESSION.session}</p>
                  <Badge style={{ backgroundColor: getScoreDynamicColor(data.MEILLEURE_SESSION.score), color: 'white' }}>
                    {getScoreLabel(data.MEILLEURE_SESSION.score)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Pire Session */}
            <Card style={{ borderColor: COLOR_SESSION_A_AMELIORER, borderWidth: 2 }}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: COLOR_SESSION_A_AMELIORER }}>
                  <AlertCircle className="h-5 w-5" />
                  Session à Améliorer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2" style={{ color: getScoreDynamicColor(data.PIRE_SESSION.score) }}>
                    {data.PIRE_SESSION.score.toFixed(2)}
                  </div>
                  <p className="text-xl font-semibold mb-1">Session {data.PIRE_SESSION.session}</p>
                  <Badge style={{ backgroundColor: getScoreDynamicColor(data.PIRE_SESSION.score), color: 'white' }}>
                    {getScoreLabel(data.PIRE_SESSION.score)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Consensus des Réponses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Consensus des Réponses (Écart Type)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-5xl font-bold" style={{ color: consensus.color }}>
                    {data.ECART_TYPE_GLOBAL.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Écart type global</p>
                </div>
                <div className="text-right">
                  <Badge className="text-lg px-4 py-2" style={{ backgroundColor: consensus.color, color: 'white' }}>
                    Consensus {consensus.label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer Sticky */}
      <footer className="bg-white border-t mt-auto" style={{ borderColor: COLOR_BLEU_NUIT }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {data.NOMBRE_REPONSES} réponses
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {data.DATE_MIN_SUBMISSION} - {data.DATE_MAX_SUBMISSION}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              © 2026 AAEA - Dashboard d'Évaluation des Sessions ICE
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
