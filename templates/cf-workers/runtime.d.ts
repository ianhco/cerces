import "cerces/types";

declare module "cerces/types" {
    interface RuntimeArgs {
        env: Env
        ctx: ExecutionContext
    }
}
