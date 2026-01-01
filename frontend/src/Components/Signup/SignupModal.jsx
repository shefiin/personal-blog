import React, { useState } from "react";
import { http } from "../../api/http";


const SignupModal = ({ onClose }) => {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async(e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await http.post("/api/auth/register", {
                name,
                email,
                password
            });

            onClose();
        } catch(err){
            const message =
                err.response?.data?.message || "register failed. Please try again.";
            setError(message);
        } finally {
          setLoading(false);
        }
    };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ❌
        </button>

        <h2 className="text-xl font-semibold mb-4">Signup</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="name"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-2 mb-3 rounded"
            required
          />

          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 mb-3 rounded"
            required
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-2 mb-3 rounded"
            required
          />

          {/* Error */}
          {error && (
            <p className="text-red-600 text-sm mb-2">{error}</p>
          )}

          {/* Submit */}
         
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white py-2 rounded flex items-center justify-center gap-2 disabled:opacity-60"
            >
                {loading ? (
                    <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    "Login"
                )}
            </button>

        </form>
      </div>
    </div>
  );
};

export default SignupModal;
