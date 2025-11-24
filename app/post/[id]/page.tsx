import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { posts, users, reactions, postTags } from "@/lib/db/schema";
import { PostCard } from "@/components/ui/PostCard";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

async function getPost(id: string) {
  const postData = await db
    .select()
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);

  if (postData.length === 0) {
    return null;
  }

  const post = postData[0];

  // Get user
  const userData = await db.select().from(users).where(eq(users.id, post.userId)).limit(1);
  const user = userData[0];

  // Get reactions
  const reactionCounts = await db
    .select({
      reactionType: reactions.reactionType,
      count: sql<number>`count(*)`,
    })
    .from(reactions)
    .where(eq(reactions.postId, id))
    .groupBy(reactions.reactionType);

  const reactionsObj = {
    like: 0,
    bullish: 0,
    bearish: 0,
    insightful: 0,
  };
  reactionCounts.forEach((r) => {
    reactionsObj[r.reactionType as keyof typeof reactionsObj] = Number(r.count);
  });

  // Get tags
  const tags = await db
    .select({
      tagType: postTags.tagType,
      tagValue: postTags.tagValue,
    })
    .from(postTags)
    .where(eq(postTags.postId, id));

  return {
    id: post.id,
    content: post.content,
    ticker: post.ticker || undefined,
    analysisType: post.analysisType,
    qualityScore: post.qualityScore ? parseFloat(post.qualityScore) : undefined,
    createdAt: post.createdAt,
    user: {
      id: user.id,
      displayName: user.displayName || undefined,
      username: user.username || undefined,
      avatarUrl: user.avatarUrl || undefined,
      reputationScore: user.reputationScore || undefined,
    },
    tags: tags.map((t) => ({ type: t.tagType, value: t.tagValue })),
    reactions: reactionsObj,
  };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const resolvedParams = await params;
  const post = await getPost(resolvedParams.id);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Post Not Found</h1>
          <Link href="/feed" className="text-blue-600 hover:text-blue-700">
            Return to Feed
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/feed" className="flex items-center gap-2 text-xl font-bold text-blue-600 hover:text-blue-700">
                <img src="/icon.png" alt="CapitalChirp" className="w-8 h-8 object-contain" />
                <span>CapitalChirp</span>
              </Link>
              <Link href="/feed" className="text-gray-700 hover:text-blue-600 font-medium">
                Feed
              </Link>
              <Link href="/stocks" className="text-gray-700 hover:text-blue-600 font-medium">
                Live Stocks
              </Link>
              <Link href="/market" className="text-gray-700 hover:text-blue-600 font-medium">
                Market Tracker
              </Link>
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">
                Dashboard
              </Link>
              <Link href="/post/create" className="text-gray-700 hover:text-blue-600 font-medium">
                New Post
              </Link>
            </div>
            <UserButton />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          ← Back to Feed
        </Link>

        <PostCard
          post={post}
          currentUserId={userId}
        />
      </main>
    </div>
  );
}

