import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";

const onlineUsers = new Map(); // userId -> socket.id

export default function initIO(server, db) {
  const io = new Server(server, {
    cors: { origin: true }
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];
      if (!token) return next(new Error("Authentication error: No token provided"));
      
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.userId;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const me = socket.userId;
    console.log(`✅ User connected: ${me} with socket id ${socket.id}`);
    onlineUsers.set(me, socket.id);
    
    socket.join(`user:${me}`);

    const convs = await db.DirectConversation.findAll({
      where: { [Op.or]: [{ userAId: me }, { userBId: me }] },
      attributes: ["id"]
    });
    
    if (convs.length > 0) {
      const roomNames = convs.map(({ id }) => `conv:${id}`);
      socket.join(roomNames);
      console.log(`[JOIN] User ${me} joined rooms:`, roomNames);
    }

    const friendships = await db.Friendship.findAll({
        where: { status: "ACCEPTED", [Op.or]: [{ userAId: me }, { userBId: me }] },
        attributes: ["userAId", "userBId"]
    });
    const friendIds = friendships.map(f => f.userAId === me ? f.userBId : f.userAId);
    
    friendIds.forEach(friendId => {
        const friendSocketId = onlineUsers.get(friendId);
        if(friendSocketId) {
            io.to(friendSocketId).emit("user:online", { id: me });
        }
    });

    const onlineFriendIds = friendIds.filter(id => onlineUsers.has(id));
    socket.emit("friends:online", onlineFriendIds);


    // ---- EVENTS ----
    socket.on("message:send", async ({ convId, body }, ack) => {
      try {
        const conv = await db.DirectConversation.findByPk(convId);
        if (!conv || ![conv.userAId, conv.userBId].includes(me)) {
          throw new Error("Forbidden or conversation not found");
        }

        const msg = await db.Message.create({
          body,
          conversationId: convId,
          userId: me
        });
        
        await conv.save(); 
        const payload = { ...msg.toJSON() };
        
        const roomName = `conv:${convId}`;
        
        socket.to(roomName).emit("message:new", payload);

        socket.emit("message:new", payload);

        ack?.({ ok: true, message: payload });
      } catch (e) {
        console.error("[MESSAGE SEND ERROR]", e);
        ack?.({ ok: false, error: e.message });
      }
    });

    socket.on("typing:start", ({ convId }) => {
      socket.to(`conv:${convId}`).emit("typing:start", { conversationId: convId });
    });

    socket.on("typing:stop", ({ convId }) => {
      socket.to(`conv:${convId}`).emit("typing:stop", { conversationId: convId });
    });

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${me}`);
      onlineUsers.delete(me);
      friendIds.forEach(friendId => {
          const friendSocketId = onlineUsers.get(friendId);
          if(friendSocketId) {
              io.to(friendSocketId).emit("user:offline", { id: me });
          }
      });
    });
  });

  return io;
}
