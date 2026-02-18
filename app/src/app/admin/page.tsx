'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Navbar } from '@/components/navbar'
import { useI18n } from '@/lib/i18n/context'
import { COURSES } from '@/lib/courses-data'
import Link from 'next/link'

// Admin wallet addresses (in production, check on-chain role)
const ADMIN_WALLETS = [
  process.env.NEXT_PUBLIC_ADMIN_WALLET || '',
]

type Tab = 'courses' | 'create' | 'students' | 'analytics'

interface NewLesson {
  title: string
  titlePt: string
  type: 'TEXT' | 'VIDEO' | 'QUIZ'
  content: string
  videoUrl: string
}

interface NewModule {
  title: string
  titlePt: string
  lessons: NewLesson[]
}

interface NewCourse {
  title: string
  titleEn: string
  slug: string
  description: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  category: string
  icon: string
  tokenGated: boolean
  requiredToken: string
  modules: NewModule[]
}

const EMPTY_LESSON: NewLesson = { title: '', titlePt: '', type: 'TEXT', content: '', videoUrl: '' }
const EMPTY_MODULE: NewModule = { title: '', titlePt: '', lessons: [{ ...EMPTY_LESSON }] }
const EMPTY_COURSE: NewCourse = {
  title: '', titleEn: '', slug: '', description: '',
  difficulty: 'BEGINNER', category: '', icon: '📚',
  tokenGated: false, requiredToken: '',
  modules: [{ ...EMPTY_MODULE, lessons: [{ ...EMPTY_LESSON }] }],
}

// Mock analytics data
const ANALYTICS = {
  totalStudents: 523,
  activeThisWeek: 187,
  avgCompletionRate: 68,
  totalCertificates: 214,
  topCourse: 'Introdução ao Solana',
  avgQuizScore: 82,
  revenueSOL: 0, // Free platform
  weeklyGrowth: 12.5,
}

const MOCK_STUDENTS = [
  { name: 'Alice.sol', wallet: '7xKX...m3fR', courses: 3, xp: 4200, lastActive: '2h ago' },
  { name: 'Bob DeFi', wallet: '9yRT...z4mQ', courses: 2, xp: 3800, lastActive: '5h ago' },
  { name: 'Carlos Dev', wallet: '3pMN...k8sT', courses: 4, xp: 3100, lastActive: '1d ago' },
  { name: 'Diana.eth', wallet: '5qWE...n2vR', courses: 1, xp: 2500, lastActive: '3h ago' },
  { name: 'Eduardo Chain', wallet: '8rTY...p6bX', courses: 2, xp: 1900, lastActive: '12h ago' },
]

