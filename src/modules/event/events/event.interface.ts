import { ApiProperty } from '@nestjs/swagger'

export namespace AbstractEvent {
  export type Type = Record<string, any>
  export type Param = Record<string, any>
  export type Body = Record<string, any>

  export type Data<TParam extends Param = Param, TBody extends Body = Body> = {
    param?: TParam
    body: TBody
  }

  export type Payload<TData extends Data = Data> = {
    event: string
    data: TData
  }

  export type Message = Record<string, any>
  export type Response = Record<string, any>
  export type Context = Record<string, any>

  export namespace DTO {
    export class EventResponse {
      @ApiProperty({ example: 'result message' })
      message!: string
    }
  }
}

export interface AbstractEvent {
  Type: AbstractEvent.Type
  Param: AbstractEvent.Param
  Body: AbstractEvent.Body
  Data: AbstractEvent.Data
  Payload: AbstractEvent.Payload
  Message: AbstractEvent.Message
  Response: AbstractEvent.Response
  Context: AbstractEvent.Context
}
