import { FeedCard } from "@/components/feed/feed-card";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { verifyAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Post } from "@/types/feed";

function containsHashtag(content: string, hashtag: string) {
  const matcher = new RegExp(`(?:^|\\s)#${hashtag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return matcher.test(content);
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ hashtag: string }>;
}) {
  const { hashtag } = await params;
  const cleanHashtag = decodeURIComponent(hashtag).replace(/^#/, "").toLowerCase();
  const authUser = await verifyAuth();
  const posts = ((await db.getPosts(1, 100)) as any[]).filter((post) =>
    containsHashtag(post.content || "", cleanHashtag),
  );

  const typedPosts: Post[] = posts.map((post: any) => ({
    ...post,
    isLiked: authUser ? (post.likedBy || []).includes(authUser.id) : false,
    isDisliked:
      authUser ? (post.dislikedBy || []).includes(authUser.id) : false,
  })) as Post[];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="mx-auto mt-16 max-w-4xl px-4 py-8">
        <div className="mb-8 rounded-3xl border border-red-900/30 bg-gradient-to-br from-red-950/40 via-black to-black p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-red-500">
            Hashtag Feed
          </p>
          <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
            #{cleanHashtag}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-400 md:text-base">
            Fresh roasts carrying this hashtag across Tana Maaro.
          </p>
        </div>

        {typedPosts.length > 0 ? (
          <div className="space-y-6">
            {typedPosts.map((post) => (
              <FeedCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/50 px-6 py-16 text-center text-gray-400">
            No roasts found for #{cleanHashtag} yet.
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
