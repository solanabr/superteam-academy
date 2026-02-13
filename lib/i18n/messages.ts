import { Locale } from '@/lib/types';

export interface Dictionary {
  appName: string;
  header: {
    tagline: string;
    menuOpen: string;
    menuClose: string;
  };
  nav: {
    home: string;
    courses: string;
    login: string;
    register: string;
    dashboard: string;
    leaderboard: string;
    profile: string;
    settings: string;
  };
  actions: {
    signIn: string;
    signUp: string;
    signOut: string;
    exploreCourses: string;
    enroll: string;
    markComplete: string;
    run: string;
    open: string;
    save: string;
    join: string;
    share: string;
    download: string;
    clear: string;
    goToRegister: string;
  };
  hero: {
    title: string;
    subtitle: string;
  };
  common: {
    loading: string;
    previous: string;
    next: string;
    allCourses: string;
    runTests: string;
    running: string;
    saving: string;
    connectedWallet: string;
    localProfileFallback: string;
    notConnected: string;
    levelShort: string;
    daysShort: string;
    theme: string;
    light: string;
    dark: string;
  };
  home: {
    badge: string;
    momentumTitle: string;
    pathsTitle: string;
    pathsSubtitle: string;
    noCourses: string;
    stats: {
      submissions: string;
      learningTracks: string;
      onchainCredentials: string;
    };
    features: {
      projectLearningTitle: string;
      projectLearningText: string;
      gamificationTitle: string;
      gamificationText: string;
      credentialEvolutionTitle: string;
      credentialEvolutionText: string;
      openSourceTitle: string;
      openSourceText: string;
    };
  };
  courses: {
    catalogTitle: string;
    catalogSubtitle: string;
    catalogEmpty: string;
    searchPlaceholder: string;
    allDifficulties: string;
    difficultyBeginner: string;
    difficultyIntermediate: string;
    difficultyAdvanced: string;
    foundSuffix: string;
    viewCourse: string;
    completeSuffix: string;
    detailModulesLessons: string;
    detailNoModules: string;
    detailLearningOutcomes: string;
    detailNoOutcomes: string;
    detailEnroll: string;
    detailEnrolling: string;
    detailEnrolled: string;
    detailRegisterRequired: string;
    detailEnrollSuccess: string;
    detailOpenLesson: string;
    detailInstructorLabel: string;
    detailReviewsTitle: string;
    detailReviewsSubtitle: string;
    detailReviewVerified: string;
    detailReviewOne: string;
    detailReviewTwo: string;
    detailReviewThree: string;
    lessonTypeContent: string;
    lessonTypeChallenge: string;
  };
  register: {
    onboardingBadge: string;
    intro: string;
    fullName: string;
    username: string;
    email: string;
    passwordLabel: string;
    passwordOptionalHint: string;
    createAccount: string;
    processing: string;
    openDashboard: string;
    clearLocalAccount: string;
    clearLocalStatus: string;
    authMethodsTitle: string;
    walletRequiredLabel: string;
    walletConnectedPrefix: string;
    walletNotConnected: string;
    googleButton: string;
    githubButton: string;
    afterRegistrationSettings: string;
    selectedProvidersPrefix: string;
    fillFieldsError: string;
    chooseAuthError: string;
    socialStarting: string;
    socialStubInfo: string;
    walletSignerUnavailable: string;
    walletSignInFailed: string;
    registrationSuccess: string;
  };
  login: {
    onboardingBadge: string;
    intro: string;
    authMethodsTitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    credentialsLogin: string;
    walletLogin: string;
    processing: string;
    fillFieldsError: string;
    credentialsSignInFailed: string;
    socialStarting: string;
    walletSignerUnavailable: string;
    walletSignInFailed: string;
    loginSuccess: string;
    noAccountHint: string;
    goToRegister: string;
  };
  settings: {
    title: string;
    subtitle: string;
    noAccountDesc: string;
    profileSection: string;
    preferencesSection: string;
    privacySection: string;
    displayNamePlaceholder: string;
    emailPlaceholder: string;
    bioPlaceholder: string;
    saveProfile: string;
    darkModeDefault: string;
    emailNotifications: string;
    publicVisibility: string;
    exportData: string;
  };
  accountLinking: {
    title: string;
    subtitle: string;
    walletLabel: string;
    googleLabel: string;
    githubLabel: string;
    requiredForCredentials: string;
    linked: string;
    linkNow: string;
    noRegistration: string;
    connectWalletFirst: string;
    walletLinkedStatus: string;
    socialStubUpdated: string;
    walletLinkFailed: string;
  };
  dashboard: {
    title: string;
    currentCourses: string;
    level: string;
    streak: string;
    achievements: string;
    xpBalance: string;
    globalRank: string;
    streakCalendar: string;
    nextLessonAvailable: string;
    noAccountDesc: string;
    noWalletLinked: string;
    noCoursesPublished: string;
    noAchievements: string;
    daysLabel: string;
    registeredWalletPrefix: string;
    xpTotalLabel: string;
  };
  leaderboard: {
    title: string;
    subtitle: string;
    alltime: string;
    monthly: string;
    weekly: string;
    loading: string;
    empty: string;
    courseFilterNote: string;
    levelShort: string;
    streakShort: string;
  };
  profile: {
    title: string;
    onchainCredentials: string;
    loadingCredentials: string;
    connectWalletHint: string;
    joinedOn: string;
    noAccountDesc: string;
    registeredBio: string;
    noCredentials: string;
    registeredWalletPrefix: string;
    evolutionLevelLabel: string;
    mintLabel: string;
    openCertificate: string;
    statusCompleted: string;
    statusInProgress: string;
  };
  skillRadarTitle: string;
  publicProfile: {
    bio: string;
    badgesTitle: string;
    noBadges: string;
  };
  certificate: {
    title: string;
    subtitle: string;
    badge: string;
    issuedTo: string;
    issuedAt: string;
    level: string;
    verifyExplorer: string;
    downloadImage: string;
    share: string;
    mintAddress: string;
    metadataUri: string;
    loading: string;
    notFound: string;
    connectWalletOrLink: string;
    openProfile: string;
  };
  footer: {
    brand: string;
    description: string;
    subdescription: string;
    product: string;
    community: string;
    newsletter: string;
    newsletterDesc: string;
    coursesLink: string;
    leaderboardLink: string;
    join: string;
    emailPlaceholder: string;
    xLabel: string;
    discordLabel: string;
  };
  notFound: {
    title: string;
    description: string;
  };
  error: {
    title: string;
    description: string;
    digestPrefix: string;
    tryAgain: string;
  };
  lesson: {
    autosaveEnabled: string;
    completionAbstraction: string;
    completionRecording: string;
    completionSuccessPrefix: string;
    completionSuccess: string;
    lessonTips: string;
    hintOne: string;
    solutionToggle: string;
    markCompleteLabel: string;
    codeChallenge: string;
    readyToRun: string;
    runningChallenge: string;
    allTestsPassed: string;
    testsFailed: string;
    expectedLabel: string;
    resultLabel: string;
    resultPass: string;
    resultFail: string;
    removeTodoHint: string;
    rustHint: string;
    tsHint: string;
    hintOneBody: string;
    solutionBody: string;
    resizePanelsAria: string;
    registerRequiredStatus: string;
    walletRequiredStatus: string;
    enrollRequiredStatus: string;
    registerToUnlock: string;
    linkWalletToUnlock: string;
    registerPrompt: string;
    linkWalletPrompt: string;
  };
}

