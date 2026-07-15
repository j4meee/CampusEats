import { Star } from "lucide-react";
import { useState } from "react";
import { fetchJson } from "../lib/api";

export function PickupConfirmationScreen({ order, onDone }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const orders = Array.isArray(order) ? order : order ? [order] : [];
  const orderNumbers = orders.length > 0 ? orders.map((item) => item.orderNumber).join(", ") : "confirmed";

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);

    try {
      await Promise.all(
        orders.map((item) =>
          fetchJson(`/api/orders/${item.id}/feedback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rating, comment }),
          }),
        ),
      );

      setSubmitted(true);
      setTimeout(onDone, 1800);
    } catch (feedbackError) {
      setError(feedbackError.message || "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8] items-center justify-center px-4 sm:px-6 text-center">
      <div className="max-w-md w-full">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5 sm:mb-6">
          <span className="text-5xl sm:text-6xl">OK</span>
        </div>

        <h1 className="text-gray-900 mb-1">Enjoy your meal!</h1>
        <p className="text-gray-500 text-sm sm:text-base mb-8 sm:mb-10">
          Order <span className="text-gray-700">{orderNumbers}</span> has been collected.
        </p>

        {!submitted ? (
          <div className="w-full bg-white rounded-2xl border border-gray-100 px-5 sm:px-6 py-5 sm:py-6 mb-4">
            <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
              How was your experience?
            </p>
            <div className="flex justify-center gap-3 sm:gap-4 mb-4 sm:mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                  type="button"
                >
                  <Star
                    className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                      (hovered || rating) >= star ? "text-[#f97316] fill-[#f97316]" : "text-gray-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Optional comment"
              className="w-full min-h-20 resize-none rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all mb-3"
            />
            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
                {error}
              </p>
            )}
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              className="w-full bg-[#f97316] hover:bg-orange-600 text-white rounded-xl py-2.5 sm:py-3 text-sm sm:text-base disabled:opacity-40 disabled:hover:bg-[#f97316] transition-colors"
            >
              {submitting ? "Saving..." : "Submit Feedback"}
            </button>
            <button
              onClick={onDone}
              className="w-full text-gray-400 hover:text-gray-600 text-sm sm:text-base mt-2 py-2 transition-colors"
              type="button"
            >
              Skip
            </button>
          </div>
        ) : (
          <div className="w-full bg-green-50 border border-green-100 rounded-2xl px-5 sm:px-6 py-5 sm:py-6 mb-4">
            <p className="text-green-600 text-sm sm:text-base">Thanks for your feedback!</p>
          </div>
        )}

        <p className="text-xs sm:text-sm text-gray-400">
          Save time tomorrow - pre-order starts at 7 AM
        </p>
      </div>
    </div>
  );
}
