import { useEffect, useState } from "react";

function InfoBanner({ message, duration = 2500, error = false, trigger }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;

    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <div
      className={`
        fixed -top-1 inset-x-0 z-50 ml-auto mr-auto
        bg-surface-300 text-center opacity-85
        px-10 py-3 w-max rounded-md
        transform transition-transform duration-300 ease-out
        ${visible ? "translate-y-10 md:translate-y-4" : "-translate-y-full"}
        text-${error ? "error" : "white"}
      `}
    >
      {message}
    </div>
  );
}

export default InfoBanner;
