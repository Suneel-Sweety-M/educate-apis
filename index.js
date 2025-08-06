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

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config();

// Init app
const app = express();
const PORT = process.env.PORT || 5050;

// Connect to MongoDB
await dbConnection();



// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.APP_URL || '*',
  credentials: true,
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(express.json());

// API Routes
app.use(router); 

// Welcome route
app.get("/", (req, res) => {
  res.send("Welcome to the Educate API!");
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(" FULL ERROR:", err); // log entire error object
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});


// Start the server
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
