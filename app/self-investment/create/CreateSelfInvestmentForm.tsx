"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSelfInvestment } from "@/lib/actions/self-investments";
import Link from "next/link";

export function CreateSelfInvestmentForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    if (isSubmitting || isPending) {
      return;
    }

    setIsSubmitting(true);

    startTransition(async () => {
      try {
        const result = await createSelfInvestment(formData);
        if (result.success) {
          router.push("/self-investment");
        } else {
          setIsSubmitting(false);
        }
      } catch (error) {
        console.error("Error creating self-investment:", error);
        setIsSubmitting(false);
      }
    });
  }

  const isLoading = isSubmitting || isPending;

  return (
    <form action={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Investment Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            disabled={isLoading}
            placeholder="e.g., AWS Solutions Architect Certification"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            maxLength={200}
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            id="category"
            name="category"
            required
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            defaultValue="other"
          >
            <option value="course" className="text-gray-900">Course</option>
            <option value="certification" className="text-gray-900">Certification</option>
            <option value="book" className="text-gray-900">Book</option>
            <option value="tool" className="text-gray-900">Tool / Software</option>
            <option value="coaching" className="text-gray-900">Coaching / Mentoring</option>
            <option value="other" className="text-gray-900">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="amountInvested" className="block text-sm font-medium text-gray-700 mb-2">
              Amount Invested ($) *
            </label>
            <input
              type="number"
              id="amountInvested"
              name="amountInvested"
              required
              min="0"
              step="0.01"
              disabled={isLoading}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="investmentDate" className="block text-sm font-medium text-gray-700 mb-2">
              Investment Date *
            </label>
            <input
              type="date"
              id="investmentDate"
              name="investmentDate"
              required
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              defaultValue={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        <div>
          <label htmlFor="outcome" className="block text-sm font-medium text-gray-700 mb-2">
            Outcome *
          </label>
          <select
            id="outcome"
            name="outcome"
            required
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            defaultValue="in_progress"
          >
            <option value="paid_off" className="text-gray-900">✅ Paid Off</option>
            <option value="didnt_pay_off" className="text-gray-900">❌ Didn't Pay Off</option>
            <option value="in_progress" className="text-gray-900">⏳ In Progress</option>
            <option value="too_early" className="text-gray-900">🕐 Too Early to Tell</option>
          </select>
        </div>

        <div>
          <label htmlFor="roi" className="block text-sm font-medium text-gray-700 mb-2">
            ROI (%) <span className="text-gray-500 text-xs">(Optional - can be negative)</span>
          </label>
          <input
            type="number"
            id="roi"
            name="roi"
            step="0.1"
            disabled={isLoading}
            placeholder="e.g., 500 (for 500% ROI) or -50 (for -50% ROI)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">
            Calculate ROI: ((Value Gained - Amount Invested) / Amount Invested) × 100
          </p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            required
            minLength={10}
            maxLength={2000}
            disabled={isLoading}
            placeholder="Describe your investment, what you learned, how it helped (or didn't), and the results..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder:text-gray-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-2 text-sm text-gray-500">Minimum 10 characters, maximum 2000 characters</p>
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
                <span>Saving...</span>
              </>
            ) : (
              "Add Investment"
            )}
          </button>
          <Link
            href="/self-investment"
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