export default function AdminPage() {
  const { t } = useI18n()
  const { publicKey, connected } = useWallet()
  const [activeTab, setActiveTab] = useState<Tab>('courses')
  const [newCourse, setNewCourse] = useState<NewCourse>({ ...EMPTY_COURSE, modules: [{ title: '', titlePt: '', lessons: [{ ...EMPTY_LESSON }] }] })
  const [saved, setSaved] = useState(false)
  const [expandedModule, setExpandedModule] = useState<number>(0)

  // In demo mode, allow access without wallet for presentation
  const isAdmin = true // In production: connected && publicKey && ADMIN_WALLETS.includes(publicKey.toBase58())

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
            <p className="text-gray-400">Conecte uma carteira de administrador para acessar o painel.</p>
          </div>
        </div>
      </div>
    )
  }

  const updateModule = (mi: number, field: string, value: string) => {
    const modules = [...newCourse.modules]
    ;(modules[mi] as any)[field] = value
    setNewCourse({ ...newCourse, modules })
  }

  const updateLesson = (mi: number, li: number, field: string, value: string) => {
    const modules = [...newCourse.modules]
    ;(modules[mi].lessons[li] as any)[field] = value
    setNewCourse({ ...newCourse, modules })
  }

  const addModule = () => {
    setNewCourse({
      ...newCourse,
      modules: [...newCourse.modules, { title: '', titlePt: '', lessons: [{ ...EMPTY_LESSON }] }],
    })
    setExpandedModule(newCourse.modules.length)
  }

  const addLesson = (mi: number) => {
    const modules = [...newCourse.modules]
    modules[mi].lessons.push({ ...EMPTY_LESSON })
    setNewCourse({ ...newCourse, modules })
  }

  const removeModule = (mi: number) => {
    if (newCourse.modules.length <= 1) return
    const modules = newCourse.modules.filter((_, i) => i !== mi)
    setNewCourse({ ...newCourse, modules })
  }

  const removeLesson = (mi: number, li: number) => {
    if (newCourse.modules[mi].lessons.length <= 1) return
    const modules = [...newCourse.modules]
    modules[mi].lessons = modules[mi].lessons.filter((_, i) => i !== li)
    setNewCourse({ ...newCourse, modules })
  }

  const handleSave = async () => {
    // In production: POST to /api/admin/courses
    console.log('Saving course:', newCourse)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'courses', label: 'Cursos', icon: '📚' },
    { key: 'create', label: 'Criar Curso', icon: '➕' },
    { key: 'students', label: 'Alunos', icon: '👥' },
    { key: 'analytics', label: 'Analytics', icon: '📊' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Painel do Instrutor</h1>
            <p className="text-gray-400 mt-1">Gerencie cursos, alunos e conteúdo</p>
          </div>
          <div className="flex items-center gap-2 bg-green-900/30 text-green-400 px-3 py-1.5 rounded-lg text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            Admin
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-800 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-t-lg text-sm transition-colors ${
                activeTab === tab.key
                  ? 'bg-gray-800 text-white border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Cursos Publicados ({COURSES.length})</h2>
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm transition-colors"
              >
                ➕ Novo Curso
              </button>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 text-left text-sm text-gray-400">
                    <th className="px-4 py-3">Curso</th>
                    <th className="px-4 py-3">Dificuldade</th>
                    <th className="px-4 py-3">Módulos</th>
                    <th className="px-4 py-3">Alunos</th>
                    <th className="px-4 py-3">Token-Gated</th>
                    <th className="px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {COURSES.map((course) => (
                    <tr key={course.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{course.icon}</span>
                          <div>
                            <div className="font-medium">{course.title}</div>
                            <div className="text-xs text-gray-500">{course.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          course.difficulty === 'BEGINNER' ? 'bg-green-900/50 text-green-400' :
                          course.difficulty === 'INTERMEDIATE' ? 'bg-yellow-900/50 text-yellow-400' :
                          'bg-red-900/50 text-red-400'
                        }`}>
                          {course.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{course.modules.length}</td>
                      <td className="px-4 py-3 text-gray-400">{course.students}</td>
                      <td className="px-4 py-3">
                        {course.tokenGated ? <span className="text-yellow-400">🔒 Yes</span> : <span className="text-gray-500">No</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link href={`/courses/${course.slug}`} className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
                            👁️ Ver
                          </Link>
                          <button className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
                            ✏️ Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Course Tab */}
        {activeTab === 'create' && (
          <div className="space-y-6">
            {/* Course Info */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Informações do Curso</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Título (Português)</label>
                  <input
                    type="text"
                    value={newCourse.title}
                    onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                    placeholder="Ex: Introdução ao Solana"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Title (English)</label>
                  <input
                    type="text"
                    value={newCourse.titleEn}
                    onChange={e => setNewCourse({ ...newCourse, titleEn: e.target.value })}
                    placeholder="Ex: Introduction to Solana"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    value={newCourse.slug}
                    onChange={e => setNewCourse({ ...newCourse, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="intro-solana"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={newCourse.category}
                    onChange={e => setNewCourse({ ...newCourse, category: e.target.value })}
                    placeholder="Blockchain, DeFi, NFT..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Descrição</label>
                  <textarea
                    rows={3}
                    value={newCourse.description}
                    onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                    placeholder="Uma breve descrição do curso..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Dificuldade</label>
                  <select
                    value={newCourse.difficulty}
                    onChange={e => setNewCourse({ ...newCourse, difficulty: e.target.value as any })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="BEGINNER">Iniciante</option>
                    <option value="INTERMEDIATE">Intermediário</option>
                    <option value="ADVANCED">Avançado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ícone (Emoji)</label>
                  <input
                    type="text"
                    value={newCourse.icon}
                    onChange={e => setNewCourse({ ...newCourse, icon: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none text-2xl"
                  />
                </div>
              </div>

              {/* Token Gating */}
              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCourse.tokenGated}
                    onChange={e => setNewCourse({ ...newCourse, tokenGated: e.target.checked })}
                    className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-600"
                  />
                  <div>
                    <div className="font-medium">🔒 Token-Gated</div>
                    <div className="text-xs text-gray-400">Exigir SPL token para acesso</div>
                  </div>
                </label>
                {newCourse.tokenGated && (
                  <input
                    type="text"
                    value={newCourse.requiredToken}
                    onChange={e => setNewCourse({ ...newCourse, requiredToken: e.target.value })}
                    placeholder="Token mint address..."
                    className="w-full mt-3 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none font-mono text-sm"
                  />
                )}
              </div>
            </div>

            {/* Modules & Lessons */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Módulos & Aulas</h2>
                <button onClick={addModule} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm transition-colors">
                  ➕ Adicionar Módulo
                </button>
              </div>

              {newCourse.modules.map((mod, mi) => (
                <div key={mi} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <button
                    onClick={() => setExpandedModule(expandedModule === mi ? -1 : mi)}
                    className="w-full flex items-center justify-between px-6 py-4 bg-gray-800/50 hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-purple-400 font-bold">Módulo {mi + 1}</span>
                      <span className="text-gray-400">{mod.titlePt || mod.title || '(sem título)'}</span>
                      <span className="text-xs text-gray-500">{mod.lessons.length} aulas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {newCourse.modules.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeModule(mi) }}
                          className="text-red-400 hover:text-red-300 text-sm px-2"
                        >
                          🗑️
                        </button>
                      )}
                      <span className="text-gray-500">{expandedModule === mi ? '▼' : '▶'}</span>
                    </div>
                  </button>

                  {expandedModule === mi && (
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Título do Módulo (PT)</label>
                          <input
                            type="text"
                            value={mod.titlePt}
                            onChange={e => updateModule(mi, 'titlePt', e.target.value)}
                            placeholder="Nome do módulo em português"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Title (EN)</label>
                          <input
                            type="text"
                            value={mod.title}
                            onChange={e => updateModule(mi, 'title', e.target.value)}
                            placeholder="Module title in English"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="border-t border-gray-800 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-400">Aulas</h3>
                          <button
                            onClick={() => addLesson(mi)}
                            className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                          >
                            + Adicionar Aula
                          </button>
                        </div>

                        <div className="space-y-4">
                          {mod.lessons.map((lesson, li) => (
                            <div key={li} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-purple-400 font-medium">Aula {li + 1}</span>
                                {mod.lessons.length > 1 && (
                                  <button
                                    onClick={() => removeLesson(mi, li)}
                                    className="text-red-400 hover:text-red-300 text-xs"
                                  >
                                    🗑️ Remover
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                <input
                                  type="text"
                                  value={lesson.titlePt}
                                  onChange={e => updateLesson(mi, li, 'titlePt', e.target.value)}
                                  placeholder="Título (PT)"
                                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={lesson.title}
                                  onChange={e => updateLesson(mi, li, 'title', e.target.value)}
                                  placeholder="Title (EN)"
                                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                                />
                                <select
                                  value={lesson.type}
                                  onChange={e => updateLesson(mi, li, 'type', e.target.value)}
                                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                                >
                                  <option value="TEXT">📖 Texto</option>
                                  <option value="VIDEO">🎬 Vídeo</option>
                                  <option value="QUIZ">📝 Quiz</option>
                                </select>
                              </div>
                              {lesson.type === 'VIDEO' && (
                                <input
                                  type="text"
                                  value={lesson.videoUrl}
                                  onChange={e => updateLesson(mi, li, 'videoUrl', e.target.value)}
                                  placeholder="URL do vídeo (YouTube, etc.)"
                                  className="w-full mb-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                                />
                              )}
                              <textarea
                                rows={6}
                                value={lesson.content}
                                onChange={e => updateLesson(mi, li, 'content', e.target.value)}
                                placeholder={lesson.type === 'QUIZ' ? 'Cole o JSON do quiz aqui...' : 'Conteúdo em Markdown...'}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-purple-500 focus:outline-none resize-y"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Save */}
            <div className="flex justify-end gap-3">
              <button className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
                💾 Salvar Rascunho
              </button>
              <button
                onClick={handleSave}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  saved ? 'bg-green-600 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {saved ? '✓ Curso Salvo!' : '🚀 Publicar Curso'}
              </button>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Alunos Inscritos ({MOCK_STUDENTS.length})</h2>
              <input
                type="text"
                placeholder="Buscar alunos..."
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none w-64"
              />
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 text-left text-sm text-gray-400">
                    <th className="px-4 py-3">Aluno</th>
                    <th className="px-4 py-3">Wallet</th>
                    <th className="px-4 py-3">Cursos</th>
                    <th className="px-4 py-3">XP</th>
                    <th className="px-4 py-3">Último Acesso</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_STUDENTS.map((s, i) => (
                    <tr key={i} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                            {s.name[0]}
                          </div>
                          <span className="font-medium">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-400">{s.wallet}</td>
                      <td className="px-4 py-3 text-gray-400">{s.courses}</td>
                      <td className="px-4 py-3 text-purple-400">{s.xp.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">{s.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Analytics da Plataforma</h2>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total de Alunos', value: ANALYTICS.totalStudents, icon: '👥', color: 'text-blue-400' },
                { label: 'Ativos (semana)', value: ANALYTICS.activeThisWeek, icon: '📈', color: 'text-green-400' },
                { label: 'Taxa de Conclusão', value: `${ANALYTICS.avgCompletionRate}%`, icon: '🎯', color: 'text-purple-400' },
                { label: 'Certificados', value: ANALYTICS.totalCertificates, icon: '🏆', color: 'text-yellow-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Charts placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h3 className="font-semibold mb-4">Inscrições por Curso</h3>
                <div className="space-y-3">
                  {COURSES.map((c) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <span className="text-lg">{c.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm">{c.title}</div>
                        <div className="w-full bg-gray-800 rounded-full h-2 mt-1">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${(c.students / 250) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-gray-400">{c.students}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h3 className="font-semibold mb-4">Métricas de Engajamento</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Média de Quiz Score</span>
                    <span className="font-bold text-green-400">{ANALYTICS.avgQuizScore}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Crescimento Semanal</span>
                    <span className="font-bold text-green-400">+{ANALYTICS.weeklyGrowth}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Curso mais popular</span>
                    <span className="font-bold text-purple-400">{ANALYTICS.topCourse}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">NFTs Mintados</span>
                    <span className="font-bold text-yellow-400">{ANALYTICS.totalCertificates}</span>
                  </div>
                </div>

                {/* Weekly activity heatmap */}
                <div className="mt-6">
                  <h4 className="text-sm text-gray-400 mb-3">Atividade Semanal</h4>
                  <div className="grid grid-cols-7 gap-1">
                    {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
                      <div key={i} className="text-center text-xs text-gray-500">{d}</div>
                    ))}
                    {Array.from({ length: 28 }, (_, i) => {
                      const intensity = Math.random()
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-sm ${
                            intensity > 0.7 ? 'bg-purple-500' :
                            intensity > 0.4 ? 'bg-purple-700' :
                            intensity > 0.15 ? 'bg-purple-900' :
                            'bg-gray-800'
                          }`}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
