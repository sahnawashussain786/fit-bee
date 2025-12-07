import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [messages, setMessages] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminSuccess, setAdminSuccess] = useState("");
  const [adminError, setAdminError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token"); // Assuming token storage
      if (!token) {
        setError("No token found. Please log in.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/messages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        const err = await response.json();
        if (response.status === 401) {
          setError("Unauthorized. Please try refreshing or logging in again.");
          localStorage.removeItem("token");
        } else {
          setError(err.error || "Failed to fetch messages");
        }
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAdminSuccess("");
    setAdminError("");

    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/auth/promote", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newAdminEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setAdminSuccess(`User ${newAdminEmail} is now an admin.`);
        setNewAdminEmail("");
      } else {
        setAdminError(data.message || "Failed to promote user.");
      }
    } catch (err) {
      setAdminError("Something went wrong.");
    }
  };

  // NOTE: In a real app we'd redirect if not authorized in a useEffect
  // but for simplicity we render the error state
  if (error) {
    return (
      <div className="min-h-screen bg-deep-bg text-white pt-32 px-6 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
        <p className="text-gray-300 mb-8">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-neon-blue text-black rounded font-bold"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-bg text-white pt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-12">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-bold font-heading"
          >
            Admin <span className="text-neon-blue">Dashboard</span>
          </motion.h1>

          {/* Minimal Add Admin Section in Header */}
          <div className="relative">
            {/* Could be a modal, keeping it simple for now */}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar / Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card-bg p-8 rounded-3xl border border-white/10 h-fit"
          >
            <h2 className="text-2xl font-bold mb-6">Promote Admin</h2>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  User Email
                </label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  required
                  placeholder="Enter email..."
                  className="w-full bg-deep-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-blue outline-none"
                />
              </div>
              {adminSuccess && (
                <p className="text-green-400 text-sm">{adminSuccess}</p>
              )}
              {adminError && (
                <p className="text-red-400 text-sm">{adminError}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 bg-neon-purple text-white font-bold rounded-xl hover:bg-neon-purple/80 transition-colors"
              >
                Add Admin
              </button>
            </form>
          </motion.div>

          {/* Main Content / Messages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <h2 className="text-2xl font-bold mb-4">Recent Messages</h2>

            {loading ? (
              <p className="text-gray-400">Loading messages...</p>
            ) : messages.length === 0 ? (
              <div className="bg-card-bg p-8 rounded-3xl border border-white/10 text-center text-gray-400">
                No messages found.
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    className="bg-card-bg p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-white">
                          {msg.firstName} {msg.lastName}
                        </h3>
                        <p className="text-neon-blue text-sm">{msg.email}</p>
                      </div>
                      <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300 leading-relaxed bg-deep-bg/50 p-4 rounded-xl">
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
