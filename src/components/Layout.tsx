import { ReactNode } from "react";
import ProfileIcon from "./ProfileIcon";

interface LayoutProps {
  children: ReactNode;
  showProfile?: boolean;
}

const Layout = ({ children, showProfile = true }: LayoutProps) => {
  return (
    <div className="min-h-screen relative">
      {/* Profile Icon - Fixed in top right */}
      {showProfile && (
        <div className="fixed top-4 right-4 z-50">
          <ProfileIcon />
        </div>
      )}
      
      {/* Main Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

export default Layout;