import express from "express";
import cors from "cors";
import apiRouter from "./routes/apiRouter.js";

const PORT = 8001;

const app = express();
app.use(cors());

app.use("/api", apiRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
