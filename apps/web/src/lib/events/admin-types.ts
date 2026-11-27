/** An event as Admin > Events sees it, code included. Client-safe. */
export interface AdminEvent {
  id: string;
  achievementId: string;
  name: string;
  description: string;
  imageUrl: string | null;
  xpReward: number;
  code: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  collectionAddress: string | null;
  deployTx: string | null;
  deployedAt: string | null;
  attendees: number;
}
