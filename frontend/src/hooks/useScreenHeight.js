import { useState, useEffect } from "react";

function useScreenHeight() {
  const [screenHeight, setScreenHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => setScreenHeight(window.innerHeight);

    // Listen for viewport changes
    window.addEventListener("resize", handleResize);

    // Clean up listener on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screenHeight;
}

export default useScreenHeight;
