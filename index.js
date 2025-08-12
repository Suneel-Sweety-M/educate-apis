import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

// Internal imports
import dbConnection from "./middleware/db.js";
import router from "./routes/index.js";
import courseRoutes from "./routes/courseRoutes.js";

import paymentRoutes from "./routes/paymentRoutes.js";


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5050;
// Connect to MongoDB
await dbConnection();
// Middlewares
app.use(helmet());
app.use(cors({

  origin: process.env.APP_URL || '*',
  credentials: true,

  // origin: process.env.APP_URL,

}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(express.json());
// API Routes
app.use(router);



app.listen(PORT, () => {
  console.log(` Server running on ${PORT}`);
});
