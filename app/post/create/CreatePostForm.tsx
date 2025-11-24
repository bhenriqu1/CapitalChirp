"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/lib/actions/posts";
import { TOP_STOCKS } from "@/lib/market/top-stocks";
import Link from "next/link";

export function CreatePostForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    // Prevent multiple submissions
    if (isSubmitting || isPending) {
      return;
    }

    setIsSubmitting(true);

    startTransition(async () => {
      try {
        const result = await createPost(formData);
        if (result.success) {
          router.push("/feed");
        } else {
          // Handle error - could show error message
          setIsSubmitting(false);
        }
      } catch (error) {
        console.error("Error creating post:", error);
        setIsSubmitting(false);
      }
    });
  }

  const isLoading = isSubmitting || isPending;

  return (
    <form action={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="space-y-6">
        <div>
          <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 mb-2">
            Ticker Symbol (Optional)
          </label>
          <select
            id="ticker"
            name="ticker"
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={isLoading}
            placeholder="Share your analysis, insights, or observations. Be specific and evidence-based..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder:text-gray-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-2 text-sm text-gray-500">Minimum 10 characters, maximum 5000 characters</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Publishing...</span>
              </>
            ) : (
              "Publish Post"
            )}
          </button>
          <Link
            href="/feed"
            className={`px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors ${
              isLoading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}

