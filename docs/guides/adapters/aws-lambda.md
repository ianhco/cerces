# AWS Lambda

The **AWS Lambda Adapter** enables Cerces applications to run as AWS Lambda functions behind API Gateway. It converts API Gateway events to standard Web API `Request` objects and Lambda responses back to API Gateway format. This adapter is **automatically configured** when you create a new Cerces project using the **`aws-lambda` template**.

## Configuration

The adapter is pre-configured in Lambda template projects. The main entry point typically looks like:

```ts
import { App } from "cerces"
import { createHandler } from "cerces/aws-lambda" // [!code focus]

const app = new App({})

export const handler = createHandler(app) // [!code focus]
```

## Local Development

By default, the `aws-lambda` template **does not** include a development server, as this runtime is very specific to AWS Lambda with many nuances and customized behavior. However, you can test your application locally using the official [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-invoke.html), it provides a local, Docker-based environment that closely matches the AWS Lambda production environment.

## Streaming Limitations

::: warning Streaming Responses Not Supported
This adapter only supports buffered Lambda invocations. Streaming responses are not supported.
:::

The adapter is designed for traditional HTTP request-response patterns via API Gateway, not for real-time streaming use cases. This is a **deliberate design choice** as AWS Lambda's architecture lacks compatibility with Web Standards.

While a lambda function can be configured to handle both request-response and streaming-response, **the invocation mode is determined by the caller, not the function (app) itself**. Consider deploying your streaming endpoints in a separate lambda function in plain JavaScript/TypeScript, then redirecting requests to that function.

## Deployment

Deploy your Lambda function using your preferred method (AWS CLI, SAM, CDK, etc.). Ensure your API Gateway is configured to proxy requests to the Lambda function.

For detailed deployment instructions, refer to the [AWS Lambda documentation](https://docs.aws.amazon.com/lambda/latest/dg/getting-started.html).
