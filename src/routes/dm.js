import { Router } from "express";
import verifyToken from "../middleware/verifyToken.js";
// sendMessage import'u ve ilgili route kaldırıldı.
import { ensureDm, listMyDms, listMessages } from "../controllers/dmController.js";

const router = Router();
router.use(verifyToken);

router.post("/with/:otherUserId", ensureDm);
router.get("/", listMyDms);
router.get("/:id/messages", listMessages);
// router.post("/:id/messages", sendMessage); <-- Bu satır kaldırıldı.

export default router;