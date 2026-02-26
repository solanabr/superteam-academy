import type { Comment } from "@/types";

export interface CommentService {
  getComments(courseId: string, lessonIndex: number): Promise<Comment[]>;
  createComment(
    userId: string,
    courseId: string,
    lessonIndex: number,
    content: string,
    parentId?: string,
  ): Promise<Comment>;
  updateComment(userId: string, commentId: string, content: string): Promise<Comment>;
  deleteComment(userId: string, commentId: string): Promise<void>;
  markHelpful(
    helpedUserId: string,
    commentId: string,
    helperId: string,
  ): Promise<void>;
}
