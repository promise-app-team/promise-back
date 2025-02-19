import type { User } from '@prisma/client'

export type ConnectionID = string
export type ConnectionUID = User['id']
export type ConnectionEvent = string
export type ConnectionStage = string
export type ConnectionChannel = string
export type ConnectionTimestamp = number

export type ConnectionMap = Map<ConnectionID, Connection>
export type ConnectionChannelMap = Map<ConnectionChannel, ConnectionMap>
export type ConnectionPool = Map<ConnectionEvent, ConnectionChannelMap>

export interface Connection {
  cid: ConnectionID
  uid: ConnectionUID
  iat: ConnectionTimestamp
  exp: ConnectionTimestamp
}

export interface ConnectionScope {
  event: ConnectionEvent
  stage: ConnectionStage
  channel?: ConnectionChannel
}

export interface ConnectionCache {
  get<T = any>(key: string): Promise<T | null>
  set<T = any>(key: string, value: T): Promise<void>
  del(key: string): Promise<void>
}
