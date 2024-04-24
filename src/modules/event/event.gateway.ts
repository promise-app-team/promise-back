import { IncomingMessage } from 'http';

import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { v4 as uuid } from 'uuid';
import { WebSocket } from 'ws';

import { JwtAuthTokenService } from '../auth';

import { Connection } from './connections';
import { EventHandler, EventManager, Events } from './events';
import { PingEvent } from './events/ping';
import { ShareLocationEvent } from './events/share-location';

import { HttpException } from '@/common/exceptions';
import { InthashService } from '@/customs/inthash';
import { LoggerService } from '@/customs/logger';
import { random } from '@/utils';

type Client = WebSocket & Pick<Connection, 'cid' | 'uid'>;

@WebSocketGateway()
export class EventGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly clients: Map<string, Client> = new Map();

  constructor(
    private readonly event: EventManager,
    private readonly jwt: JwtAuthTokenService,
    private readonly hasher: InthashService,
    private readonly logger: LoggerService
  ) {
    logger.setContext(EventGateway.name);
  }

  async handleConnection(@ConnectedSocket() client: Client, incoming: IncomingMessage) {
    try {
      const authToken = this.getAuthToken(incoming);
      const payload = authToken ? this.jwt.verifyToken(authToken) : null;
      if (!payload) throw new Error('Invalid auth token');

      Object.assign(client, { cid: uuid(), uid: payload.sub });
      this.clients.set(client.cid, client);

      const params = new URLSearchParams(incoming.url?.replace('/?', ''));
      const name = params.get('event') as keyof Events;
      const response = await this.event.get(name).connect(client);
      this.logger.debug(`Client connected: ${client.cid} (total: ${this.clients.size})`);
      return response;
    } catch (error: any) {
      throw HttpException.new(error, 'FORBIDDEN');
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Client) {
    this.clients.delete(client.cid);
    this.logger.debug(`Client disconnected: ${client.cid} (total: ${this.clients.size})`);
    await EventHandler.disconnect(client.cid);
    return { message: `Disconnected from ${client.cid}` };
  }

  @SubscribeMessage('ping')
  async handlePingEvent(client: Client, data: PingEvent.Data) {
    const handler = this.event.get('ping');

    handler.on('send', async (cid, data) => {
      await new Promise((resolve) => setTimeout(resolve, random(100, 1000)));
      this.clients.get(cid)?.send(JSON.stringify(data));
    });

    handler.on('error', async (cid, error) => {
      await new Promise((resolve) => setTimeout(resolve, random(100, 1000)));
      this.clients.get(cid)?.send(JSON.stringify(error));
    });

    const response = await handler.handle(client.cid, data);
    this.logger.debug(`Client sent message: ${client.cid} with ${JSON.stringify(data)}`);
    return response;
  }

  @SubscribeMessage('share-location')
  async handleShareLocationEvent(client: Client, data: ShareLocationEvent.Data) {
    const handler = this.event.get('share-location');

    handler.on('share', async (cid, data) => {
      await new Promise((resolve) => setTimeout(resolve, random(100, 1000)));
      this.clients.get(cid)?.send(JSON.stringify(data));
    });

    handler.on('error', async (cid, error) => {
      await new Promise((resolve) => setTimeout(resolve, random(100, 1000)));
      this.clients.get(cid)?.send(JSON.stringify(error));
    });

    data.param._promiseIds = data.param.promiseIds.map((id) => this.hasher.decode(id));
    const response = await handler.handle(client.cid, data);
    this.logger.debug(`Client sent message: ${client.cid} with ${JSON.stringify(data)}`);
    return response;
  }

  private getAuthToken(incoming: IncomingMessage): string | null {
    const [type, token] = incoming.headers.authorization?.split(' ') ?? [];
    return type?.toLowerCase() === 'bearer' ? token : null;
  }
}
