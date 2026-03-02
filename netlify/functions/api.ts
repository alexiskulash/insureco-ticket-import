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
  
  // Manually parse and inject body for POST requests
  if (event.httpMethod === 'POST' && event.body) {
    try {
      const bodyString = event.isBase64Encoded 
        ? Buffer.from(event.body, 'base64').toString('utf-8')
        : event.body;
      
      console.log('Body string:', bodyString);
      
      // Parse JSON
      const parsedBody = JSON.parse(bodyString);
      console.log('Parsed body:', JSON.stringify(parsedBody, null, 2));
      
      // Inject parsed body into the event for Express to use
      // serverless-http should pick this up
      (event as any).body = bodyString;
      
    } catch (error) {
      console.error('Body parsing error:', error);
    }
  }
  
  const serverlessHandler = serverless(app, {
    binary: false,
  });
  
  const result = await serverlessHandler(event, context);
  console.log('Response status:', result.statusCode);
  
  return result;
};
