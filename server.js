import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 8080;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const app = express();
app.use(cors({ origin: ALLOWED_ORIGIN === '*' ? true : ALLOWED_ORIGIN }));
app.get('/health', (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGIN === '*' ? true : ALLOWED_ORIGIN, methods: ['GET', 'POST'] },
});

const EVENTS = {
  JOIN_EVENT: 'join_event',
  LEAVE_EVENT: 'leave_event',
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  MESSAGE_READ: 'message_read',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
};

io.on('connection', (socket) => {
  socket.on(EVENTS.JOIN_EVENT, ({ eventId, userId }) => {
    if (!eventId || !userId) return;
    socket.join(eventId);
    socket.to(eventId).emit(EVENTS.USER_JOINED, { userId });
  });

  socket.on(EVENTS.LEAVE_EVENT, ({ eventId, userId }) => {
    if (!eventId || !userId) return;
    socket.leave(eventId);
    socket.to(eventId).emit(EVENTS.USER_LEFT, { userId });
  });

  socket.on(EVENTS.SEND_MESSAGE, ({ eventId, message }) => {
    if (!eventId || !message) return;
    io.to(eventId).emit(EVENTS.RECEIVE_MESSAGE, { eventId, message });
  });

  socket.on(EVENTS.TYPING_START, ({ eventId, userId }) => {
    if (!eventId || !userId) return;
    socket.to(eventId).emit(EVENTS.TYPING_START, { userId });
  });

  socket.on(EVENTS.TYPING_STOP, ({ eventId, userId }) => {
    if (!eventId || !userId) return;
    socket.to(eventId).emit(EVENTS.TYPING_STOP, { userId });
  });

  socket.on(EVENTS.MESSAGE_READ, ({ eventId, messageId, userId }) => {
    if (!eventId || !messageId || !userId) return;
    socket.to(eventId).emit(EVENTS.MESSAGE_READ, { messageId, userId });
  });
});

server.listen(PORT, () => console.log(`Socket server listening on :${PORT}`));


