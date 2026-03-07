import { prisma } from '@/lib/db/client';
import { Errors } from '@/lib/api/errors';
import type {
  HackathonService,
  CreateHackathonInput,
  HackathonFilter,
} from '@/lib/services/interfaces/index';
import type { HackathonEvent, Prisma } from '@prisma/client';

export class PrismaHackathonService implements HackathonService {
  async getUpcomingEvents(limit = 10): Promise<HackathonEvent[]> {
    const now = new Date();

    return prisma.hackathonEvent.findMany({
      where: {
        endDate: {
          gte: now,
        },
      },
      orderBy: { startDate: 'asc' },
      take: limit,
    });
  }

  async getEvents(
    filter?: HackathonFilter,
    page = 1,
    limit = 20
  ): Promise<HackathonEvent[]> {
    const where: Prisma.HackathonEventWhereInput = {};

    if (filter) {
      if (filter.startDate) {
        where.startDate = {
          gte: filter.startDate,
        };
      }

      if (filter.endDate) {
        where.endDate = {
          lte: filter.endDate,
        };
      }

      if (filter.location === 'virtual') {
        where.location = {
          contains: 'Virtual',
        };
      } else if (filter.location === 'physical') {
        where.NOT = {
          location: {
            contains: 'Virtual',
          },
        };
      }

      if (filter.tags?.length) {
        where.tags = {
          hasSome: filter.tags,
        };
      }
    }

    return prisma.hackathonEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getEventsByMonth(year: number, month: number): Promise<HackathonEvent[]> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    return prisma.hackathonEvent.findMany({
      where: {
        OR: [
          {
            // Events that start in this month
            startDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          {
            // Events that span into this month
            startDate: {
              lt: startOfMonth,
            },
            endDate: {
              gte: startOfMonth,
            },
          },
        ],
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async getEventById(id: string): Promise<HackathonEvent | null> {
    return prisma.hackathonEvent.findUnique({
      where: { id },
    });
  }

  async createEvent(data: CreateHackathonInput): Promise<HackathonEvent> {
    return prisma.hackathonEvent.create({
      data: {
        ...data,
        source: 'manual',
      },
    });
  }

  async updateEvent(id: string, data: Partial<CreateHackathonInput>): Promise<HackathonEvent> {
    return prisma.hackathonEvent.update({
      where: { id },
      data,
    });
  }

  async deleteEvent(id: string): Promise<void> {
    await prisma.hackathonEvent.delete({
      where: { id },
    });
  }

  async syncFromDevfolio(): Promise<number> {
    throw Errors.serviceUnavailable(
      'Hackathon sync is not configured. Connect a real Devfolio integration before syncing.'
    );
  }
}

export const hackathonService = new PrismaHackathonService();
