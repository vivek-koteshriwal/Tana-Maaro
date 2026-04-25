import { FeedCard } from "@/components/feed/feed-card";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { verifyAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Post } from "@/types/feed";
import { notFound } from "next/navigation";

export default async function SharedPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const post = (await db.getPostById(postId)) as any;
  if (!post) {
    notFound();
  }

  const authUser = await verifyAuth();
  const typedPost: Post = {
    ...post,
    isLiked: authUser ? (post.likedBy || []).includes(authUser.id) : false,
    isDisliked:
      authUser ? (post.dislikedBy || []).includes(authUser.id) : false,
  } as Post;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="mx-auto mt-16 max-w-4xl px-4 py-8">
        <div className="mb-8 rounded-3xl border border-red-900/30 bg-gradient-to-br from-red-950/40 via-black to-black p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-red-500">
            Shared Roast
          </p>
          <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
            Open The Roast
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-400 md:text-base">
            Jump straight into the post, reactions, and replies on Tana Maaro.
          </p>
        </div>

        <FeedCard post={typedPost} />
      </main>

      <Footer />
    </div>
  );
}
