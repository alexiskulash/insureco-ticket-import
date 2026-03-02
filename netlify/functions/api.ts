import serverless from "serverless-http";
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { createServer } from "../../server";

const app = createServer();

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  console.log('=== Netlify Function Called ===');
  console.log('Method:', event.httpMethod);
  console.log('Path:', event.path);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));
  console.log('Body (raw):', event.body);
  console.log('Is Base64:', event.isBase64Encoded);

  const serverlessHandler = serverless(app, {
    binary: false,
    request: (req: any, event: HandlerEvent) => {
      // Manually parse and inject body for POST requests
      if (event.httpMethod === 'POST' && event.body) {
        try {
          const bodyString = event.isBase64Encoded
            ? Buffer.from(event.body, 'base64').toString('utf-8')
            : event.body;

          console.log('Body string before parse:', bodyString);

          // Parse JSON and inject directly into req.body
          const parsedBody = JSON.parse(bodyString);
          console.log('Parsed body to inject:', JSON.stringify(parsedBody, null, 2));

          // Directly set req.body to bypass Express body parser issues
          req.body = parsedBody;

        } catch (error) {
          console.error('Body parsing error:', error);
        }
      }
    }
  });

  const result = await serverlessHandler(event, context);
  console.log('Response status:', result.statusCode);

  return result;
};
