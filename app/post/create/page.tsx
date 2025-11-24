import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createPost } from "@/lib/actions/posts";
import { syncUser } from "@/lib/actions/users";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { TOP_STOCKS } from "@/lib/market/top-stocks";

async function createPostAction(formData: FormData) {
  "use server";
  const result = await createPost(formData);
  if (result.success) {
    redirect("/feed");
  }
}

export default async function CreatePostPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Sync user with Clerk
  await syncUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/feed" className="flex items-center gap-2 text-xl font-bold text-blue-600 hover:text-blue-700">
                <Image src="/icon.png" alt="CapitalChirp" width={32} height={32} className="object-contain" />
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
              <Link href="/post/create" className="text-blue-600 font-medium">
                New Post
              </Link>
            </div>
            <UserButton />
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Post</h1>
          <p className="text-gray-600">Share your investment insights with the community</p>
        </div>

        <form action={createPostAction} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="space-y-6">
            <div>
              <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 mb-2">
                Ticker Symbol (Optional)
              </label>
              <select
                id="ticker"
                name="ticker"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              >
                <option value="">Select a ticker...</option>
                {TOP_STOCKS.map((ticker) => (
                  <option key={ticker} value={ticker} className="text-gray-900">
                    {ticker}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="analysisType" className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Type
              </label>
              <select
                id="analysisType"
                name="analysisType"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                defaultValue="fundamental"
              >
                <option value="technical" className="text-gray-900">Technical Analysis</option>
                <option value="fundamental" className="text-gray-900">Fundamental Analysis</option>
                <option value="macro" className="text-gray-900">Macro Economic</option>
                <option value="catalyst" className="text-gray-900">Catalyst/Event</option>
                <option value="risk_warning" className="text-gray-900">Risk Warning</option>
              </select>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Your Insight
              </label>
              <textarea
                id="content"
                name="content"
                rows={10}
                required
                minLength={10}
                maxLength={5000}
                placeholder="Share your analysis, insights, or observations. Be specific and evidence-based..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder:text-gray-500 bg-white"
              />
              <p className="mt-2 text-sm text-gray-500">Minimum 10 characters, maximum 5000 characters</p>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Publish Post
              </button>
              <Link
                href="/feed"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

