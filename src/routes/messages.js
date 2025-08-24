import { Router } from "express";
import verifyToken from "../middleware/verifyToken.js";
import { createMessage, listMessages } from "../controllers/messageController.js";

const router = Router();
router.get("/", listMessages);
router.post("/", verifyToken, createMessage);

export default router;
