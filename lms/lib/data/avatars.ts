export const AVATARS = [
  { id: "ape-1", src: "/avtaars/hand-drawn-nft-style-ape-illustration/7705332.jpg" },
  { id: "ape-2", src: "/avtaars/hand-drawn-nft-style-ape-illustration%20(1)/7705314.jpg" },
  { id: "ape-3", src: "/avtaars/hand-drawn-nft-style-ape-illustration%20(2)/7748169.jpg" },
  { id: "ape-4", src: "/avtaars/hand-drawn-nft-style-ape-illustration%20(3)/7705323.jpg" },
  { id: "ape-5", src: "/avtaars/hand-drawn-nft-style-ape-illustration%20(4)/7742207.jpg" },
  { id: "ape-6", src: "/avtaars/hand-drawn-nft-style-ape-illustration%20(5)/7705329.jpg" },
  { id: "ape-7", src: "/avtaars/hand-drawn-nft-style-ape-illustration%20(6)/7748178.jpg" },
  { id: "ape-8", src: "/avtaars/hand-drawn-nft-style-ape-illustration%20(7)/7748166.jpg" },
  { id: "ape-9", src: "/avtaars/hand-drawn-nft-style-ape-illustration%20(8)/7742215.jpg" },
  { id: "ape-10", src: "/avtaars/hand-drawn-nft-style-ape-illustration%20(9)/7742207.jpg" },
  { id: "ape-11", src: "/avtaars/hand-drawn-nft-style-ape-illustration%20(10)/7742248.jpg" },
  { id: "ape-12", src: "/avtaars/hand-drawn-nft-style-ape-illustration%20(11)/7742210.jpg" },
  { id: "ape-13", src: "/avtaars/hand-drawn-nft-style-ape-illustration%20(12)/7742242.jpg" },
];

export function getAvatarSrc(avatarId: string | undefined): string | undefined {
  if (!avatarId) return undefined;
  return AVATARS.find((a) => a.id === avatarId)?.src;
}
