const { MatchService } = require('../services/MatchService.js');

class MatchSocket {
    constructor(io) {
        this.io = io;
    }

    initialize() {
        this.io.on('connection', (socket) => {
            console.log('User connected:', socket.id);

            // Join match room
            socket.on('join_match', (data) => {
                const { matchId, userId } = data;
                socket.join(`match_${matchId}`);
                console.log(`User ${userId} joined match ${matchId}`);
            });

            // Leave match room
            socket.on('leave_match', (data) => {
                const { matchId, userId } = data;
                socket.leave(`match_${matchId}`);
                console.log(`User ${userId} left match ${matchId}`);
            });

            // Match action
            socket.on('match_action', async (data) => {
                try {
                    const { matchId, action, userId } = data;
                    // اگر MatchService.handleAction وجود دارد، استفاده کن
                    if (MatchService.handleAction) {
                        const result = await MatchService.handleAction(matchId, action, userId);
                        // Broadcast to all in match room
                        this.io.to(`match_${matchId}`).emit('match_update', result);
                    } else {
                        socket.emit('error', { message: 'Match action not implemented' });
                    }
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
            });
        });
    }

    static initialize(io) {
        const matchSocket = new MatchSocket(io);
        matchSocket.initialize();
        return matchSocket;
    }
}

module.exports = { MatchSocket };