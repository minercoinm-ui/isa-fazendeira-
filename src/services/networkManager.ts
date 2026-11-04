import { CommunityGoal, FarmAnimal, FarmPlot, RemotePlayer } from '../types/game';

type MessageHandler = (data: any) => void;
type AccessTokenProvider = () => Promise<string | null>;

type PlayerConnectionInfo = {
  nickname: string;
  avatar: string;
  color: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
  role?: 'visitor' | 'isa_owner';
};

class NetworkManager {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private isConnected = false;
  private playerId = '';
  private playerInfo: PlayerConnectionInfo | null = null;
  private accessTokenProvider: AccessTokenProvider | null = null;
  private reconnectTimeout: number | null = null;
  private heartbeatInterval: number | null = null;
  private shouldReconnect = true;

  public connect(playerId: string, playerInfo: PlayerConnectionInfo, accessTokenProvider: AccessTokenProvider) {
    this.playerId = playerId;
    this.playerInfo = playerInfo;
    this.accessTokenProvider = accessTokenProvider;
    this.shouldReconnect = true;
    this.openSocket();
  }

  private openSocket() {
    if (!this.playerId || !this.playerInfo || typeof window === 'undefined') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/farm`);
    this.ws = socket;

    socket.onopen = () => {
      void this.sendJoin(socket);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'welcome') {
          this.isConnected = true;
          this.startHeartbeat(socket);
          this.notifyHandlers({ type: 'connection_status', connected: true });
        } else if (data.type === 'auth_error') {
          this.shouldReconnect = false;
          this.notifyHandlers(data);
        }
        this.notifyHandlers(data);
      } catch (error) {
        console.error('Error parsing WS message:', error);
      }
    };

    socket.onclose = () => {
      this.stopHeartbeat();
      if (this.ws === socket) {
        this.ws = null;
        this.isConnected = false;
      }
      this.notifyHandlers({ type: 'connection_status', connected: false });
      if (this.shouldReconnect && !this.reconnectTimeout) {
        this.reconnectTimeout = window.setTimeout(() => {
          this.reconnectTimeout = null;
          this.openSocket();
        }, 4000);
      }
    };

    socket.onerror = () => {
      this.notifyHandlers({ type: 'connection_status', connected: false });
    };
  }

  private async sendJoin(socket: WebSocket) {
    const info = this.playerInfo;
    if (!info) return;

    try {
      const accessToken = await this.accessTokenProvider?.();
      if (socket.readyState !== WebSocket.OPEN) return;
      if (!accessToken) {
        this.shouldReconnect = false;
        this.notifyHandlers({ type: 'auth_error', reason: 'missing_session' });
        socket.close(4401, 'Authentication required');
        return;
      }

      socket.send(JSON.stringify({
        type: 'join',
        accessToken,
        role: info.role || 'visitor',
        nickname: info.nickname,
        avatar: info.avatar,
        color: info.color,
        x: info.x,
        y: info.y,
        z: info.z,
        rotation: info.rotation,
      }));
    } catch {
      this.shouldReconnect = false;
      this.notifyHandlers({ type: 'auth_error', reason: 'session_unavailable' });
      socket.close(4401, 'Authentication unavailable');
    }
  }

  private startHeartbeat(socket: WebSocket) {
    this.stopHeartbeat();
    this.heartbeatInterval = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval !== null) {
      window.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public sendMovement(x: number, y: number, z: number, rotation: number, isMoving: boolean, action?: string) {
    this.send({
      type: 'move',
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      z: Number(z.toFixed(2)),
      rotation: Number(rotation.toFixed(2)),
      isMoving,
      action,
    });
  }

  public sendChat(text: string, _nickname: string) {
    this.send({ type: 'chat', text, time: Date.now() });
  }

  public sendPlotAction(plot: FarmPlot, actionType: 'plant' | 'water' | 'harvest', playerName: string) {
    this.send({ type: 'farm_plot_updated', plot, actionType, playerName });
  }

  public sendAnimalAction(animal: FarmAnimal, actionType: 'feed' | 'produce', playerName: string) {
    this.send({ type: 'animal_updated', animal, actionType, playerName });
  }

  public sendCommunityGoalUpdate(goal: CommunityGoal) {
    this.send({ type: 'community_goal_updated', goal });
  }

  private send(payload: object) {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  public subscribe(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  private notifyHandlers(data: any) {
    for (const handler of this.messageHandlers) {
      try {
        handler(data);
      } catch (error) {
        console.error('Network handler error:', error);
      }
    }
  }

  public disconnect() {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    if (this.reconnectTimeout !== null) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    const socket = this.ws;
    this.ws = null;
    this.playerId = '';
    this.playerInfo = null;
    this.accessTokenProvider = null;
    this.isConnected = false;
    socket?.close();
  }
}

export const networkManager = new NetworkManager();
