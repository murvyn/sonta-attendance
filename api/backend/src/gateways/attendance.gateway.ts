import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface JoinMeetingPayload {
  meetingId: string;
}

interface LeaveMeetingPayload {
  meetingId: string;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3001',
      'http://localhost:5173',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  },
  namespace: '/attendance',
})
export class AttendanceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger(AttendanceGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-meeting')
  handleJoinMeeting(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinMeetingPayload,
  ) {
    const { meetingId } = payload;
    client.join(`meeting-${meetingId}`);
    this.logger.log(`Client ${client.id} joined meeting-${meetingId}`);
    return { status: 'joined', meetingId };
  }

  @SubscribeMessage('leave-meeting')
  handleLeaveMeeting(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LeaveMeetingPayload,
  ) {
    const { meetingId } = payload;
    client.leave(`meeting-${meetingId}`);
    this.logger.log(`Client ${client.id} left meeting-${meetingId}`);
    return { status: 'left', meetingId };
  }

  // Emit attendance update to all clients in a meeting room
  emitAttendanceUpdate(meetingId: string, data: any) {
    this.server.to(`meeting-${meetingId}`).emit('attendance-update', data);
    this.logger.log(`Emitted attendance-update to meeting-${meetingId}`);
  }

  // Emit pending verification to all clients in a meeting room
  emitPendingVerification(meetingId: string, data: any) {
    this.server.to(`meeting-${meetingId}`).emit('pending-verification', data);
    this.logger.log(`Emitted pending-verification to meeting-${meetingId}`);
  }

  // Emit meeting status change to all clients in a meeting room
  emitMeetingStatusChanged(meetingId: string, status: string) {
    this.server
      .to(`meeting-${meetingId}`)
      .emit('meeting-status-changed', { meetingId, status });
    this.logger.log(
      `Emitted meeting-status-changed to meeting-${meetingId}: ${status}`,
    );
  }

  // Emit QR regenerated to all clients in a meeting room
  emitQrRegenerated(meetingId: string, qrCode: any) {
    this.server
      .to(`meeting-${meetingId}`)
      .emit('qr-regenerated', { meetingId, qrCode });
    this.logger.log(`Emitted qr-regenerated to meeting-${meetingId}`);
  }
}