export const defaultLocale: Locale = 'pt-BR';

export const dictionaries: Record<Locale, Dictionary> = {
  'pt-BR': {
    appName: 'Superteam Academy Brasil',
    header: {
      tagline: 'Hub de aprendizado para builders Solana',
      menuOpen: 'Menu',
      menuClose: 'Fechar menu'
    },
    nav: {
      home: 'Inicio',
      courses: 'Cursos',
      login: 'Login',
      register: 'Registro',
      dashboard: 'Painel',
      leaderboard: 'Ranking',
      profile: 'Perfil',
      settings: 'Configuracoes'
    },
    actions: {
      signIn: 'Entrar',
      signUp: 'Inscreva-se',
      signOut: 'Sair',
      exploreCourses: 'Explorar cursos',
      enroll: 'Inscrever no curso',
      markComplete: 'Marcar como concluido',
      run: 'Executar',
      open: 'Abrir',
      save: 'Salvar',
      join: 'Entrar',
      share: 'Compartilhar',
      download: 'Baixar',
      clear: 'Limpar',
      goToRegister: 'Ir para registro'
    },
    hero: {
      title: 'Da base ao deploy de dApps Solana em trilhas praticas.',
      subtitle:
        'Aprendizado gamificado com editor integrado, credenciais on-chain e progressao por XP.'
    },
    common: {
      loading: 'Carregando...',
      previous: 'Anterior',
      next: 'Proxima',
      allCourses: 'Todos os cursos',
      runTests: 'Executar testes',
      running: 'Executando...',
      saving: 'Salvando...',
      connectedWallet: 'Carteira conectada',
      localProfileFallback: 'Usando dados locais. Conecte carteira para dados on-chain.',
      notConnected: 'Nao conectada',
      levelShort: 'Nvl',
      daysShort: 'd',
      theme: 'Tema',
      light: 'Claro',
      dark: 'Escuro'
    },
    home: {
      badge: 'Superteam Brasil LMS',
      momentumTitle: 'Ritmo atual',
      pathsTitle: 'Preview das trilhas',
      pathsSubtitle: 'Comece por fundamentos ou pule direto para trilhas de execucao.',
      noCourses: 'Nenhum curso publicado no CMS ainda. Publique cursos para preencher esta secao.',
      stats: {
        submissions: 'Submissoes',
        learningTracks: 'Trilhas de aprendizado',
        onchainCredentials: 'Credenciais on-chain'
      },
      features: {
        projectLearningTitle: 'Aprendizado por projeto',
        projectLearningText: 'Curso por trilhas com modulos praticos e deploy final em Devnet.',
        gamificationTitle: 'Gamificacao nativa',
        gamificationText: 'XP soulbound, streaks e conquistas com leitura on-chain.',
        credentialEvolutionTitle: 'Evolucao de credencial',
        credentialEvolutionText: 'cNFT compactado por trilha, atualizado com progresso do aluno.',
        openSourceTitle: 'Open source por padrao',
        openSourceText: 'Arquitetura bifurcavel por qualquer comunidade Solana.'
      }
    },
    courses: {
      catalogTitle: 'Catalogo de cursos',
      catalogSubtitle: 'Explore trilhas por dificuldade, topico e tempo estimado.',
      catalogEmpty: 'Nenhum curso publicado no Sanity. Publique um documento `course` para preencher o catalogo.',
      searchPlaceholder: 'Pesquisar por titulo, topico ou trilha',
      allDifficulties: 'Todas as dificuldades',
      difficultyBeginner: 'Iniciante',
      difficultyIntermediate: 'Intermediario',
      difficultyAdvanced: 'Avancado',
      foundSuffix: 'cursos encontrados',
      viewCourse: 'Ver curso',
      completeSuffix: '% concluido',
      detailModulesLessons: 'Modulos e licoes',
      detailNoModules: 'Este curso ainda nao possui modulos publicados.',
      detailLearningOutcomes: 'Resultados de aprendizado',
      detailNoOutcomes: 'Nenhum resultado de aprendizado publicado para este curso.',
      detailEnroll: 'Inscrever no curso',
      detailEnrolling: 'Inscrevendo...',
      detailEnrolled: 'Inscrito',
      detailRegisterRequired: 'Registre para se inscrever',
      detailEnrollSuccess: 'Inscricao confirmada para este curso.',
      detailOpenLesson: 'Abrir',
      detailInstructorLabel: 'Instrutor',
      detailReviewsTitle: 'Avaliacoes',
      detailReviewsSubtitle: 'Feedback inicial de alunos que finalizaram esta trilha.',
      detailReviewVerified: 'reviews verificados',
      detailReviewOne: 'Trilha objetiva, com desafios praticos que ajudam a fixar o fluxo real de deploy.',
      detailReviewTwo: 'Gostei do equilibrio entre conteudo e codigo. A progressao ficou clara modulo a modulo.',
      detailReviewThree: 'Excelente para sair da teoria e construir algo funcional em Solana Devnet.',
      lessonTypeContent: 'conteudo',
      lessonTypeChallenge: 'desafio'
    },
    register: {
      onboardingBadge: 'Cadastro de conta',
      intro:
        'Cadastre com carteira, Google ou GitHub. Vincular carteira e obrigatorio antes da conclusao final e emissao de credenciais.',
      fullName: 'Nome completo',
      username: 'Usuario',
      email: 'Email',
      passwordLabel: 'Senha',
      passwordOptionalHint: 'Opcional, usada para login por email e senha.',
      createAccount: 'Criar conta',
      processing: 'Processando...',
      openDashboard: 'Abrir painel',
      clearLocalAccount: 'Limpar conta local',
      clearLocalStatus: 'Registro local removido. Voce pode cadastrar novamente do zero.',
      authMethodsTitle: 'Metodos de autenticacao',
      walletRequiredLabel: 'Carteira (obrigatoria para credenciais)',
      walletConnectedPrefix: 'Conectada',
      walletNotConnected: 'Nao conectada',
      googleButton: 'Continuar com Google',
      githubButton: 'Continuar com GitHub',
      afterRegistrationSettings: 'Depois do cadastro, vincule metodos extras em configuracoes.',
      selectedProvidersPrefix: 'Provedores selecionados',
      fillFieldsError: 'Preencha nome, email e usuario para continuar.',
      chooseAuthError: 'Escolha pelo menos um metodo: carteira, Google ou GitHub.',
      socialStarting: 'Iniciando login com {provider}...',
      socialStubInfo:
        'Login com {provider} habilitado. Se houver erro, revise as variaveis OAuth no ambiente.',
      walletSignerUnavailable: 'Esta carteira nao suporta assinatura de mensagem para login.',
      walletSignInFailed: 'Nao foi possivel autenticar com a carteira. Tente novamente.',
      registrationSuccess: 'Registro concluido para {username}. Agora voce pode acessar painel e perfil.'
    },
    login: {
      onboardingBadge: 'Acesso da conta',
      intro: 'Entre com carteira, Google ou GitHub usando um metodo ja vinculado.',
      authMethodsTitle: 'Metodos de login',
      emailLabel: 'Email',
      emailPlaceholder: 'voce@dominio.com',
      passwordLabel: 'Senha',
      passwordPlaceholder: 'Digite sua senha',
      credentialsLogin: 'Entrar',
      walletLogin: 'Carteira',
      processing: 'Entrando...',
      fillFieldsError: 'Preencha email e senha para continuar.',
      credentialsSignInFailed: 'Nao foi possivel entrar com email e senha. Verifique as credenciais.',
      socialStarting: 'Iniciando login com {provider}...',
      walletSignerUnavailable: 'Esta carteira nao suporta assinatura de mensagem para login.',
      walletSignInFailed: 'Nao foi possivel entrar com carteira. Tente novamente.',
      loginSuccess: 'Login concluido. Redirecionando para o painel...',
      noAccountHint: 'Nao tem conta ainda?',
      goToRegister: 'Criar conta'
    },
    settings: {
      title: 'Configuracoes',
      subtitle: 'Gerencie perfil, metodos vinculados e preferencias da conta.',
      noAccountDesc: 'Voce ainda nao possui conta registrada. Crie sua conta antes de editar configuracoes.',
      profileSection: 'Perfil',
      preferencesSection: 'Preferencias',
      privacySection: 'Privacidade',
      displayNamePlaceholder: 'Nome de exibicao',
      emailPlaceholder: 'Email',
      bioPlaceholder: 'Bio',
      saveProfile: 'Salvar perfil',
      darkModeDefault: 'Modo escuro como padrao',
      emailNotifications: 'Notificacoes por email',
      publicVisibility: 'Visibilidade publica do perfil',
      exportData: 'Exportar dados da conta'
    },
    accountLinking: {
      title: 'Vinculacao de contas',
      subtitle: 'Vincular carteira e obrigatorio para conclusao final e emissao de credenciais.',
      walletLabel: 'Carteira Solana',
      googleLabel: 'Google',
      githubLabel: 'GitHub',
      requiredForCredentials: 'Obrigatorio para credenciais',
      linked: 'Vinculado',
      linkNow: 'Vincular',
      noRegistration: 'Registre uma conta antes de vincular metodos de autenticacao.',
      connectWalletFirst: 'Conecte uma carteira antes de vincular.',
      walletLinkedStatus: 'Carteira vinculada: {wallet}',
      socialStubUpdated: '{provider} vinculado para este perfil.',
      walletLinkFailed: 'Nao foi possivel vincular a carteira agora.'
    },
    dashboard: {
      title: 'Seu progresso',
      currentCourses: 'Cursos em andamento',
      level: 'Nivel',
      streak: 'Sequencia',
      achievements: 'Conquistas',
      xpBalance: 'Saldo XP',
      globalRank: 'Ranking global',
      streakCalendar: 'Calendario de sequencia',
      nextLessonAvailable: 'Proxima licao disponivel',
      noAccountDesc: 'Nenhuma conta registrada encontrada. Registre primeiro para acompanhar XP, streak e ranking.',
      noWalletLinked: 'Nenhuma carteira vinculada ainda. Vincule uma em configuracoes para habilitar acoes on-chain.',
      noCoursesPublished: 'Nenhum curso publicado encontrado. Publique cursos no CMS para desbloquear recomendacoes.',
      noAchievements: 'Nenhuma conquista desbloqueada ainda.',
      daysLabel: 'dias',
      registeredWalletPrefix: 'Carteira registrada',
      xpTotalLabel: 'XP total'
    },
    leaderboard: {
      title: 'Tabela de classificacao',
      subtitle: 'Ranking de XP indexado por saldos soulbound.',
      alltime: 'Geral',
      monthly: 'Mensal',
      weekly: 'Semanal',
      loading: 'Carregando ranking...',
      empty: 'Nenhum aluno encontrado para o filtro selecionado.',
      courseFilterNote: 'Filtro por curso ativo. O ranking considera alunos com progresso registrado neste curso.',
      levelShort: 'Nvl',
      streakShort: 'dias'
    },
    profile: {
      title: 'Perfil',
      onchainCredentials: 'Credenciais on-chain',
      loadingCredentials: 'Carregando credenciais...',
      connectWalletHint: 'Conecte carteira para verificar credenciais cNFT em tempo real.',
      joinedOn: 'Entrou em',
      noAccountDesc: 'Voce nao possui conta registrada ainda. Crie sua conta para liberar perfil e credenciais.',
      registeredBio: 'Perfil de aluno registrado. Continue os cursos para evoluir sua credencial.',
      noCredentials: 'Nenhuma credencial on-chain encontrada ainda.',
      registeredWalletPrefix: 'Carteira registrada',
      evolutionLevelLabel: 'Nivel de evolucao',
      mintLabel: 'Mint',
      openCertificate: 'Abrir certificado',
      statusCompleted: 'concluida',
      statusInProgress: 'em progresso'
    },
    skillRadarTitle: 'Radar de habilidades',
    publicProfile: {
      bio: 'Perfil publico de aluno. Conecte carteira para verificar credenciais on-chain.',
      badgesTitle: 'Conquistas',
      noBadges: 'Nenhuma conquista publica disponivel ainda.'
    },
    certificate: {
      title: 'Certificado de credencial',
      subtitle: 'Comprovante compartilhavel de conclusao e propriedade on-chain.',
      badge: 'Superteam Academy Brasil',
      issuedTo: 'Emitido para',
      issuedAt: 'Emitido em',
      level: 'Nivel da credencial',
      verifyExplorer: 'Verificar no Solana Explorer',
      downloadImage: 'Baixar imagem',
      share: 'Compartilhar',
      mintAddress: 'Endereco mint',
      metadataUri: 'URI de metadata',
      loading: 'Carregando certificado...',
      notFound: 'Nao encontramos esse certificado para as carteiras disponiveis.',
      connectWalletOrLink: 'Conecte ou vincule uma carteira para localizar o certificado.',
      openProfile: 'Abrir perfil'
    },
    footer: {
      brand: 'Superteam Academy Brasil',
      description: 'LMS open-source para desenvolvedores Solana na America Latina.',
      subdescription: 'Feito para builders, pesquisadores e times que entregam em Devnet.',
      product: 'Produto',
      community: 'Comunidade',
      newsletter: 'Newsletter',
      newsletterDesc: 'Receba novas trilhas e desafios semanais.',
      coursesLink: 'Cursos',
      leaderboardLink: 'Ranking',
      join: 'Entrar',
      emailPlaceholder: 'voce@dominio.com',
      xLabel: 'X / Twitter',
      discordLabel: 'Discord'
    },
    notFound: {
      title: 'Pagina nao encontrada',
      description: 'Esta rota nao existe no workspace da academia.'
    },
    error: {
      title: 'Erro inesperado',
      description: 'Ocorreu um erro de renderizacao inesperado. O problema foi reportado para investigacao.',
      digestPrefix: 'Digest',
      tryAgain: 'Tentar novamente'
    },
    lesson: {
      autosaveEnabled: 'Auto-save de progresso ativo para esta licao.',
      completionAbstraction:
        'Conclusao usa abstracoes de servico para transacoes assinadas por backend e atualizacao on-chain.',
      completionRecording: 'Registrando conclusao da licao...',
      completionSuccessPrefix: 'Licao concluida.',
      completionSuccess: 'Licao concluida. +{xp} XP na fila de sincronizacao.',
      lessonTips: 'Dicas da licao',
      hintOne: 'Dica 1',
      solutionToggle: 'Mostrar solucao',
      markCompleteLabel: 'Marcar como concluida',
      codeChallenge: 'Desafio de codigo',
      readyToRun: 'Pronto para executar testes',
      runningChallenge: 'Executando desafio...',
      allTestsPassed: 'Todos os testes passaram. Excelente trabalho.',
      testsFailed: 'Alguns testes falharam. Revise o esperado e tente novamente.',
      expectedLabel: 'Esperado',
      resultLabel: 'Resultado',
      resultPass: 'Aprovado',
      resultFail: 'Reprovado',
      removeTodoHint: 'Remova os TODOs antes de rodar os testes finais.',
      rustHint: 'Dica Rust: retorne `Ok(())` apos as validacoes.',
      tsHint: 'Dica TypeScript: garanta retorno com os valores esperados.',
      hintOneBody: 'Use seeds deterministicas para PDA de inscricao e atualizacao do bitmap de licoes.',
      solutionBody: 'Mantenha solucao completa oculta ate o primeiro run de desafio.',
      resizePanelsAria: 'Redimensionar paineis da licao',
      registerRequiredStatus: 'Registre uma conta antes de concluir licoes e ganhar XP.',
      walletRequiredStatus: 'Vincule uma carteira para concluir licoes e receber credenciais.',
      enrollRequiredStatus: 'Inscreva-se no curso antes de marcar a licao como concluida.',
      registerToUnlock: 'Registre para desbloquear',
      linkWalletToUnlock: 'Vincule carteira para desbloquear',
      registerPrompt: 'Nenhuma conta registrada encontrada. Va para /register primeiro.',
      linkWalletPrompt: 'Carteira nao vinculada. Vincule em /settings para continuar.'
    }
  },
  es: {
    appName: 'Superteam Academy Brasil',
    header: {
      tagline: 'Centro de aprendizaje para builders Solana',
      menuOpen: 'Menu',
      menuClose: 'Cerrar menu'
    },
    nav: {
      home: 'Inicio',
      courses: 'Cursos',
      login: 'Login',
      register: 'Registro',
      dashboard: 'Panel',
      leaderboard: 'Clasificacion',
      profile: 'Perfil',
      settings: 'Configuracion'
    },
    actions: {
      signIn: 'Entrar',
      signUp: 'Registrate',
      signOut: 'Salir',
      exploreCourses: 'Explorar cursos',
      enroll: 'Inscribirse al curso',
      markComplete: 'Marcar completada',
      run: 'Ejecutar',
      open: 'Abrir',
      save: 'Guardar',
      join: 'Unirse',
      share: 'Compartir',
      download: 'Descargar',
      clear: 'Limpiar',
      goToRegister: 'Ir al registro'
    },
    hero: {
      title: 'De cero a despliegue de dApps Solana con rutas practicas.',
      subtitle:
        'Aprendizaje gamificado con editor integrado, credenciales on-chain y progresion por XP.'
    },
    common: {
      loading: 'Cargando...',
      previous: 'Anterior',
      next: 'Siguiente',
      allCourses: 'Todos los cursos',
      runTests: 'Ejecutar pruebas',
      running: 'Ejecutando...',
      saving: 'Guardando...',
      connectedWallet: 'Billetera conectada',
      localProfileFallback: 'Usando datos locales. Conecta la billetera para datos on-chain.',
      notConnected: 'No conectada',
      levelShort: 'Nv',
      daysShort: 'd',
      theme: 'Tema',
      light: 'Claro',
      dark: 'Oscuro'
    },
    home: {
      badge: 'Superteam Brasil LMS',
      momentumTitle: 'Ritmo actual',
      pathsTitle: 'Vista previa de rutas',
      pathsSubtitle: 'Empieza por fundamentos o salta a rutas de ejecucion.',
      noCourses: 'No hay cursos publicados en el CMS. Publica cursos para llenar esta seccion.',
      stats: {
        submissions: 'Envios',
        learningTracks: 'Rutas de aprendizaje',
        onchainCredentials: 'Credenciales on-chain'
      },
      features: {
        projectLearningTitle: 'Aprendizaje por proyectos',
        projectLearningText: 'Rutas con modulos practicos y despliegue final en Devnet.',
        gamificationTitle: 'Gamificacion nativa',
        gamificationText: 'XP soulbound, rachas y logros con lectura on-chain.',
        credentialEvolutionTitle: 'Evolucion de credenciales',
        credentialEvolutionText: 'Un cNFT compacto por ruta, actualizado con progreso.',
        openSourceTitle: 'Open source por defecto',
        openSourceText: 'Arquitectura bifurcable por cualquier comunidad Solana.'
      }
    },
    courses: {
      catalogTitle: 'Catalogo de cursos',
      catalogSubtitle: 'Explora rutas por dificultad, tema y duracion estimada.',
      catalogEmpty: 'No se encontraron cursos publicados en Sanity. Publica un documento `course` para llenar el catalogo.',
      searchPlaceholder: 'Buscar por titulo, tema o ruta',
      allDifficulties: 'Todas las dificultades',
      difficultyBeginner: 'Principiante',
      difficultyIntermediate: 'Intermedio',
      difficultyAdvanced: 'Avanzado',
      foundSuffix: 'cursos encontrados',
      viewCourse: 'Ver curso',
      completeSuffix: '% completado',
      detailModulesLessons: 'Modulos y lecciones',
      detailNoModules: 'Este curso aun no tiene modulos publicados.',
      detailLearningOutcomes: 'Resultados de aprendizaje',
      detailNoOutcomes: 'No hay resultados de aprendizaje publicados para este curso.',
      detailEnroll: 'Inscribirse al curso',
      detailEnrolling: 'Inscribiendo...',
      detailEnrolled: 'Inscrito',
      detailRegisterRequired: 'Registrate para inscribirte',
      detailEnrollSuccess: 'Inscripcion confirmada para este curso.',
      detailOpenLesson: 'Abrir',
      detailInstructorLabel: 'Instructor',
      detailReviewsTitle: 'Resenas',
      detailReviewsSubtitle: 'Feedback inicial de alumnos que completaron esta ruta.',
      detailReviewVerified: 'resenas verificadas',
      detailReviewOne: 'Ruta directa, con desafios practicos para fijar el flujo real de deploy.',
      detailReviewTwo: 'Buen equilibrio entre teoria y codigo. La progresion queda clara modulo a modulo.',
      detailReviewThree: 'Ideal para pasar de la teoria a una dApp funcional en Solana Devnet.',
      lessonTypeContent: 'contenido',
      lessonTypeChallenge: 'desafio'
    },
    register: {
      onboardingBadge: 'Registro de cuenta',
      intro:
        'Registrate con billetera, Google o GitHub. Vincular billetera es obligatorio antes de la finalizacion y emision de credenciales.',
      fullName: 'Nombre completo',
      username: 'Usuario',
      email: 'Correo',
      passwordLabel: 'Contrasena',
      passwordOptionalHint: 'Opcional, usada para login con correo y contrasena.',
      createAccount: 'Crear cuenta',
      processing: 'Procesando...',
      openDashboard: 'Abrir panel',
      clearLocalAccount: 'Limpiar cuenta local',
      clearLocalStatus: 'Registro local eliminado. Puedes registrarte de nuevo desde cero.',
      authMethodsTitle: 'Metodos de autenticacion',
      walletRequiredLabel: 'Billetera (obligatoria para credenciales)',
      walletConnectedPrefix: 'Conectada',
      walletNotConnected: 'No conectada',
      googleButton: 'Continuar con Google',
      githubButton: 'Continuar con GitHub',
      afterRegistrationSettings: 'Despues del registro, vincula metodos extra en configuracion.',
      selectedProvidersPrefix: 'Proveedores seleccionados',
      fillFieldsError: 'Completa nombre, correo y usuario para continuar.',
      chooseAuthError: 'Elige al menos un metodo: billetera, Google o GitHub.',
      socialStarting: 'Iniciando login con {provider}...',
      socialStubInfo:
        'Login con {provider} habilitado. Si hay error, revisa las variables OAuth del entorno.',
      walletSignerUnavailable: 'Esta billetera no soporta firma de mensajes para login.',
      walletSignInFailed: 'No fue posible autenticar con la billetera. Intenta de nuevo.',
      registrationSuccess: 'Registro completado para {username}. Ahora puedes acceder a panel y perfil.'
    },
    login: {
      onboardingBadge: 'Acceso de cuenta',
      intro: 'Inicia sesion con billetera, Google o GitHub usando un metodo ya vinculado.',
      authMethodsTitle: 'Metodos de login',
      emailLabel: 'Correo',
      emailPlaceholder: 'tu@dominio.com',
      passwordLabel: 'Contrasena',
      passwordPlaceholder: 'Ingresa tu contrasena',
      credentialsLogin: 'Entrar',
      walletLogin: 'Billetera',
      processing: 'Entrando...',
      fillFieldsError: 'Completa correo y contrasena para continuar.',
      credentialsSignInFailed: 'No fue posible entrar con correo y contrasena. Verifica las credenciales.',
      socialStarting: 'Iniciando login con {provider}...',
      walletSignerUnavailable: 'Esta billetera no soporta firma de mensajes para login.',
      walletSignInFailed: 'No fue posible entrar con billetera. Intenta de nuevo.',
      loginSuccess: 'Login completado. Redirigiendo al panel...',
      noAccountHint: 'Aun no tienes cuenta?',
      goToRegister: 'Crear cuenta'
    },
    settings: {
      title: 'Configuracion',
      subtitle: 'Administra perfil, metodos vinculados y preferencias de cuenta.',
      noAccountDesc: 'Aun no tienes una cuenta registrada. Crea tu cuenta antes de editar configuracion.',
      profileSection: 'Perfil',
      preferencesSection: 'Preferencias',
      privacySection: 'Privacidad',
      displayNamePlaceholder: 'Nombre visible',
      emailPlaceholder: 'Correo',
      bioPlaceholder: 'Bio',
      saveProfile: 'Guardar perfil',
      darkModeDefault: 'Modo oscuro por defecto',
      emailNotifications: 'Notificaciones por correo',
      publicVisibility: 'Visibilidad publica del perfil',
      exportData: 'Exportar datos de la cuenta'
    },
    accountLinking: {
      title: 'Vinculacion de cuentas',
      subtitle: 'Vincular billetera es obligatorio para finalizacion y emision de credenciales.',
      walletLabel: 'Billetera Solana',
      googleLabel: 'Google',
      githubLabel: 'GitHub',
      requiredForCredentials: 'Obligatorio para credenciales',
      linked: 'Vinculado',
      linkNow: 'Vincular',
      noRegistration: 'Registra una cuenta antes de vincular metodos de autenticacion.',
      connectWalletFirst: 'Conecta una billetera antes de vincular.',
      walletLinkedStatus: 'Billetera vinculada: {wallet}',
      socialStubUpdated: '{provider} vinculado para este perfil.',
      walletLinkFailed: 'No fue posible vincular la billetera ahora.'
    },
    dashboard: {
      title: 'Tu progreso',
      currentCourses: 'Cursos en curso',
      level: 'Nivel',
      streak: 'Racha',
      achievements: 'Logros',
      xpBalance: 'Saldo XP',
      globalRank: 'Ranking global',
      streakCalendar: 'Calendario de racha',
      nextLessonAvailable: 'Proxima leccion disponible',
      noAccountDesc: 'No se encontro una cuenta registrada. Registra primero para seguir XP, racha y ranking.',
      noWalletLinked: 'Aun no hay billetera vinculada. Vincula una en configuracion para acciones on-chain.',
      noCoursesPublished: 'No hay cursos publicados. Publica cursos en el CMS para desbloquear recomendaciones.',
      noAchievements: 'No hay logros desbloqueados aun.',
      daysLabel: 'dias',
      registeredWalletPrefix: 'Billetera registrada',
      xpTotalLabel: 'XP total'
    },
    leaderboard: {
      title: 'Clasificacion',
      subtitle: 'Ranking de XP indexado por balances soulbound.',
      alltime: 'Historico',
      monthly: 'Mensual',
      weekly: 'Semanal',
      loading: 'Cargando ranking...',
      empty: 'No se encontraron alumnos para el filtro seleccionado.',
      courseFilterNote: 'Filtro por curso activo. El ranking considera alumnos con progreso registrado en este curso.',
      levelShort: 'Nv',
      streakShort: 'dias'
    },
    profile: {
      title: 'Perfil',
      onchainCredentials: 'Credenciales on-chain',
      loadingCredentials: 'Cargando credenciales...',
      connectWalletHint: 'Conecta la billetera para verificar cNFTs en tiempo real.',
      joinedOn: 'Se unio en',
      noAccountDesc: 'Aun no tienes cuenta registrada. Crea tu cuenta para habilitar perfil y credenciales.',
      registeredBio: 'Perfil de alumno registrado. Continúa los cursos para evolucionar tu credencial.',
      noCredentials: 'No se encontraron credenciales on-chain aun.',
      registeredWalletPrefix: 'Billetera registrada',
      evolutionLevelLabel: 'Nivel de evolucion',
      mintLabel: 'Mint',
      openCertificate: 'Abrir certificado',
      statusCompleted: 'completada',
      statusInProgress: 'en progreso'
    },
    skillRadarTitle: 'Radar de habilidades',
    publicProfile: {
      bio: 'Perfil publico de aprendizaje. Conecta billetera para verificar credenciales on-chain.',
      badgesTitle: 'Insignias',
      noBadges: 'No hay insignias publicas disponibles aun.'
    },
    certificate: {
      title: 'Certificado de credencial',
      subtitle: 'Prueba compartible de finalizacion y propiedad on-chain.',
      badge: 'Superteam Academy Brasil',
      issuedTo: 'Emitido para',
      issuedAt: 'Emitido en',
      level: 'Nivel de credencial',
      verifyExplorer: 'Verificar en Solana Explorer',
      downloadImage: 'Descargar imagen',
      share: 'Compartir',
      mintAddress: 'Direccion mint',
      metadataUri: 'URI de metadata',
      loading: 'Cargando certificado...',
      notFound: 'No encontramos ese certificado para las billeteras disponibles.',
      connectWalletOrLink: 'Conecta o vincula una billetera para localizar el certificado.',
      openProfile: 'Abrir perfil'
    },
    footer: {
      brand: 'Superteam Academy Brasil',
      description: 'LMS open-source para desarrolladores Solana en America Latina.',
      subdescription: 'Hecho para builders, investigadores y equipos que despliegan en Devnet.',
      product: 'Producto',
      community: 'Comunidad',
      newsletter: 'Newsletter',
      newsletterDesc: 'Recibe nuevas rutas y desafios semanales.',
      coursesLink: 'Cursos',
      leaderboardLink: 'Clasificacion',
      join: 'Unirse',
      emailPlaceholder: 'tu@dominio.com',
      xLabel: 'X / Twitter',
      discordLabel: 'Discord'
    },
    notFound: {
      title: 'Pagina no encontrada',
      description: 'Esta ruta no existe en el workspace de la academia.'
    },
    error: {
      title: 'Error inesperado',
      description: 'Ocurrio un error de renderizado inesperado. El problema fue reportado para investigacion.',
      digestPrefix: 'Digest',
      tryAgain: 'Intentar de nuevo'
    },
    lesson: {
      autosaveEnabled: 'Auto-guardado activo para esta leccion.',
      completionAbstraction:
        'La finalizacion usa abstracciones de servicio para firmas backend y actualizacion on-chain.',
      completionRecording: 'Registrando finalizacion de la leccion...',
      completionSuccessPrefix: 'Leccion completada.',
      completionSuccess: 'Leccion completada. +{xp} XP en cola de sincronizacion.',
      lessonTips: 'Consejos de la leccion',
      hintOne: 'Pista 1',
      solutionToggle: 'Mostrar solucion',
      markCompleteLabel: 'Marcar completada',
      codeChallenge: 'Desafio de codigo',
      readyToRun: 'Listo para ejecutar pruebas',
      runningChallenge: 'Ejecutando desafio...',
      allTestsPassed: 'Todas las pruebas pasaron. Excelente trabajo.',
      testsFailed: 'Algunas pruebas fallaron. Revisa y vuelve a intentar.',
      expectedLabel: 'Esperado',
      resultLabel: 'Resultado',
      resultPass: 'Aprobado',
      resultFail: 'Fallo',
      removeTodoHint: 'Quita los TODO antes de ejecutar pruebas finales.',
      rustHint: 'Consejo Rust: retorna `Ok(())` despues de validar.',
      tsHint: 'Consejo TypeScript: asegúrate de retornar valores esperados.',
      hintOneBody: 'Usa seeds deterministicas para PDA de inscripcion y bitmap de lecciones.',
      solutionBody: 'Manten la solucion oculta hasta el primer run del desafio.',
      resizePanelsAria: 'Redimensionar paneles de la leccion',
      registerRequiredStatus: 'Registra una cuenta antes de completar lecciones y ganar XP.',
      walletRequiredStatus: 'Vincula una billetera para completar lecciones y recibir credenciales.',
      enrollRequiredStatus: 'Inscribete en el curso antes de marcar la leccion como completada.',
      registerToUnlock: 'Registra para desbloquear',
      linkWalletToUnlock: 'Vincula billetera para desbloquear',
      registerPrompt: 'No se encontro una cuenta registrada. Ve a /register primero.',
      linkWalletPrompt: 'Billetera no vinculada. Vinculala en /settings para continuar.'
    }
  },
  en: {
    appName: 'Superteam Academy Brazil',
    header: {
      tagline: 'Learning hub for Solana builders',
      menuOpen: 'Menu',
      menuClose: 'Close menu'
    },
    nav: {
      home: 'Home',
      courses: 'Courses',
      login: 'Login',
      register: 'Register',
      dashboard: 'Dashboard',
      leaderboard: 'Leaderboard',
      profile: 'Profile',
      settings: 'Settings'
    },
    actions: {
      signIn: 'Sign in',
      signUp: 'Sign up',
      signOut: 'Sign out',
      exploreCourses: 'Explore courses',
      enroll: 'Enroll in course',
      markComplete: 'Mark complete',
      run: 'Run',
      open: 'Open',
      save: 'Save',
      join: 'Join',
      share: 'Share',
      download: 'Download',
      clear: 'Clear',
      goToRegister: 'Go to register'
    },
    hero: {
      title: 'From zero to production Solana dApps through hands-on paths.',
      subtitle:
        'Gamified learning with embedded code editor, on-chain credentials, and XP progression.'
    },
    common: {
      loading: 'Loading...',
      previous: 'Previous',
      next: 'Next',
      allCourses: 'All courses',
      runTests: 'Run tests',
      running: 'Running...',
      saving: 'Saving...',
      connectedWallet: 'Wallet connected',
      localProfileFallback: 'Using local data. Connect wallet for on-chain values.',
      notConnected: 'Not connected',
      levelShort: 'Lvl',
      daysShort: 'd',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark'
    },
    home: {
      badge: 'Superteam Brazil LMS',
      momentumTitle: 'Current momentum',
      pathsTitle: 'Learning Paths Preview',
      pathsSubtitle: 'Start with fundamentals or jump straight into execution tracks.',
      noCourses: 'No courses published in CMS yet. Publish courses to populate this section.',
      stats: {
        submissions: 'Submissions',
        learningTracks: 'Learning tracks',
        onchainCredentials: 'On-chain credentials'
      },
      features: {
        projectLearningTitle: 'Project-based learning',
        projectLearningText: 'Track-based curriculum with practical modules and final Devnet deployment.',
        gamificationTitle: 'Native gamification',
        gamificationText: 'Soulbound XP, streaks, and achievements with on-chain reads.',
        credentialEvolutionTitle: 'Credential evolution',
        credentialEvolutionText: 'One compact cNFT per track, updated as the learner progresses.',
        openSourceTitle: 'Open source by default',
        openSourceText: 'Forkable architecture for any Solana community.'
      }
    },
    courses: {
      catalogTitle: 'Course Catalog',
      catalogSubtitle: 'Explore tracks by difficulty, topic, and estimated completion time.',
      catalogEmpty: 'No published courses found in Sanity. Publish a `course` document to populate this catalog.',
      searchPlaceholder: 'Search by title, topic, or path',
      allDifficulties: 'All difficulties',
      difficultyBeginner: 'Beginner',
      difficultyIntermediate: 'Intermediate',
      difficultyAdvanced: 'Advanced',
      foundSuffix: 'courses found',
      viewCourse: 'View course',
      completeSuffix: '% complete',
      detailModulesLessons: 'Modules & Lessons',
      detailNoModules: 'This course has no published modules yet.',
      detailLearningOutcomes: 'Learning Outcomes',
      detailNoOutcomes: 'No learning outcomes published for this course yet.',
      detailEnroll: 'Enroll in Course',
      detailEnrolling: 'Enrolling...',
      detailEnrolled: 'Enrolled',
      detailRegisterRequired: 'Register to enroll',
      detailEnrollSuccess: 'Enrollment confirmed for this course.',
      detailOpenLesson: 'Open',
      detailInstructorLabel: 'Instructor',
      detailReviewsTitle: 'Reviews',
      detailReviewsSubtitle: 'Early feedback from learners who completed this track.',
      detailReviewVerified: 'verified reviews',
      detailReviewOne: 'Straight to the point path with practical challenges that mirror real deployment flow.',
      detailReviewTwo: 'Great balance between content and coding. Progression feels clear module by module.',
      detailReviewThree: 'Excellent to move from theory to a functional Solana Devnet build.',
      lessonTypeContent: 'content',
      lessonTypeChallenge: 'challenge'
    },
    register: {
      onboardingBadge: 'Account onboarding',
      intro:
        'Sign up with wallet, Google, or GitHub. Wallet linking is required before final course completion and credential minting.',
      fullName: 'Full name',
      username: 'Username',
      email: 'Email',
      passwordLabel: 'Password',
      passwordOptionalHint: 'Optional, used for email/password sign in.',
      createAccount: 'Create account',
      processing: 'Processing...',
      openDashboard: 'Open dashboard',
      clearLocalAccount: 'Clear local account',
      clearLocalStatus: 'Local registration removed. You can register again from scratch.',
      authMethodsTitle: 'Auth methods',
      walletRequiredLabel: 'Wallet (required for credentials)',
      walletConnectedPrefix: 'Connected',
      walletNotConnected: 'Not connected',
      googleButton: 'Continue with Google',
      githubButton: 'Continue with GitHub',
      afterRegistrationSettings: 'After registration, users can link extra methods in settings.',
      selectedProvidersPrefix: 'Selected providers',
      fillFieldsError: 'Fill name, email and username to continue.',
      chooseAuthError: 'Choose at least one auth method: wallet, Google, or GitHub.',
      socialStarting: 'Starting {provider} sign in...',
      socialStubInfo:
        '{provider} sign in is enabled. If it fails, review OAuth environment variables.',
      walletSignerUnavailable: 'This wallet does not support message signing for auth.',
      walletSignInFailed: 'Wallet authentication failed. Please try again.',
      registrationSuccess: 'Registration completed for {username}. You can now access dashboard and profile.'
    },
    login: {
      onboardingBadge: 'Account access',
      intro: 'Sign in with wallet, Google, or GitHub using a previously linked method.',
      authMethodsTitle: 'Login methods',
      emailLabel: 'Email',
      emailPlaceholder: 'you@domain.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      credentialsLogin: 'Sign in',
      walletLogin: 'Wallet',
      processing: 'Signing in...',
      fillFieldsError: 'Fill email and password to continue.',
      credentialsSignInFailed: 'Could not sign in with email and password. Check your credentials.',
      socialStarting: 'Starting {provider} sign in...',
      walletSignerUnavailable: 'This wallet does not support message signing for auth.',
      walletSignInFailed: 'Could not sign in with wallet. Please try again.',
      loginSuccess: 'Login complete. Redirecting to dashboard...',
      noAccountHint: 'Do not have an account yet?',
      goToRegister: 'Create account'
    },
    settings: {
      title: 'Settings',
      subtitle: 'Manage your profile, linked auth methods, and account preferences.',
      noAccountDesc: 'You do not have a registered account yet. Create your account first to edit settings.',
      profileSection: 'Profile',
      preferencesSection: 'Preferences',
      privacySection: 'Privacy',
      displayNamePlaceholder: 'Display name',
      emailPlaceholder: 'Email',
      bioPlaceholder: 'Bio',
      saveProfile: 'Save profile',
      darkModeDefault: 'Dark mode as default',
      emailNotifications: 'Email notifications',
      publicVisibility: 'Public profile visibility',
      exportData: 'Export account data'
    },
    accountLinking: {
      title: 'Account Linking',
      subtitle: 'Wallet link is required for final course completion and credential issuance.',
      walletLabel: 'Solana Wallet',
      googleLabel: 'Google',
      githubLabel: 'GitHub',
      requiredForCredentials: 'Required for credentials',
      linked: 'Linked',
      linkNow: 'Link now',
      noRegistration: 'Register an account before linking authentication methods.',
      connectWalletFirst: 'Connect a wallet before linking.',
      walletLinkedStatus: 'Wallet linked: {wallet}',
      socialStubUpdated: '{provider} linked for this profile.',
      walletLinkFailed: 'Could not link wallet right now.'
    },
    dashboard: {
      title: 'Your progress',
      currentCourses: 'Current courses',
      level: 'Level',
      streak: 'Streak',
      achievements: 'Achievements',
      xpBalance: 'XP balance',
      globalRank: 'Global rank',
      streakCalendar: 'Streak calendar',
      nextLessonAvailable: 'Next lesson available',
      noAccountDesc: 'No registered account found. Register first to track XP, streak, and leaderboard rank.',
      noWalletLinked: 'No wallet linked yet. Link one in settings to enable on-chain actions.',
      noCoursesPublished: 'No published courses found. Publish courses in CMS to unlock recommendations.',
      noAchievements: 'No achievements unlocked yet.',
      daysLabel: 'days',
      registeredWalletPrefix: 'Registered wallet',
      xpTotalLabel: 'XP total'
    },
    leaderboard: {
      title: 'Leaderboard',
      subtitle: 'XP ranking indexed from soulbound balances.',
      alltime: 'All-time',
      monthly: 'Monthly',
      weekly: 'Weekly',
      loading: 'Loading ranking...',
      empty: 'No learners found for the selected filter.',
      courseFilterNote: 'Course filter is active. Ranking now shows learners with recorded progress in this course.',
      levelShort: 'Lvl',
      streakShort: 'streak'
    },
    profile: {
      title: 'Profile',
      onchainCredentials: 'On-chain Credentials',
      loadingCredentials: 'Loading credentials...',
      connectWalletHint: 'Connect wallet to verify live cNFT credentials.',
      joinedOn: 'Joined',
      noAccountDesc: 'You do not have a registered account yet. Create your account first to unlock profile and credentials.',
      registeredBio: 'Registered learner profile. Continue courses to evolve your credential.',
      noCredentials: 'No on-chain credentials found yet.',
      registeredWalletPrefix: 'Registered wallet',
      evolutionLevelLabel: 'Evolution level',
      mintLabel: 'Mint',
      openCertificate: 'Open certificate',
      statusCompleted: 'completed',
      statusInProgress: 'in progress'
    },
    skillRadarTitle: 'Skill Radar',
    publicProfile: {
      bio: 'Public learner profile. Connect wallet to verify on-chain credentials.',
      badgesTitle: 'Badges',
      noBadges: 'No public badges available yet.'
    },
    certificate: {
      title: 'Credential Certificate',
      subtitle: 'Shareable proof of completion and on-chain ownership details.',
      badge: 'Superteam Academy Brazil',
      issuedTo: 'Issued to',
      issuedAt: 'Issued at',
      level: 'Credential level',
      verifyExplorer: 'Verify on Solana Explorer',
      downloadImage: 'Download image',
      share: 'Share',
      mintAddress: 'Mint address',
      metadataUri: 'Metadata URI',
      loading: 'Loading certificate...',
      notFound: 'We could not find this certificate for the available wallets.',
      connectWalletOrLink: 'Connect or link a wallet to locate this certificate.',
      openProfile: 'Open profile'
    },
    footer: {
      brand: 'Superteam Academy Brazil',
      description: 'Open-source LMS for Solana developers across Latin America.',
      subdescription: 'Built for builders, researchers, and teams shipping on Devnet.',
      product: 'Product',
      community: 'Community',
      newsletter: 'Newsletter',
      newsletterDesc: 'Get new tracks and weekly challenges.',
      coursesLink: 'Courses',
      leaderboardLink: 'Leaderboard',
      join: 'Join',
      emailPlaceholder: 'you@domain.com',
      xLabel: 'X / Twitter',
      discordLabel: 'Discord'
    },
    notFound: {
      title: 'Page not found',
      description: 'This route does not exist in the academy workspace.'
    },
    error: {
      title: 'Unexpected error',
      description: 'An unexpected rendering error occurred. The issue was reported for investigation.',
      digestPrefix: 'Digest',
      tryAgain: 'Try again'
    },
    lesson: {
      autosaveEnabled: 'Progress auto-save is enabled for this lesson.',
      completionAbstraction:
        'Completion uses service abstraction for backend-signed transactions and on-chain updates.',
      completionRecording: 'Recording lesson completion...',
      completionSuccessPrefix: 'Lesson completed.',
      completionSuccess: 'Lesson completed. +{xp} XP queued for sync.',
      lessonTips: 'Lesson Tips',
      hintOne: 'Hint 1',
      solutionToggle: 'Solution toggle',
      markCompleteLabel: 'Mark complete',
      codeChallenge: 'Code Challenge',
      readyToRun: 'Ready to run tests',
      runningChallenge: 'Running challenge...',
      allTestsPassed: 'All tests passed. Great work.',
      testsFailed: 'Some tests failed. Check expected outputs and try again.',
      expectedLabel: 'Expected',
      resultLabel: 'Result',
      resultPass: 'Pass',
      resultFail: 'Fail',
      removeTodoHint: 'Remove TODO markers before running final tests.',
      rustHint: 'Rust hint: return `Ok(())` after validation logic.',
      tsHint: 'TypeScript hint: ensure the function returns expected values.',
      hintOneBody: 'Use deterministic seeds for enrollment PDA and lesson bitmap updates.',
      solutionBody: 'Keep full solutions hidden until at least one challenge run.',
      resizePanelsAria: 'Resize lesson panels',
      registerRequiredStatus: 'Register an account before completing lessons and earning XP.',
      walletRequiredStatus: 'Link a wallet before completing lessons and receiving credentials.',
      enrollRequiredStatus: 'Enroll in this course before marking lessons as complete.',
      registerToUnlock: 'Register to unlock',
      linkWalletToUnlock: 'Link wallet to unlock',
      registerPrompt: 'No registered account found. Go to /register first.',
      linkWalletPrompt: 'Wallet not linked. Link one in /settings to continue.'
    }
  }
};
