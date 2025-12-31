import express from "express";
import cors from "cors";
import router from "./routes.js";

const PORT = 8000;

const app = express();
app.use(cors());

app.use("/api", router);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
