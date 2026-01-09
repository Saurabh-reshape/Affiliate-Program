import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="text-center px-6">
        <div className="mb-6">
          <div className="text-6xl mb-4">🚀</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Coming Soon</h1>
          <p className="text-lg text-gray-600 mb-8">
            Analytics is under development and will be available soon. We're
            working hard to bring you powerful insights!
          </p>
        </div>

        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>
      </div>
    </div>
  );
}
