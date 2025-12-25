import { FiMenu } from "react-icons/fi";
import { useNavigate } from "react-router";
import BurgerMenu from "./BurgerMenu";

export default function Header({ title }) {
  const navigate = useNavigate();

  return (
    <div className="relative">
      <header className="header flex justify-center">
        <p className="line-clamp-2 max-w-[90%]">{title}</p>
        <BurgerMenu />
      </header>
    </div>
  );
}
