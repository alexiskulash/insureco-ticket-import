import { RequestHandler } from "express";
import Papa from "papaparse";
import { fetch } from "undici";

// Embedded CSV data from demo-insureco-jira.csv
const DEMO_CSV_DATA = `Summary,Issue key,Issue id,Issue Type,Status,Project key,Project name,Project type,Project lead,Project lead id,Project description,Priority,Resolution,Assignee,Assignee Id,Reporter,Reporter Id,Creator,Creator Id,Created,Updated,Last Viewed,Resolved,Due date,Votes,Description,Environment,Watchers,Watchers,Watchers Id,Watchers Id,Original estimate,Remaining Estimate,Time Spent,Work Ratio,Σ Original Estimate,Σ Remaining Estimate,Σ Time Spent,Security Level,Inward issue link (Cloners),Outward issue link (Cloners),Attachment,Custom field (Affected services),Custom field (Approvals),Custom field (Asset type),Custom field (Atlassian project),Custom field (Atlassian project status),Custom field (Beta?),Custom field (Bug Root Cause),Custom field (Business Impact),Custom field (Category),Custom field (Category),Custom field (Change completion date),Custom field (Change reason),Custom field (Change risk),Custom field (Change start date),Custom field (Change type),Custom field (Comments),Custom field (Confidence),Custom field (Content type),Custom field (Created Date),Custom field (Customer ( if any)),Custom field (Customer Importance ),Custom field (Customer Numeric),Custom field (Customer Segment),Custom field (Customer Segment Numeric),Custom field (Delivery progress),Custom field (Delivery status),Custom field (Department),Custom field (Department),Custom field (Designer),Custom field (Designs ready),Custom field (Development),Custom field (Documents),Custom field (Effort),Custom field (Enterprise),Custom field (Epic Color),Custom field (Epic Name),Custom field (Epic Status),Custom field (Escalation),Custom field (Estimate Confidence),Custom field (Estimated Size),Custom field (Feature Access),Custom field (Feature Instructions),Custom field (Feature Name),Custom field (Focus Areas),Custom field (GitHub Link),Custom field (Goals),Custom field (Idea archived),Custom field (Idea archived on),Custom field (Idea short description),Custom field (Impact),Custom field (Impact),Custom field (Impact score),Custom field (In Review Start Date),Custom field (Insights),Custom field (Issue at Customer Side?),Custom field (Issue color),Custom field (Last Updated ),Custom field (Linked items),Custom field (Locked forms),Custom field (Open forms),Custom field (Primary Audience),Custom field (Priority (Do Not Edit)),Custom field (Project overview key),Custom field (Project overview status),Custom field (Project start),Custom field (Project target),Custom field (Publication date),Custom field (QA Assignee),Custom field (QA Required),Custom field (QA Story Point),Custom field (Rank),Custom field (Relationship Health),Custom field (Relationship Health Numeric),Custom field (Request Type),Custom field (Request language),Custom field (Request participants),Custom field (Responders),Custom field (Roadmap),Custom field (SDK Gen),Satisfaction rating,Custom field (Satisfaction date),Custom field (Sentiment),Custom field (Severity),Custom field (Source),Custom field (Spec ready),Sprint,Custom field (Start date),Custom field (Steps To Reproduce),Custom field (Story Points),Custom field (Story point estimate),Custom field (Submitted forms),Custom field (Target date),Custom field (Target end),Custom field (Target start),Custom field (Team),Custom field (Time to done),Custom field (Time to first response),Custom field (Time to resolution),Custom field (Total forms),Custom field (Triaged),Custom field (Type of Request),Custom field (Value),Custom field (Vulnerability),Custom field (Work category),Custom field ([CHART] Date of First Response),Custom field ([CHART] Time in Status),Comment,Comment,Parent,Parent key,Parent summary,Status Category,Status Category Changed
BUG Date picker is displaying time on all dates,DI-127,46025,Bug,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,25/Feb/26 10:17 PM,25/Feb/26 10:17 PM,26/Feb/26 2:09 AM,,,0,"project:demo-insurance-app. In the Sign-Up form on the Personal Information step when you select a date of birth, after selecting the date picker displays the date and the also 00:00:00. See the screenshot. Need to fix this in the date of birth field and also anywhere else the date picker is used in the app. We don't need time format anywhere, it should just show the date without time.",,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,25/Feb/26 10:17 PM;3441671e-74e5-40c5-984c-2c2f3cf58e48;image-20251204-235900.png;https://builder-io.atlassian.net/rest/api/3/attachment/content/35345,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@21c2fe6f,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02m2f:,,,,,,,,,,,,,,,Insureco: Master Sprint,,,,4.0,,,,,,,,,,,,,,,,,,,43403,DI-86,Support,To Do,25/Feb/26 10:17 PM
BUG Date picker is displaying time on all dates,DI-126,46024,Bug,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,25/Feb/26 10:17 PM,25/Feb/26 10:17 PM,,,,0,"project:demo-insurance-app. In the Sign-Up form on the Personal Information step when you select a date of birth, after selecting the date picker displays the date and the also 00:00:00. See the screenshot. Need to fix this in the date of birth field and also anywhere else the date picker is used in the app. We don't need time format anywhere, it should just show the date without time.",,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,25/Feb/26 10:17 PM;3441671e-74e5-40c5-984c-2c2f3cf58e48;image-20251204-235900.png;https://builder-io.atlassian.net/rest/api/3/attachment/content/35344,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@bc5f463,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02m4f:,,,,,,,,,,,,,,,,,,,4.0,,,,,,,,,,,,,,,,,,,,,,To Do,25/Feb/26 10:17 PM
BUG Arrow on Back button is wrong,DI-124,45977,Bug,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,25/Feb/26 3:51 PM,25/Feb/26 3:53 PM,26/Feb/26 2:05 AM,,,0,"project:demo-insurance-app. The arrow on the Back navigation is on the right side instead of the left side of the word Back. Move the arrow to the left side on all pages where it is used.",,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,25/Feb/26 3:51 PM;3441671e-74e5-40c5-984c-2c2f3cf58e48;image-20251211-182841.png;https://builder-io.atlassian.net/rest/api/3/attachment/content/35305,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@3bfef9c2,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02m27:,,,,,,,,,,,,,,,Insureco: Master Sprint,,,,4.0,,,,,,,,,,,,,,,,,,,43403,DI-86,Support,To Do,25/Feb/26 3:51 PM
BUG Side nav doesn't close when you make a selection,DI-123,45976,Bug,In Progress,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,Builder.io Bot,712020:dbd660ad-a6f9-46c6-ba6d-12d60b31a247,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,25/Feb/26 3:51 PM,25/Feb/26 4:40 PM,26/Feb/26 2:05 AM,,,0,"project:demo-insurance-app. When you make a selection in the hamburger menu on mobile it navigates you to the page but the menu stays open and you have to manually dismiss it. Make it close when you've made a navigation selection.",,Builder.io Bot,Nick Nestle,712020:dbd660ad-a6f9-46c6-ba6d-12d60b31a247,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@3298692a,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02m1z:,,,,,,,,,,,,,,,Insureco: Master Sprint,,,,4.0,,,,,,,,,,,,,,,2026-02-25 16:38:58.679,,"25/Feb/26 4:38 PM;712020:dbd660ad-a6f9-46c6-ba6d-12d60b31a247;The Builder.io bot is working on your request! Project: demo-insurance-app Branch: true-hill-nxntux0d",,43403,DI-86,Support,In Progress,25/Feb/26 4:38 PM
BUG Map Page navigation fixes,DI-111,44606,Story,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,19/Feb/26 6:46 PM,19/Feb/26 6:46 PM,,,,0,"Project: Demo Insureco. Two issues: on the vehicle and property detail pages the back arrow is on the right side of the word Back, it should be on the left side. When on the map page if you navigate to the property or car details page by clicking on the link in the map there should be a second back button on the detail page called Back to Map which takes you back to the map page.",,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,19/Feb/26 6:46 PM;3441671e-74e5-40c5-984c-2c2f3cf58e48;image-20260217-141639.png;https://builder-io.atlassian.net/rest/api/3/attachment/content/34323,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@f085fb9,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02lcf:,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,2026-02-19 18:46:12.936,,19/Feb/26 6:46 PM;712020:4a1a4262-2430-4f42-ab63-85ecdc8bcb8b;fix this bug,,,,,To Do,19/Feb/26 6:46 PM
Strategic Work,DI-89,43406,Epic,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,12/Feb/26 7:10 PM,12/Feb/26 7:10 PM,,,,0,"We need a new financial dashboard for our Business Insurance products that shows how premiums, claims, number of properties/cars insured has changed over time.",,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@4d68f2f5,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02kf3:,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,To Do,12/Feb/26 7:10 PM
Enhancements,DI-88,43405,Epic,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,12/Feb/26 7:10 PM,12/Feb/26 7:10 PM,,,,0,,,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@3e7f1441,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02kev:,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,To Do,12/Feb/26 7:10 PM
Design System,DI-87,43404,Epic,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,12/Feb/26 7:10 PM,12/Feb/26 7:10 PM,,,,0,,,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@229828fe,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02ken:,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,To Do,12/Feb/26 7:10 PM
Support,DI-86,43403,Epic,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,12/Feb/26 7:10 PM,12/Feb/26 7:10 PM,,,,0,Epic for bucketing support tasks in Demo project,,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@41cfa28f,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02kef:,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,To Do,12/Feb/26 7:10 PM
ENH: Map Page,DI-85,43402,Epic,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,12/Feb/26 7:10 PM,12/Feb/26 7:10 PM,,,,0,,,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@2960a004,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02ke7:,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,To Do,12/Feb/26 7:10 PM`;

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
  sprint?: string;
  storyPoints?: number;
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
    // Parse the embedded CSV data
    const parsed = Papa.parse(DEMO_CSV_DATA, { header: true });
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

        // Parse story points
        const storyPoints = row['Custom field (Story Points)'] || row['Custom field (Story point estimate)'];
        const parsedStoryPoints = storyPoints ? parseFloat(storyPoints) : undefined;

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
          sprint: row.Sprint,
          storyPoints: parsedStoryPoints,
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

        // Add story points if available (note: field ID may vary by Jira instance)
        // Common field IDs: customfield_10016, customfield_10026
        if (issue.storyPoints !== undefined) {
          // Try common story points field - users may need to adjust this
          payload.fields.customfield_10016 = issue.storyPoints;
        }

        // Add sprint if available (note: field ID may vary by Jira instance)
        // Sprint field typically requires the sprint ID, not name
        // For now, we'll skip sprint as it requires sprint ID lookup
        // Users can manually add issues to sprints after import

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
