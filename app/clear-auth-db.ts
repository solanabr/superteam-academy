// clear-auth-db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAuthData() {
  try {
    console.log('Начинаем очистку...');

    const usersDeleted = await prisma.user.deleteMany({});
    console.log(`Удалено пользователей: ${usersDeleted.count}`);

    const accountsDeleted = await prisma.account.deleteMany({});
    console.log(`Удалено аккаунтов (OAuth): ${accountsDeleted.count}`);

    const sessionsDeleted = await prisma.session.deleteMany({});
    console.log(`Удалено сессий: ${sessionsDeleted.count}`);

    console.log('Очистка завершена успешно!');
  } catch (error) {
    console.error('Ошибка при очистке:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAuthData();