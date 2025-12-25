import { useState, useEffect } from "react";
import { Turn as Hamburger } from "hamburger-react";
import { IoIosSearch } from "react-icons/io";
import { CiBookmarkCheck } from "react-icons/ci";
import { useNavigate, useLocation } from "react-router";

export default function BurgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="text-base-dark">
      <div className="absolute top-[50%] translate-y-[-50%] left-0 text-base-light z-50">
        <Hamburger
          size={24}
          toggled={isOpen}
          toggle={setIsOpen}
          direction="right"
        />
      </div>
      {/* menu */}
      <nav
        className={`
            fixed top-0 left-0 h-screen w-[70%] z-40
            px-6 pt-20 font-normal
            bg-surface-300/[0.96] backdrop-blur-sm
            duration-300 ease-out transform transition-transform
            ${isOpen ? "translate-x-0" : "-translate-x-full -left-3"}
            `}
      >
        <ul className="flex flex-col gap-8">
          <li
            className="flex items-center gap-2"
            onClick={() => {
              setIsOpen(false);
              navigate("/yt-search");
            }}
          >
            <IoIosSearch />
            <p className="text-lg">Youtube Search</p>
          </li>
          <li
            className="flex items-center gap-2"
            onClick={() => {
              setIsOpen(false);
              navigate("/");
            }}
          >
            <CiBookmarkCheck />
            <p className="text-lg">Saved Audios</p>
          </li>
        </ul>
      </nav>
      {/* backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className={`
          fixed inset-0 z-30
          bg-black/40
          transition-opacity duration-300 ease-out
          ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
      />
    </div>
  );
}
