import { App } from "cerces";

const app = new App({});

app.get("/", {
    parameters: {},
    handle: () => {
        return { message: "Hello World" };
    },
});

export default app;