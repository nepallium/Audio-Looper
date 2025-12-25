import { Outlet } from "react-router";
import BurgerMenu from "./BurgerMenu";

export default function AppLayout() {
  return (
    <div className="relative min-h-screen">
      {/* Persistent burger menu */}
      <BurgerMenu />

      {/* Page content */}
      <div className="relative z-0">
        <Outlet />
      </div>
    </div>
  );
}
