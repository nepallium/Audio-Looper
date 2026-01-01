import "./index.css";
import "./colors.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import routes from "./routes";

const router = createBrowserRouter(routes);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <div className="bg-surface-100">
      <div className="md:max-w-[768px] md:mx-auto">
        <RouterProvider router={router} />
      </div>
    </div>
    {/* <RouterProvider router={router} /> */}
  </StrictMode>
);
