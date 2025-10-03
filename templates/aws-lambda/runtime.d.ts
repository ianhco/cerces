import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

declare module "cerces/types" {
    interface RuntimeArgs {
        evt: APIGatewayProxyEvent
        ctx: Context
    }
}
