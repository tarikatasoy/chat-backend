// chat-backend/src/routes/conversations.js
import { Router } from "express";
import verifyToken from "../middleware/verifyToken.js";
import { 
    listMyConversations, 
    listMessages, 
    // sendMessage - Bu artık socket üzerinden yapılıyor
} from "../controllers/conversationController.js";

const router = Router();
router.use(verifyToken);

// router.post("/with/:otherUserId", ensureDm); // Bu işlevsellik arkadaşlık kabulünde otomatikleşti
router.get("/", listMyConversations);
router.get("/:id/messages", listMessages);
// router.post("/:id/messages", sendMessage); // Mesaj gönderme artık sadece socket ile

export default router;