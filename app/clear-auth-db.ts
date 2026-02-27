// clear-auth-db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAuthData() {
  try {
    console.log('Начинаем очистку...');

    //const accountsDeleted = await prisma.account.deleteMany({});
    //console.log(`Удалено аккаунтов (OAuth): ${accountsDeleted.count}`);

    //const sessionsDeleted = await prisma.session.deleteMany({});
    //console.log(`Удалено сессий: ${sessionsDeleted.count}`);
    const LessonProgressDeleted = await prisma.lessonProgress.deleteMany({});
    console.log (`Удалено пройденных уроков: ${LessonProgressDeleted.count}`)

    const userEnrollmentDeleted= await prisma.userEnrollment.deleteMany({});
    console.log (`Удалено записанных пользователь: ${userEnrollmentDeleted.count}`)

    const XpHistoryDeleted = await prisma.xPHistory.deleteMany({});
    console.log (`Удалено XP из истории: ${XpHistoryDeleted.count}`)

    const usersDeleted = await prisma.user.deleteMany({});
    console.log(`Удалено пользователей: ${usersDeleted.count}`);



    console.log('Очистка завершена успешно!');
  } catch (error) {
    console.error('Ошибка при очистке:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAuthData();