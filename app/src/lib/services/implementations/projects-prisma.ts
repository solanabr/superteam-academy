import { prisma } from '@/lib/db/client';
import type {
  ProjectService,
  CreateProjectInput,
  CreateFeedbackInput,
  ProjectFilter,
} from '@/lib/services/interfaces/index';
import type { Project, ProjectFeedback, ProjectBadge, Prisma } from '@prisma/client';

// In-memory storage for user likes (since schema doesn't have a ProjectLike table)
const userLikes = new Set<string>();

export class PrismaProjectService implements ProjectService {
  async getProjects(
    filter?: ProjectFilter,
    page = 1,
    limit = 20
  ): Promise<Project[]> {
    const where: Prisma.ProjectWhereInput = {
      status: 'published',
    };

    if (filter) {
      if (filter.tags?.length) {
        where.tags = {
          hasSome: filter.tags,
        };
      }

      if (filter.ownerId) {
        where.ownerId = filter.ownerId;
      }

      if (filter.featured) {
        // Featured projects have badges or high engagement
        where.badges = {
          some: {
            badgeType: 'featured',
          },
        };
      }

      if (filter.query) {
        where.OR = [
          { title: { contains: filter.query, mode: 'insensitive' } },
          { description: { contains: filter.query, mode: 'insensitive' } },
        ];
      }
    }

    return prisma.project.findMany({
      where,
      orderBy: [
        { likes: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getProjectById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
          },
        },
        feedback: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        badges: true,
      },
    });
  }

  async createProject(data: CreateProjectInput, ownerId: string): Promise<Project> {
    return prisma.project.create({
      data: {
        ...data,
        ownerId,
        status: 'published',
      },
    });
  }

  async updateProject(id: string, data: Partial<CreateProjectInput>): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data,
    });
  }

  async deleteProject(id: string): Promise<void> {
    await prisma.project.delete({
      where: { id },
    });
  }

  async addFeedback(
    projectId: string,
    userId: string,
    data: CreateFeedbackInput
  ): Promise<ProjectFeedback> {
    return prisma.projectFeedback.create({
      data: {
        projectId,
        userId,
        content: data.content,
        rating: data.rating,
      },
    });
  }

  async getFeedbackForProject(projectId: string): Promise<ProjectFeedback[]> {
    return prisma.projectFeedback.findMany({
      where: { projectId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async awardBadge(
    projectId: string,
    badgeType: 'featured' | 'community_choice' | 'code_quality' | 'innovation'
  ): Promise<ProjectBadge> {
    return prisma.projectBadge.create({
      data: {
        projectId,
        badgeType,
      },
    });
  }

  async incrementViews(id: string): Promise<void> {
    await prisma.project.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    });
  }

  async toggleLike(id: string, userId: string): Promise<boolean> {
    const likeKey = `${userId}:${id}`;
    const isLiked = userLikes.has(likeKey);

    if (isLiked) {
      // Unlike
      userLikes.delete(likeKey);
      await prisma.project.update({
        where: { id },
        data: {
          likes: {
            decrement: 1,
          },
        },
      });
      return false;
    } else {
      // Like
      userLikes.add(likeKey);
      await prisma.project.update({
        where: { id },
        data: {
          likes: {
            increment: 1,
          },
        },
      });
      return true;
    }
  }
}

export const projectService = new PrismaProjectService();
