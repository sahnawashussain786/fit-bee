import React from "react";
import { UserProfile as ClerkUserProfile } from "@clerk/clerk-react";
import { motion } from "framer-motion";

const UserProfile = () => {
  return (
    <div className="min-h-screen bg-deep-bg pt-24 pb-12 px-4 flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <ClerkUserProfile
          path="/profile"
          routing="path"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-card-bg border border-white/10 shadow-2xl rounded-3xl w-full",
              navbar: "hidden md:flex",
              navbarMobileMenuButton: "md:hidden",
              headerTitle: "text-white font-heading",
              headerSubtitle: "text-gray-400",
            },
          }}
        />
      </motion.div>
    </div>
  );
};

export default UserProfile;
