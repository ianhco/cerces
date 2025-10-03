import { Server } from "bun";

declare module "cerces/types" {
    interface RuntimeArgs {
        ctx: Server
    }
}
