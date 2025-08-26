import React from "react";

const AccountBar = () => {
  // Dummy user data
  const user = {
    name: "John Doe",
    email: "johndoe@vault.com",
    designation: "System Administrator",
    profilePic: "https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff", // This generates a placeholder avatar
  };

  return (
    <div className="fixed top-4 right-6 flex items-center space-x-4 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm hover:bg-white/80 transition-all duration-200">
      {/* Profile Image */}
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-100 shadow-md">
        <img
          src={user.profilePic}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      </div>

      {/* User Info */}
      <div className="text-left">
        <p className="text-sm font-semibold text-gray-800">{user.name}</p>
        <p className="text-xs text-gray-500">{user.email}</p>
        <p className="text-[10px] text-blue-600 font-medium">{user.designation}</p>
      </div>
    </div>
  );
};

export default AccountBar;
