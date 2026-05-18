import BurgerMenu from "./BurgerMenu";

export default function Header({ title }) {
  return (
    <div className="relative">
      <header className="header flex justify-center">
        <p className="line-clamp-2 max-w-[90%]">{title}</p>
        <BurgerMenu />
      </header>
    </div>
  );
}
