import { RequestHandler } from "express";
import Papa from "papaparse";
import fs from "fs";
import path from "path";

interface JiraConfig {
  domain: string;
  email: string;
  apiToken: string;
  targetProject: string;
}

interface JiraIssue {
  summary: string;
  issueKey: string;
  issueType: string;
  status: string;
  description: string;
  priority: string;
  parentKey?: string;
  attachmentUrl?: string;
  attachmentFilename?: string;
}

export const handleImportJira: RequestHandler = async (req, res) => {
  const config = req.body as JiraConfig;

  // Set headers for SSE (Server-Sent Events)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendProgress = (current: number, total: number, currentIssue: string) => {
    res.write(`data: ${JSON.stringify({ type: 'progress', current, total, currentIssue })}\n\n`);
  };

  const sendResult = (result: any) => {
    res.write(`data: ${JSON.stringify({ type: 'result', result })}\n\n`);
  };

  const sendError = (message: string) => {
    res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
  };

  try {
    // Read the CSV file from the demo-insureco-jira.csv
    const csvPath = path.join(process.cwd(), 'demo-insureco-jira.csv');
    
    if (!fs.existsSync(csvPath)) {
      sendError('CSV file not found. Please ensure demo-insureco-jira.csv is in the project root.');
      res.end();
      return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const parsed = Papa.parse(csvContent, { header: true });
    const rows = parsed.data as any[];

    // Parse issues from CSV
    const issues: JiraIssue[] = rows
      .filter(row => row.Summary && row['Issue Type'])
      .map(row => {
        // Parse attachment info
        let attachmentUrl = '';
        let attachmentFilename = '';
        if (row.Attachment) {
          const attachmentParts = row.Attachment.split(';');
          if (attachmentParts.length >= 3) {
            attachmentFilename = attachmentParts[2];
            attachmentUrl = attachmentParts[3];
          }
        }

        return {
          summary: row.Summary,
          issueKey: row['Issue key'],
          issueType: row['Issue Type'],
          status: row.Status,
          description: row.Description || '',
          priority: row.Priority || 'Medium',
          parentKey: row['Parent key'],
          attachmentUrl,
          attachmentFilename,
        };
      });

    // Sort issues: Epics first, then regular issues, then subtasks
    const epics = issues.filter(i => i.issueType === 'Epic');
    const regular = issues.filter(i => i.issueType !== 'Epic' && !i.parentKey);
    const subtasks = issues.filter(i => i.parentKey);
    const sortedIssues = [...epics, ...regular, ...subtasks];

    const total = sortedIssues.length;
    let created = 0;
    let failed = 0;
    const errors: string[] = [];
    const issueKeyMap: Record<string, string> = {}; // Old key -> New key

    // Create Basic Auth header
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Import each issue
    for (let i = 0; i < sortedIssues.length; i++) {
      const issue = sortedIssues[i];
      sendProgress(i, total, issue.summary);

      try {
        // Create issue payload
        const payload: any = {
          fields: {
            project: {
              key: config.targetProject,
            },
            summary: issue.summary,
            description: issue.description,
            issuetype: {
              name: issue.issueType,
            },
          },
        };

        // Add priority if available
        if (issue.priority) {
          payload.fields.priority = { name: issue.priority };
        }

        // Add parent reference if this is a subtask
        if (issue.parentKey && issueKeyMap[issue.parentKey]) {
          payload.fields.parent = { key: issueKeyMap[issue.parentKey] };
        }

        // Create the issue
        const createResponse = await fetch(
          `https://${config.domain}/rest/api/3/issue`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          }
        );

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          errors.push(`Failed to create ${issue.summary}: ${errorText}`);
          failed++;
          continue;
        }

        const createdIssue = await createResponse.json();
        const newKey = createdIssue.key;
        issueKeyMap[issue.issueKey] = newKey;
        created++;

        // Upload attachment if present
        if (issue.attachmentUrl && issue.attachmentFilename) {
          try {
            // Download the attachment
            const attachmentResponse = await fetch(issue.attachmentUrl);
            if (attachmentResponse.ok) {
              const attachmentBuffer = await attachmentResponse.arrayBuffer();

              // Create form data for upload (using dynamic import for form-data)
              const FormDataModule = await import('form-data');
              const FormData = FormDataModule.default;
              const form = new FormData();
              form.append('file', Buffer.from(attachmentBuffer), issue.attachmentFilename);

              // Upload to Jira
              const uploadResponse = await fetch(
                `https://${config.domain}/rest/api/3/issue/${newKey}/attachments`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Basic ${auth}`,
                    'X-Atlassian-Token': 'no-check',
                    ...form.getHeaders(),
                  },
                  body: form as any,
                }
              );

              if (!uploadResponse.ok) {
                errors.push(`Attachment upload failed for ${issue.summary}: ${uploadResponse.statusText}`);
              }
            }
          } catch (attachError) {
            // Attachment upload failed, but issue was created
            const errorMsg = attachError instanceof Error ? attachError.message : 'Unknown error';
            errors.push(`Attachment upload failed for ${issue.summary}: ${errorMsg}`);
          }
        }
      } catch (error) {
        errors.push(`Error creating ${issue.summary}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
    }

    sendProgress(total, total, 'Complete');
    sendResult({
      success: failed === 0,
      created,
      failed,
      errors,
    });
  } catch (error) {
    sendError(error instanceof Error ? error.message : 'Unknown error occurred');
  }

  res.end();
};
