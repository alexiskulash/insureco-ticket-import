import serverless from "serverless-http";
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { createServer } from "../../server";

const app = createServer();
const serverlessHandler = serverless(app);

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Manually ensure body is parsed for POST requests
  if (event.httpMethod === 'POST' && event.body) {
    try {
      // If body is base64 encoded, decode it first
      const bodyString = event.isBase64Encoded 
        ? Buffer.from(event.body, 'base64').toString('utf-8')
        : event.body;
      
      // Parse JSON if content-type is application/json
      if (event.headers['content-type']?.includes('application/json')) {
        const parsedBody = JSON.parse(bodyString);
        console.log('Netlify Function - Parsed body:', parsedBody);
        
        // Create a new event with parsed body
        event.body = bodyString; // Keep as string for serverless-http
      }
    } catch (error) {
      console.error('Error parsing body:', error);
    }
  }
  
  return serverlessHandler(event, context);
};
