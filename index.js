import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import http from "http";
import cookieParser from 'cookie-parser';

//Security packges
import helmet from "helmet";

import dbConnection from "./middleware/db.js";
import router from "./routes/index.js";

import paymentRoutes from "./routes/paymentRoutes.js";


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5050;

dbConnection();

app.use(helmet());
app.use(cors({
  origin: process.env.APP_URL,
  credentials: true, 
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(router);

app.use("/api/payments", paymentRoutes);
// app.use("/api/courses/payments", paymentRoutes);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
