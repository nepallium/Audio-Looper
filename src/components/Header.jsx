import { FiMenu } from "react-icons/fi";
import { useNavigate } from "react-router";
import BurgerMenu from "./BurgerMenu";

export default function Header({ title }) {
  const navigate = useNavigate();

  return (
    <div className="flex relative">
      <header className="header">
        <p>{title}</p>
      </header>
    </div>
  );
}
