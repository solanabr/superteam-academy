type LocaleMessages = { en: string; "pt-BR": string; es: string };

const ERROR_MAP: Record<string, LocaleMessages> = {
  Unauthorized: {
    en: "Unauthorized signer",
    "pt-BR": "Assinante não autorizado",
    es: "Firmante no autorizado",
  },
  CourseNotActive: {
    en: "This course is not active",
    "pt-BR": "Este curso não está ativo",
    es: "Este curso no está activo",
  },
  LessonOutOfBounds: {
    en: "Invalid lesson index",
    "pt-BR": "Índice de aula inválido",
    es: "Índice de lección inválido",
  },
  LessonAlreadyCompleted: {
    en: "Lesson already completed",
    "pt-BR": "Aula já concluída",
    es: "Lección ya completada",
  },
  CourseNotCompleted: {
    en: "Not all lessons completed",
    "pt-BR": "Nem todas as aulas foram concluídas",
    es: "No se completaron todas las lecciones",
  },
  CourseAlreadyFinalized: {
    en: "Course already finalized",
    "pt-BR": "Curso já finalizado",
    es: "Curso ya finalizado",
  },
  CourseNotFinalized: {
    en: "Course not yet finalized",
    "pt-BR": "Curso ainda não finalizado",
    es: "Curso aún no finalizado",
  },
  PrerequisiteNotMet: {
    en: "Prerequisite course not completed",
    "pt-BR": "Pré-requisito não concluído",
    es: "Prerrequisito no completado",
  },
  UnenrollCooldown: {
    en: "Must wait 24 hours to unenroll",
    "pt-BR": "Aguarde 24h para cancelar matrícula",
    es: "Debe esperar 24h para cancelar inscripción",
  },
  EnrollmentCourseMismatch: {
    en: "Enrollment does not match course",
    "pt-BR": "Matrícula não corresponde ao curso",
    es: "Inscripción no coincide con el curso",
  },
  Overflow: {
    en: "Arithmetic overflow",
    "pt-BR": "Estouro aritmético",
    es: "Desbordamiento aritmético",
  },
  CourseIdEmpty: {
    en: "Course ID cannot be empty",
    "pt-BR": "ID do curso não pode estar vazio",
    es: "El ID del curso no puede estar vacío",
  },
  CourseIdTooLong: {
    en: "Course ID too long",
    "pt-BR": "ID do curso muito longo",
    es: "ID del curso demasiado largo",
  },
  InvalidLessonCount: {
    en: "Must have at least 1 lesson",
    "pt-BR": "Deve ter pelo menos 1 aula",
    es: "Debe tener al menos 1 lección",
  },
  InvalidDifficulty: {
    en: "Difficulty must be 1, 2, or 3",
    "pt-BR": "Dificuldade deve ser 1, 2 ou 3",
    es: "Dificultad debe ser 1, 2 o 3",
  },
  CredentialAssetMismatch: {
    en: "Credential does not match enrollment",
    "pt-BR": "Credencial não corresponde à matrícula",
    es: "Credencial no coincide con la inscripción",
  },
  CredentialAlreadyIssued: {
    en: "Credential already issued",
    "pt-BR": "Credencial já emitida",
    es: "Credencial ya emitida",
  },
  MinterNotActive: {
    en: "Minter is not active",
    "pt-BR": "Minter não está ativo",
    es: "Minter no está activo",
  },
  MinterAmountExceeded: {
    en: "Amount exceeds minter limit",
    "pt-BR": "Valor excede limite do minter",
    es: "Monto excede límite del minter",
  },
  LabelTooLong: {
    en: "Label too long",
    "pt-BR": "Rótulo muito longo",
    es: "Etiqueta demasiado larga",
  },
  AchievementNotActive: {
    en: "Achievement is not active",
    "pt-BR": "Conquista não está ativa",
    es: "Logro no está activo",
  },
  AchievementSupplyExhausted: {
    en: "Achievement supply exhausted",
    "pt-BR": "Estoque de conquistas esgotado",
    es: "Suministro de logros agotado",
  },
  AchievementIdTooLong: {
    en: "Achievement ID too long",
    "pt-BR": "ID de conquista muito longo",
    es: "ID de logro demasiado largo",
  },
  AchievementNameTooLong: {
    en: "Achievement name too long",
    "pt-BR": "Nome de conquista muito longo",
    es: "Nombre de logro demasiado largo",
  },
  AchievementUriTooLong: {
    en: "Achievement URI too long",
    "pt-BR": "URI de conquista muito longo",
    es: "URI de logro demasiado largo",
  },
  InvalidAmount: {
    en: "Amount must be greater than zero",
    "pt-BR": "Valor deve ser maior que zero",
    es: "Monto debe ser mayor que cero",
  },
  InvalidXpReward: {
    en: "XP reward must be greater than zero",
    "pt-BR": "Recompensa XP deve ser maior que zero",
    es: "Recompensa XP debe ser mayor que cero",
  },
};

const WALLET_ERRORS: Record<string, LocaleMessages> = {
  WalletNotConnected: {
    en: "Please connect your wallet",
    "pt-BR": "Conecte sua carteira",
    es: "Conecta tu billetera",
  },
  WalletSignTransactionError: {
    en: "Transaction rejected",
    "pt-BR": "Transação rejeitada",
    es: "Transacción rechazada",
  },
  UserRejected: {
    en: "Transaction cancelled",
    "pt-BR": "Transação cancelada",
    es: "Transacción cancelada",
  },
};

export function mapAnchorError(err: unknown, locale: string): string {
  const loc = (locale === "pt-BR" || locale === "es" ? locale : "en") as keyof LocaleMessages;

  if (err && typeof err === "object") {
    // Anchor program error
    const code = (err as Record<string, unknown>).error as { errorCode?: { code?: string } } | undefined;
    const errorName = code?.errorCode?.code;
    if (errorName && ERROR_MAP[errorName]) return ERROR_MAP[errorName][loc];

    // Wallet adapter error
    const name = (err as { name?: string }).name;
    if (name && WALLET_ERRORS[name]) return WALLET_ERRORS[name][loc];

    // User rejected (various shapes)
    const msg = (err as { message?: string }).message ?? "";
    if (msg.includes("User rejected") || msg.includes("user rejected")) {
      return WALLET_ERRORS.UserRejected[loc];
    }
  }

  const fallback: LocaleMessages = {
    en: "An unexpected error occurred",
    "pt-BR": "Ocorreu um erro inesperado",
    es: "Ocurrió un error inesperado",
  };
  return fallback[loc];
}
