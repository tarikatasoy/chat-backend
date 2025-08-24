// chat-backend/src/server.js
import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import http from "http";
import db from "../models/index.js";
import initIO from "./socket/index.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// 5) DB + Socket
await db.sequelize.authenticate();
await db.sequelize.sync({ alter: true });
const io = initIO(server, db); // io tarafında da cors ayarla!


// 1) CORS EN ÜSTE ve tek config ile
const corsOptions = {
  origin: true, // gelen Origin neyse aynen geri yaz (dev için en kolayı)
  credentials: false,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
};
app.use(cors(corsOptions));

// 2) Diğer middlewares
app.use(express.json());

// io'yu request'e ekle
app.use((req, res, next) => {
  req.io = io;
  next();
});


// 3) Routes
import authRoutes from "./routes/auth.js";
import friendRoutes from "./routes/friends.js";
// import dmRoutes from "./routes/dm.js"; // DEĞİŞTİ
import conversationRoutes from "./routes/conversations.js";


app.use("/api/auth", authRoutes);
app.use("/api/friends", friendRoutes);
// app.use("/api/dm", dmRoutes); // DEĞİŞTİ
app.use("/api/conversations", conversationRoutes);


// 4) Global error handler (header'lar yine yazılsın diye)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});


server.listen(process.env.PORT || 4000, () =>
  console.log("🚀 HTTP+WS ready")
);