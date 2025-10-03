/**
 * A Response subclass that serializes the response body using `JSON.stringify`
 * and sets the `Content-Type` header to `application/json`
 */
export class JSONResponse extends Response {
    constructor(body: any, init?: ResponseInit) {
        super(JSON.stringify(body), init)
        this.headers.set("Content-Type", "application/json")
    }
}

/**
 * A Response subclass that casts the response body using `String` and
 * sets the `Content-Type` header to `text/html`
 */
export class HTMLResponse extends Response {
    constructor(body: any, init?: ResponseInit) {
        super(String(body), init)
        this.headers.set("Content-Type", "text/html;charset=utf-8")
    }
}

/**
 * A Response subclass that casts the response body using `String` and
 * sets the `Content-Type` header to `text/plain`
 */
export class PlainTextResponse extends Response {
    constructor(body: any, init?: ResponseInit) {
        super(String(body), init)
        this.headers.set("Content-Type", "text/plain;charset=utf-8")
    }
}
