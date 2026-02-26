import { Star, User } from "lucide-react";

interface Review {
    id: string;
    author: string;
    rating: number;
    comment: string;
    date: string;
}

const STATIC_REVIEWS: Review[] = [
    {
        id: "1",
        author: "Alex J.",
        rating: 5,
        comment: "Excellent course! The examples were very clear and the interactive IDE made it easy to follow along.",
        date: "2024-02-15"
    },
    {
        id: "2",
        author: "Marina S.",
        rating: 4,
        comment: "Very helpful for understanding the basics of Anchor. I wish there were more advanced examples at the end.",
        date: "2024-02-10"
    },
    {
        id: "3",
        author: "Ricardo G.",
        rating: 5,
        comment: "O conteúdo traduzido para Português está impecável. Facilitou muito o meu aprendizado.",
        date: "2024-02-01"
    }
];

export function ReviewsSection() {
    return (
        <section className="mt-16 border-t border-white/5 pt-12">
            <h2 className="font-display text-text-primary mb-8 text-2xl font-semibold flex items-center gap-3">
                Student Reviews
                <span className="text-sm font-normal text-text-muted bg-white/5 px-3 py-1 rounded-full">
                    {STATIC_REVIEWS.length} reviews
                </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {STATIC_REVIEWS.map((review) => (
                    <div key={review.id} className="glass-panel p-6 border border-white/5 rounded-xl bg-white/2 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-solana/10 flex items-center justify-center border border-solana/20">
                                    <User className="h-5 w-5 text-solana" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{review.author}</p>
                                    <p className="text-[10px] text-text-muted">{review.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`h-3 w-3 ${i < review.rating ? "text-solana fill-solana" : "text-white/10"}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            "{review.comment}"
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
