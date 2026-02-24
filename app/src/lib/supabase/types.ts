export interface Thread {
  id: string;
  title: string;
  body: string;
  author_wallet: string;
  course_id: string | null;
  category: "general" | "help" | "showcase" | "feedback";
  is_answered: boolean;
  upvotes: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
}

export interface Reply {
  id: string;
  thread_id: string;
  body: string;
  author_wallet: string;
  is_accepted_answer: boolean;
  upvotes: number;
  parent_reply_id: string | null;
  created_at: string;
}

export interface Vote {
  id: string;
  user_wallet: string;
  thread_id: string | null;
  reply_id: string | null;
  vote_type: "up";
  created_at: string;
}
