import "cerces/types";

declare module "cerces/types" {
    interface RuntimeArgs {
        env: Cloudflare.Env
        ctx: ExecutionContext
    }
}
