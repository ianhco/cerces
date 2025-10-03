import { App } from "cerces";
import { createHandler } from "cerces/aws-lambda";

const app = new App({});

app.get("/", {
    parameters: {},
    handle: () => {
        return { message: "Hello World" };
    },
});

export const handler = createHandler(app);