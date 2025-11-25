import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUser } from "@/lib/actions/users";
import { getUserSelfInvestments, getTopROIs, getWorstROIs, getAllSelfInvestments } from "@/lib/actions/self-investments";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export default async function SelfInvestmentPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Sync user with Clerk
  try {
    await syncUser();
  } catch (error) {
    console.error("Failed to sync user:", error);
  }

  // Get user data for display
  const userData = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userData[0];

  // Fetch data
  const [userInvestments, topROIs, worstROIs, allInvestments] = await Promise.all([
    getUserSelfInvestments(userId),
    getTopROIs(10),
    getWorstROIs(10),
    getAllSelfInvestments(),
  ]);

  // Get user info for top/worst ROIs
  const userIds = [...new Set([...topROIs, ...worstROIs].map((inv) => inv.userId))];
  const userMap = new Map();
  if (userIds.length > 0) {
    const allUsers = await db.select().from(users).where(inArray(users.id, userIds));
    allUsers.forEach((u) => userMap.set(u.id, u));
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatROI = (roi: number | null) => {
    if (roi === null) return "N/A";
    const sign = roi >= 0 ? "+" : "";
    return `${sign}${roi.toFixed(1)}%`;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      course: "bg-blue-100 text-blue-800",
      certification: "bg-green-100 text-green-800",
      book: "bg-purple-100 text-purple-800",
      tool: "bg-orange-100 text-orange-800",
      coaching: "bg-pink-100 text-pink-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.other;
  };

  const getOutcomeColor = (outcome: string) => {
    const colors: Record<string, string> = {
      paid_off: "text-green-600 font-semibold",
      didnt_pay_off: "text-red-600 font-semibold",
      in_progress: "text-yellow-600 font-semibold",
      too_early: "text-gray-600 font-semibold",
    };
    return colors[outcome] || colors.too_early;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/feed" className="flex items-center gap-2 text-xl font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
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
              <Link href="/self-investment" className="text-blue-600 font-medium">
                Self Investment
              </Link>
              <Link href="/post/create" className="text-gray-700 hover:text-blue-600 font-medium">
                New Post
              </Link>
            </div>
            <UserButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Self Investment Portfolio</h1>
            <p className="text-gray-600">Track your investments in yourself - courses, certifications, books, and more</p>
          </div>
          <Link
            href="/self-investment/create"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Add Investment
          </Link>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Total Invested</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(userInvestments.reduce((sum, inv) => sum + inv.amountInvested, 0))}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Total Investments</div>
            <div className="text-2xl font-bold text-gray-900">{userInvestments.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Paid Off</div>
            <div className="text-2xl font-bold text-green-600">
              {userInvestments.filter((inv) => inv.outcome === "paid_off").length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">In Progress</div>
            <div className="text-2xl font-bold text-yellow-600">
              {userInvestments.filter((inv) => inv.outcome === "in_progress").length}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top ROIs */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Top ROIs</h2>
            <div className="space-y-3">
              {topROIs.length === 0 ? (
                <p className="text-gray-500 text-sm">No investments with paid-off outcomes yet.</p>
              ) : (
                topROIs.map((investment) => {
                  const investmentUser = userMap.get(investment.userId);
                  return (
                    <div key={investment.id} className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{investment.title}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(investment.category || "other")}`}>
                              {investment.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            by {investmentUser?.displayName || investmentUser?.username || "Anonymous"}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{formatROI(investment.roi)}</div>
                          <div className="text-xs text-gray-500">{formatCurrency(investment.amountInvested)}</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{investment.description}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Worst ROIs */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📉 Worst ROIs</h2>
            <div className="space-y-3">
              {worstROIs.length === 0 ? (
                <p className="text-gray-500 text-sm">No investments that didn't pay off yet.</p>
              ) : (
                worstROIs.map((investment) => {
                  const investmentUser = userMap.get(investment.userId);
                  return (
                    <div key={investment.id} className="p-4 border border-gray-200 rounded-lg hover:border-red-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{investment.title}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(investment.category || "other")}`}>
                              {investment.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            by {investmentUser?.displayName || investmentUser?.username || "Anonymous"}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-600">{formatROI(investment.roi)}</div>
                          <div className="text-xs text-gray-500">{formatCurrency(investment.amountInvested)}</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{investment.description}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* User's Investments */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Investments</h2>
          {userInvestments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">You haven't added any self-investments yet.</p>
              <Link
                href="/self-investment/create"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Add Your First Investment
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {userInvestments.map((investment) => (
                <div key={investment.id} className="p-5 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{investment.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(investment.category || "other")}`}>
                          {investment.category}
                        </span>
                        <span className={`text-sm ${getOutcomeColor(investment.outcome)}`}>
                          {investment.outcome.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span>Invested: {formatCurrency(investment.amountInvested)}</span>
                        {investment.roi !== null && (
                          <span className={`font-semibold ${investment.roi >= 0 ? "text-green-600" : "text-red-600"}`}>
                            ROI: {formatROI(investment.roi)}
                          </span>
                        )}
                        <span>
                          {new Date(investment.investmentDate).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700">{investment.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

