import { Router } from "express";
import verifyToken from "../middleware/verifyToken.js";
import {
  searchUsers,
  sendRequest,
  incomingRequests,
  outgoingRequests,
  acceptRequest,
  declineRequest,
  myFriends,
  unfriend
} from "../controllers/friendController.js";

const router = Router();
router.use(verifyToken);

router.get("/search", searchUsers);

router.post("/request", sendRequest);
router.get("/requests/incoming", incomingRequests);
router.get("/requests/outgoing", outgoingRequests);
router.post("/request/:id/accept", acceptRequest);
router.post("/request/:id/decline", declineRequest);

router.get("/", myFriends);
router.delete("/:friendUserId", unfriend);

export default router;
