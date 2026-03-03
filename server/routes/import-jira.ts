import { RequestHandler } from "express";
import Papa from "papaparse";
import axios from "axios";
import FormData from "form-data";

// Embedded CSV data from jira-insureco-export.csv (27 tickets total)
const DEMO_CSV_DATA = String.raw`Summary,Issue key,Issue id,Issue Type,Status,Project key,Project name,Project type,Project lead,Project lead id,Project description,Priority,Resolution,Assignee,Assignee Id,Reporter,Reporter Id,Creator,Creator Id,Created,Updated,Last Viewed,Resolved,Due date,Votes,Description,Environment,Watchers,Watchers,Watchers Id,Watchers Id,Original estimate,Remaining Estimate,Time Spent,Work Ratio,Σ Original Estimate,Σ Remaining Estimate,Σ Time Spent,Security Level,Inward issue link (Cloners),Outward issue link (Cloners),Attachment,Custom field (Affected services),Custom field (Approvals),Custom field (Asset type),Custom field (Atlassian project),Custom field (Atlassian project status),Custom field (Beta?),Custom field (Bug Root Cause),Custom field (Business Impact),Custom field (Category),Custom field (Category),Custom field (Change completion date),Custom field (Change reason),Custom field (Change risk),Custom field (Change start date),Custom field (Change type),Custom field (Comments),Custom field (Confidence),Custom field (Content type),Custom field (Created Date),Custom field (Customer ( if any)),Custom field (Customer Importance ),Custom field (Customer Numeric),Custom field (Customer Segment),Custom field (Customer Segment Numeric),Custom field (Delivery progress),Custom field (Delivery status),Custom field (Department),Custom field (Department),Custom field (Designer),Custom field (Designs ready),Custom field (Development),Custom field (Documents provided),Custom field (Due Date),Custom field (End date),Custom field (Entity type),Custom field (Epic Color),Custom field (Epic Link),Custom field (Epic Name),Custom field (Epic Status),Custom field (Feature/s),Custom field (Flagged),Custom field (Go-Live Date),Custom field (Impact),Custom field (Issue color),Custom field (Issue source),Custom field (Locked),Custom field (Migrated Id),Custom field (Migrated Key),Custom field (On Hold End Date),Custom field (On Hold Start Date),Custom field (Ongoing Cost to company),Custom field (Organizations),Custom field (Owner),Custom field (Pair/Mob Programming),Custom field (Parent Link),Custom field (Partner),Custom field (Pending Reason),Custom field (People involved in Incident),Custom field (Product Categorization),Custom field (Project status),Custom field (Rank),Custom field (Release Readiness Score),Custom field (Requested participant),Custom field (Responders),Custom field (Satisfaction),Custom field (Satisfaction date),Custom field (Severity),Custom field (Source),Custom field (Source Jira Instance),Custom field (Sprint),Custom field (Start date),Custom field (Start date),Custom field (Story Points),Custom field (Story point estimate),Custom field (Target end),Custom field (Target start),Custom field (Team),Custom field (Team Priority),Custom field (Tempo Account),Custom field (Test suites associated),Custom field (Time to first response),Custom field (Time to resolution),Custom field (URL Field),Custom field (Upfront Cost to company),Custom field (Urgency),Custom field (Velocity),Custom field (Work category),Custom field ([CHART] Date of First Response),Comment,Comment,Comment,Comment,Parent,Parent key,Parent summary,Parent status,Log Work
BUG Date picker is displaying time on all dates,DI-127,46025,Bug,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,25/Feb/26 10:17 PM,25/Feb/26 10:17 PM,02/Mar/26 12:39 AM,,,0,"project:demo-insurance-app

In the Sign-Up form on the Personal Information step when you select a date of birth, after selecting the date picker displays the date and the also 00:00:00. See the screenshot. 

Need to fix this in the date of birth field and also anywhere else the date picker is used in the app. 

We don't need time format anywhere, it should just show the date without time.



!image-20251204-235900.png|width=541,alt=""image-20251204-235900.png""!",,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,25/Feb/26 10:17 PM;3441671e-74e5-40c5-984c-2c2f3cf58e48;image-20251204-235900.png;https://builder-io.atlassian.net/rest/api/3/attachment/content/35345,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@170e16ef,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02m2f:,,,,,,,,,,,,,,,Insureco: Master Sprint,,,,4.0,,,,,,,,,,,,,,,,,,,43403,DI-86,Support,To Do,25/Feb/26 10:17 PM
BUG Date picker is displaying time on all dates,DI-126,46024,Bug,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,25/Feb/26 10:17 PM,25/Feb/26 10:17 PM,,,,0,"project:demo-insurance-app

In the Sign-Up form on the Personal Information step when you select a date of birth, after selecting the date picker displays the date and the also 00:00:00. See the screenshot. 

Need to fix this in the date of birth field and also anywhere else the date picker is used in the app. 

We don't need time format anywhere, it should just show the date without time.



!image-20251204-235900.png|width=541,alt=""image-20251204-235900.png""!",,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,25/Feb/26 10:17 PM;3441671e-74e5-40c5-984c-2c2f3cf58e48;image-20251204-235900.png;https://builder-io.atlassian.net/rest/api/3/attachment/content/35344,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@387201a5,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02m4f:,,,,,,,,,,,,,,,,,,,4.0,,,,,,,,,,,,,,,,,,,,,,To Do,25/Feb/26 10:17 PM
BUG Arrow on Back button is wrong,DI-124,45977,Bug,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,25/Feb/26 3:51 PM,25/Feb/26 3:53 PM,26/Feb/26 2:05 AM,,,0,"project:demo-insurance-app



The arrow on the Back navigation is on the right side instead of the left side of the word ""Back"".  Move the arrow to the left side on all pages where it is used.  

!image-20251211-182841.png|width=336,alt=""image-20251211-182841.png""!",,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,25/Feb/26 3:51 PM;3441671e-74e5-40c5-984c-2c2f3cf58e48;image-20251211-182841.png;https://builder-io.atlassian.net/rest/api/3/attachment/content/35305,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@66f330c9,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02m27:,,,,,,,,,,,,,,,Insureco: Master Sprint,,,,4.0,,,,,,,,,,,,,,,,,,,43403,DI-86,Support,To Do,25/Feb/26 3:51 PM
BUG Side nav doesn't close when you make a selection,DI-123,45976,Bug,In Progress,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,Builder.io Bot,712020:dbd660ad-a6f9-46c6-ba6d-12d60b31a247,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,25/Feb/26 3:51 PM,25/Feb/26 4:40 PM,26/Feb/26 2:05 AM,,,0,"project:demo-insurance-app

When you make a selection in the hamburger menu on mobile it navigates you to the page but the menu stays open and you have to manually dismiss it. Make it close when you've made a navigation selection.",,Builder.io Bot,Nick Nestle,712020:dbd660ad-a6f9-46c6-ba6d-12d60b31a247,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@685c0085,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02m1z:,,,,,,,,,,,,,,,Insureco: Master Sprint,,,,4.0,,,,,,,,,,,,,,,2026-02-25 16:38:58.679,,"25/Feb/26 4:38 PM;712020:dbd660ad-a6f9-46c6-ba6d-12d60b31a247;Bot is working on your request","25/Feb/26 4:40 PM;712020:dbd660ad-a6f9-46c6-ba6d-12d60b31a247;The fix is complete",43403,DI-86,Support,In Progress,25/Feb/26 4:38 PM
BUG Map Page navigation fixes,DI-111,44606,Story,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,19/Feb/26 6:46 PM,19/Feb/26 6:46 PM,,,,0,"Project: Demo Insureco

Two issues:

* on the vehicle and property detail pages the back arrow is on the right side of the word

Back, it should be on the left side. (see screenshot)

* When on the map page if you navigate to the property or car details page by clicking on the link in the map there should be a second back button on the detail page called ""Back to Map"" which takes you back to the map page. This way the user can easily navigate back to the map page from which they came.

!image-20260217-141639.png|width=330,alt=""image-20260217-141639.png""!",,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,19/Feb/26 6:46 PM;3441671e-74e5-40c5-984c-2c2f3cf58e48;image-20260217-141639.png;https://builder-io.atlassian.net/rest/api/3/attachment/content/34323,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@53a2a98a,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02lcf:,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,2026-02-19 18:46:12.936,,19/Feb/26 6:46 PM;712020:4a1a4262-2430-4f42-ab63-85ecdc8bcb8b;Fix this bug,,,,,To Do,19/Feb/26 6:46 PM
Strategic Work,DI-89,43406,Epic,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,12/Feb/26 7:10 PM,12/Feb/26 7:10 PM,,,,0,"We need a new financial dashboard for our Business Insurance products that shows how premiums, claims, number of properties/cars insured has changed over time.",,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@43c60a55,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02kf3:,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,To Do,12/Feb/26 7:10 PM
Enhancements,DI-88,43405,Epic,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,12/Feb/26 7:10 PM,12/Feb/26 7:10 PM,,,,0,,,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@4cebd631,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02kev:,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,To Do,12/Feb/26 7:10 PM
Design System,DI-87,43404,Epic,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,12/Feb/26 7:10 PM,12/Feb/26 7:10 PM,,,,0,,,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@522ee7bc,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02ken:,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,To Do,12/Feb/26 7:10 PM
Support,DI-86,43403,Epic,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,12/Feb/26 7:10 PM,12/Feb/26 7:10 PM,,,,0,Epic for bucketing support tasks in Demo project,,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@7d1b7f21,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02kef:,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,To Do,12/Feb/26 7:10 PM
ENH: Map Page,DI-85,43402,Epic,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,12/Feb/26 7:10 PM,12/Feb/26 7:10 PM,,,,0,,,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@4389eb4f,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02ke7:,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,To Do,12/Feb/26 7:10 PM
STORYBOOK update for new Progress Indicator,DI-78,43191,Task,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,12/Feb/26 12:43 AM,19/Feb/26 7:03 PM,26/Feb/26 2:21 AM,,,0,,,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@34493f9a,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02e0z:,,,,,,,,,,,,,,,,,,,20.0,,,,,,,,,,,,,,,,,,,33736,DI-11,Enhancements,To Do,12/Feb/26 12:43 AM
CODE New Progress Indicator,DI-72,39917,Task,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,29/Jan/26 4:42 AM,19/Feb/26 7:02 PM,26/Feb/26 2:20 AM,,,0,"The Progress Bar at the top of the SignUp form looks terrible on mobile and tablet. It has a horizontal scrollbar.  We need a new progress bar that looks good on mobile and tablet.  

Design three progress bars and add a preview page to evaluate them. They should be:

1. Update to the current progress bar to make it vertical
2. A new type of progress bar but ** use only Carbon components to build it **
3. A new typ of progress bar that doesn't use Carbon. Whatever seems best.

",,Builder.io Bot,Nick Nestle,712020:dbd660ad-a6f9-46c6-ba6d-12d60b31a247,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,DI-2,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@6d48bfd0,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02e0y:,,,,,,,,,,,,,,,,,,,40.0,,,,,,,,,,,,,,,2026-02-13 21:23:43.43,,"13/Feb/26 9:23 PM;712020:dbd660ad-a6f9-46c6-ba6d-12d60b31a247;Could not determine Builder.io project",,33736,DI-11,Enhancements,To Do,16/Feb/26 11:48 PM
CODE Add fields to Car Details in sign up form,DI-71,39916,Task,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,29/Jan/26 4:40 AM,12/Feb/26 6:46 PM,26/Feb/26 1:51 AM,,,0,"project:demo-insurance-app

We need to add a Mileage field and a Miles driven per year field to the Car Details step of the sign up form.

Add hint text to them that says ""only estimates are needed right now""",,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@885c25f,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02j2b:,,,,,,,,,,,,,,,Insureco: Master Sprint,,,,4.0,,,,,,,,,,,,,,,,,,,33736,DI-11,Enhancements,To Do,29/Jan/26 4:40 AM
ANALYZE define validations for Sign Up form,DI-67,39845,Task,In Progress,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,Builder.io Bot,712020:dbd660ad-a6f9-46c6-ba6d-12d60b31a247,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,29/Jan/26 2:17 AM,25/Feb/26 4:43 PM,26/Feb/26 2:48 AM,,,0,None of the fields in the signup form have validation on them.  Define field level validations so we can get sign off from stakeholders.,,Builder.io Bot,Nick Nestle,712020:dbd660ad-a6f9-46c6-ba6d-12d60b31a247,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,DI-22,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@518e0642,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02e1e:,,,,,,,,,,,,,,,,,,,10.0,,,,,,,,,,,,,,,2026-02-25 16:43:53.143,,"25/Feb/26 4:43 PM;712020:dbd660ad-a6f9-46c6-ba6d-12d60b31a247;Could not determine Builder.io project",,33736,DI-11,Enhancements,In Progress,25/Feb/26 4:43 PM
REVIEW New map filters,DI-45,34882,Task,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,16/Dec/25 8:05 PM,29/Jan/26 5:09 PM,26/Feb/26 2:48 AM,,,0,,,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,DI-44,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@35a5dc1c,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02e2b:1t,,,,,,,,,,,,,,,,,,,12.0,,,,,,,,,,,,,,,,,,,33736,DI-11,Enhancements,To Do,16/Dec/25 8:05 PM
CODE New map filters from Figma,DI-44,34881,Task,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,16/Dec/25 7:46 PM,12/Feb/26 6:46 PM,26/Feb/26 1:40 AM,,,0,,,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,DI-45,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@40349f70,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02f0g:,,,,,,,,,,,,,,,Insureco: Master Sprint,,,,20.0,,,,,,,,,,,,,,,,,,,33736,DI-11,Enhancements,To Do,16/Dec/25 7:47 PM
ENH: Map Page,DI-25,34417,Epic,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,11/Dec/25 6:26 PM,11/Dec/25 6:26 PM,,,,0,,,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@1d83b55,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,dark_orange,,,,,,,,,,,,,,,0|i02ev3:,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,To Do,11/Dec/25 6:26 PM
Support,DI-24,34416,Epic,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,11/Dec/25 6:25 PM,11/Dec/25 6:25 PM,,,,0,Epic for bucketing support tasks in Demo project,,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@20458509,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,dark_blue,,,,,,,,,,,,,,,0|i02euv:,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,To Do,11/Dec/25 6:25 PM
CODE validations for Sign Up Form,DI-22,34412,Task,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,11/Dec/25 6:14 PM,12/Feb/26 6:29 PM,26/Feb/26 2:48 AM,,,0,None of the fields in the signup form have validation on them.  Update the fields to have validation where appropriate.,,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,DI-67,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@66700220,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02e1l:,,,,,,,,,,,,,,,,,,,4.0,,,,,,,,,,,,,,,,,,,33736,DI-11,Enhancements,To Do,11/Dec/25 6:14 PM
Design System,DI-12,33737,Epic,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,05/Dec/25 12:29 AM,05/Dec/25 12:29 AM,,,,0,,,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@4bc334a2,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,dark_teal,,,,,,,,,,,,,,,0|i02e33:,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,To Do,05/Dec/25 12:29 AM
Enhancements,DI-11,33736,Epic,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,05/Dec/25 12:29 AM,11/Dec/25 6:31 PM,,,,0,,,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@40c29172,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,dark_yellow,,,,,,,,,,,,,,,0|i02e2v:,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,To Do,05/Dec/25 12:29 AM
DESIGN Incoporate  Financial Dashboard feedback on prototypes,DI-10,33735,Task,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,05/Dec/25 12:23 AM,12/Feb/26 6:34 PM,26/Feb/26 2:47 AM,,,0,,,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@6c5613ff,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02e18:,,,,,,,,,,,,,,,,,,,4.0,,,,,,,,,,,,,,,,,,,33730,DI-5,Strategic Work,To Do,05/Dec/25 12:23 AM
CODE Build Financial Dashboard prototypes in code,DI-9,33734,Task,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,05/Dec/25 12:22 AM,19/Feb/26 7:02 PM,26/Feb/26 2:47 AM,,,0,,,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@6bdeb0b8,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02e11:,,,,,,,,,,,,,,,,,,,80.0,,,,,,,,,,,,,,,,,,,33730,DI-5,Strategic Work,To Do,05/Dec/25 12:22 AM
REVIEW Financial Dashboard prototypes with business team,DI-7,33732,Task,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,05/Dec/25 12:22 AM,12/Feb/26 6:46 PM,26/Feb/26 1:47 AM,,,0,,,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@33339533,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02f0f:i,,,,,,,,,,,,,,,Insureco: Master Sprint,,,,40.0,,,,,,,,,,,,,,,,,,,33730,DI-5,Strategic Work,To Do,05/Dec/25 12:22 AM
IDEATION New Financial Dashboard prototypes,DI-6,33731,Task,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,05/Dec/25 12:21 AM,12/Feb/26 6:46 PM,26/Feb/26 1:34 AM,,,0,"Build a prototypes of the financial dashboard. See attached PRD. 

Initial prototypes don't need to connect to the backend but should still use existing Carbon Design System.

Make three examples:

1. Conservative example using exclusively Carbon components and fairly straightforward.
2. Sleeker: still use Carbon design system mostly but you can suggest some new components / patterns if needed.  Always follow our branding.
3. Wild: Be creative.  Keep to our branding but everything else can whatever you want.  Come up with something out of the box.

Ask any followup questions you may need before getting started.",,Nick Nestle,,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@54ed482f,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02e0v:,,,,,,,,,,,,,,,Insureco: Master Sprint,,,,40.0,,,,,,,,,,,,,,,,,,,33730,DI-5,Strategic Work,To Do,05/Dec/25 12:21 AM
Strategic Work,DI-5,33730,Epic,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,05/Dec/25 12:15 AM,16/Dec/25 6:15 PM,,,,0,"We need a new financial dashboard for our Business Insurance products that shows how premiums, claims, number of properties/cars insured has changed over time.",,,,,,,,,,,,,,,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@6ac64e7b,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,teal,,,,,,,,,,,,,,,0|i02e0j:,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,To Do,05/Dec/25 12:15 AM
DESIGN New Progress Indicator,DI-2,33727,Task,To Do,DI,Demo: InsureCo,software,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,,Medium,,,,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,Nick Nestle,712020:11f06c30-0697-401a-b9ef-2320eb2db3a9,05/Dec/25 12:03 AM,12/Feb/26 6:46 PM,26/Feb/26 1:43 AM,,,0,"The Progress Bar at the top of the SignUp form looks terrible on mobile and tablet. It has a horizontal scrollbar.  We need a new progress bar that looks good on mobile and tablet.  

Design four progress bars and add a preview page to evaluate them. They should be:

1. Update to the current progress bar to make it vertical
2. A new type of progress bar but ** use only Carbon components to build it **
3. Another new progress bar that uses carbon components but is different from the 2nd one 
4. A new type of progress bar that doesn't use Carbon. Whatever seems best.

",,,,,,,,,,,,,,DI-72,,,,com.atlassian.servicedesk.plugins.approvals.internal.customfield.ApprovalsCFValue@1f5e65a9,,,,,,,,,,,,,,,,,,,,0.0,,0.0,,,,,,,{},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,0|i02f0h:,,,,,,,,,,,,,,,Insureco: Master Sprint,,,,40.0,,,,,,,,,,,,,,,,,,,33736,DI-11,Enhancements,To Do,05/Dec/25 12:03 AM`;

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
  component?: string;
}

// Only import these specific tickets (no epics)
const TICKETS_TO_IMPORT = new Set([
  // Sprint tickets
  'DI-6', 'DI-7', 'DI-44', 'DI-2', 'DI-71', 'DI-123', 'DI-124', 'DI-127',
  // Backlog tickets
  'DI-72', 'DI-78', 'DI-9', 'DI-10', 'DI-67', 'DI-22', 'DI-45', 'DI-111', 'DI-126',
]);

// Tickets that go into the sprint (rest go to backlog)
const SPRINT_TICKETS = new Set([
  'DI-6', 'DI-7', 'DI-44', 'DI-2', 'DI-71', 'DI-123', 'DI-124', 'DI-127',
]);

// Components per ticket (based on parent epic name — components support spaces unlike labels)
const TICKET_COMPONENTS: Record<string, string> = {
  'DI-6': 'Strategic Work',
  'DI-7': 'Strategic Work',
  'DI-9': 'Strategic Work',
  'DI-10': 'Strategic Work',
  'DI-2': 'Enhancements',
  'DI-44': 'Enhancements',
  'DI-71': 'Enhancements',
  'DI-72': 'Enhancements',
  'DI-78': 'Enhancements',
  'DI-67': 'Enhancements',
  'DI-22': 'Enhancements',
  'DI-45': 'Enhancements',
  'DI-123': 'Support',
  'DI-124': 'Support',
  'DI-127': 'Support',
};

// Map original Jira attachment filenames to publicly hosted URLs
const HOSTED_ATTACHMENTS: Record<string, string> = {
  'image-20251204-235900.png': 'https://cdn.builder.io/api/v1/image/assets%2F15fef8bda062421996a6af7b8dd92729%2Fe09463724b4f4c759a39a5838348dc5e',
  'image-20251211-182841.png': 'https://cdn.builder.io/api/v1/image/assets%2F15fef8bda062421996a6af7b8dd92729%2Fcd6ccae4baf946c2add26ca93971c0de',
  'image-20260217-141639.png': 'https://cdn.builder.io/api/v1/image/assets%2F15fef8bda062421996a6af7b8dd92729%2F36510c9f2d6140bf87da4fc08f9cf082',
};

// Convert plain text description to Atlassian Document Format (ADF)
function convertToADF(text: string): object {
  if (!text) {
    return { type: 'doc', version: 1, content: [] };
  }

  const paragraphs = text.split(/\n\n+/);

  const content = paragraphs.map(paragraph => {
    const trimmed = paragraph.trim();
    if (!trimmed) return null;

    const lines = trimmed.split('\n');
    const isUnorderedList = lines.every(l => l.trim().startsWith('* ') || l.trim().startsWith('- ') || l.trim() === '');
    const isOrderedList = lines.every(l => /^\d+\.\s/.test(l.trim()) || l.trim() === '');

    if (isUnorderedList && lines.some(l => l.trim().startsWith('* ') || l.trim().startsWith('- '))) {
      return {
        type: 'bulletList',
        content: lines
          .filter(l => l.trim())
          .map(l => ({
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: l.trim().replace(/^[*-]\s/, '') }]
            }]
          }))
      };
    }

    if (isOrderedList && lines.some(l => /^\d+\.\s/.test(l.trim()))) {
      return {
        type: 'orderedList',
        content: lines
          .filter(l => l.trim())
          .map(l => ({
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: l.trim().replace(/^\d+\.\s/, '') }]
            }]
          }))
      };
    }

    const textContent: any[] = [];
    const inlineLines = trimmed.split('\n');
    inlineLines.forEach((line, idx) => {
      if (idx > 0) {
        textContent.push({ type: 'hardBreak' });
      }
      const cleaned = line.replace(/!([^|!]+)\|[^!]*!/g, '[image: $1]');
      if (cleaned) {
        textContent.push({ type: 'text', text: cleaned });
      }
    });

    if (textContent.length === 0) return null;

    return {
      type: 'paragraph',
      content: textContent,
    };
  }).filter(Boolean);

  return {
    type: 'doc',
    version: 1,
    content: content.length > 0 ? content : [{ type: 'paragraph', content: [{ type: 'text', text: ' ' }] }],
  };
}

// Parse CSV and return sorted issues
function parseTickets(): JiraIssue[] {
  const parsed = Papa.parse(DEMO_CSV_DATA, { header: true });
  const rows = parsed.data as any[];

  const issues: JiraIssue[] = rows
    .filter(row => row.Summary && row['Issue Type'] && TICKETS_TO_IMPORT.has(row['Issue key']))
    .map(row => {
      let attachmentUrl = '';
      let attachmentFilename = '';
      if (row.Attachment) {
        const attachmentParts = row.Attachment.split(';');
        if (attachmentParts.length >= 3) {
          attachmentFilename = attachmentParts[2];
          attachmentUrl = attachmentParts[3];
        }
      }

      const storyPoints = row['Custom field (Story Points)'] || row['Custom field (Story point estimate)'];
      const parsedStoryPoints = storyPoints ? parseFloat(storyPoints) : undefined;

      const issueKey = row['Issue key'];
      return {
        summary: row.Summary,
        issueKey,
        issueType: row['Issue Type'],
        status: row.Status || 'To Do',
        description: row.Description || '',
        priority: row.Priority || 'Medium',
        parentKey: row['Parent key'],
        attachmentUrl,
        attachmentFilename,
        sprint: row.Sprint,
        storyPoints: parsedStoryPoints,
        component: TICKET_COMPONENTS[issueKey],
      };
    });

  // Sort: regular issues first, then child issues (no epics in this set)
  const regular = issues.filter(i => !i.parentKey);
  const children = issues.filter(i => i.parentKey);
  return [...regular, ...children];
}

// GET /api/tickets - Return the list of tickets to import
export const handleGetTickets: RequestHandler = (_req, res) => {
  const tickets = parseTickets();
  res.json({
    total: tickets.length,
    tickets: tickets.map((t, index) => ({
      index,
      issueKey: t.issueKey,
      summary: t.summary,
      issueType: t.issueType,
      parentKey: t.parentKey || null,
      hasAttachment: !!t.attachmentFilename,
      storyPoints: t.storyPoints ?? null,
      sprint: SPRINT_TICKETS.has(t.issueKey) ? 'sprint' : null,
    })),
  });
};

// POST /api/setup-sprint - Find board and create sprint
export const handleSetupSprint: RequestHandler = async (req, res) => {
  const { config, sprintName } = req.body as {
    config: JiraConfig;
    sprintName: string;
  };

  if (!config?.domain || !config?.email || !config?.apiToken || !config?.targetProject) {
    res.status(400).json({ error: 'Missing required config fields' });
    return;
  }

  const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
  const jiraClient = axios.create({
    baseURL: `https://${config.domain}`,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  try {
    const targetSprintName = sprintName || 'InsureCo: Sprint';

    // Step 1: Find the board for this project
    const boardsRes = await jiraClient.get('/rest/agile/1.0/board', {
      params: { projectKeyOrId: config.targetProject },
    });

    const boards = boardsRes.data.values;
    if (!boards || boards.length === 0) {
      res.status(404).json({ error: 'No board found for this project. Please create a Scrum board in Jira first.' });
      return;
    }

    // Use the first Scrum board, or fall back to any board
    const scrumBoard = boards.find((b: any) => b.type === 'scrum') || boards[0];
    const boardId = scrumBoard.id;

    // Step 2: Ensure project components exist (Strategic Work, Enhancements, Support)
    let componentsAvailable = true;
    const componentNames = [...new Set(Object.values(TICKET_COMPONENTS))];

    // First check if components already exist
    let existingComponents: string[] = [];
    try {
      const projRes = await jiraClient.get(`/rest/api/3/project/${config.targetProject}/components`);
      existingComponents = (projRes.data || []).map((c: any) => c.name);
    } catch {
      // If we can't list components, we'll try creating them
    }

    for (const name of componentNames) {
      if (existingComponents.includes(name)) continue;
      try {
        await jiraClient.post(`/rest/api/3/component`, {
          name,
          project: config.targetProject,
        });
      } catch {
        componentsAvailable = false;
      }
    }

    // Step 3: Check for existing sprints on this board
    let existingSprint: any = null;
    try {
      const sprintsRes = await jiraClient.get(`/rest/agile/1.0/board/${boardId}/sprint`, {
        params: { state: 'active,future' },
      });
      const sprints = sprintsRes.data.values || [];
      existingSprint = sprints.find((s: any) => s.name === targetSprintName);
    } catch {
      // If listing sprints fails, we'll just create a new one
    }

    if (existingSprint) {
      res.json({
        success: true,
        sprintId: existingSprint.id,
        sprintName: existingSprint.name,
        boardId,
        boardName: scrumBoard.name,
        existing: true,
        componentsAvailable,
      });
      return;
    }

    // Step 4: Create new sprint only if none exists
    const sprintRes = await jiraClient.post('/rest/agile/1.0/sprint', {
      name: targetSprintName,
      originBoardId: boardId,
    });

    res.json({
      success: true,
      sprintId: sprintRes.data.id,
      sprintName: sprintRes.data.name,
      boardId,
      boardName: scrumBoard.name,
      existing: false,
      componentsAvailable,
    });
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 'No response';
      const errorData = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      errorMessage = `HTTP ${status} - ${errorData}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    res.status(500).json({ error: errorMessage });
  }
};

// POST /api/import-ticket - Import a single ticket
export const handleImportTicket: RequestHandler = async (req, res) => {
  const { ticketIndex, config, issueKeyMap, sprintId, componentsAvailable } = req.body as {
    ticketIndex: number;
    config: JiraConfig;
    issueKeyMap: Record<string, string>;
    sprintId?: number;
    componentsAvailable?: boolean;
  };

  // Validate
  if (!config?.domain || !config?.email || !config?.apiToken || !config?.targetProject) {
    res.status(400).json({ error: 'Missing required config fields' });
    return;
  }

  const tickets = parseTickets();
  if (ticketIndex < 0 || ticketIndex >= tickets.length) {
    res.status(400).json({ error: 'Invalid ticket index' });
    return;
  }

  const issue = tickets[ticketIndex];
  const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');

  const jiraClient = axios.create({
    baseURL: `https://${config.domain}`,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  try {
    // Build payload
    const payload: any = {
      fields: {
        project: { key: config.targetProject },
        summary: issue.summary,
        issuetype: { name: issue.issueType },
        assignee: null,
      },
    };

    // Set component if available and user has permission
    if (issue.component && componentsAvailable !== false) {
      payload.fields.components = [{ name: issue.component }];
    }

    if (issue.description) {
      payload.fields.description = convertToADF(issue.description);
    }

    if (issue.priority) {
      payload.fields.priority = { name: issue.priority };
    }

    // Add parent reference using the key map from client
    if (issue.parentKey && issueKeyMap?.[issue.parentKey]) {
      payload.fields.parent = { key: issueKeyMap[issue.parentKey] };
    }

    // Create the issue — retry without components if it fails
    let createResponse;
    try {
      createResponse = await jiraClient.post('/rest/api/3/issue', payload);
    } catch (createError) {
      if (axios.isAxiosError(createError) && createError.response?.data?.errors?.components && payload.fields.components) {
        delete payload.fields.components;
        createResponse = await jiraClient.post('/rest/api/3/issue', payload);
      } else {
        throw createError;
      }
    }
    const newKey = createResponse.data.key;

    const warnings: string[] = [];

    // Set story points separately
    if (issue.storyPoints !== undefined) {
      try {
        await jiraClient.put(`/rest/api/3/issue/${newKey}`, {
          fields: { customfield_10016: issue.storyPoints }
        });
      } catch {
        warnings.push('Story points field not available - skipped');
      }
    }

    // Upload attachment
    if (issue.attachmentFilename) {
      try {
        const downloadUrl = HOSTED_ATTACHMENTS[issue.attachmentFilename] || issue.attachmentUrl;
        if (!downloadUrl) throw new Error('No attachment URL available');

        const attachmentResponse = await axios.get(downloadUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
        });

        const form = new FormData();
        form.append('file', Buffer.from(attachmentResponse.data), issue.attachmentFilename);

        await jiraClient.post(
          `/rest/api/3/issue/${newKey}/attachments`,
          form,
          {
            headers: {
              'X-Atlassian-Token': 'no-check',
              ...form.getHeaders(),
            },
          }
        );
      } catch (attachError) {
        const errorMsg = attachError instanceof Error ? attachError.message : 'Unknown error';
        warnings.push(`Attachment upload failed: ${errorMsg}`);
      }
    }

    // Transition to correct workflow status if not "To Do"
    if (issue.status && issue.status.toLowerCase() !== 'to do') {
      try {
        const transitionsRes = await jiraClient.get(`/rest/api/3/issue/${newKey}/transitions`);
        const transitions = transitionsRes.data.transitions || [];
        const targetTransition = transitions.find(
          (t: any) => t.name.toLowerCase() === issue.status.toLowerCase()
        );
        if (targetTransition) {
          await jiraClient.post(`/rest/api/3/issue/${newKey}/transitions`, {
            transition: { id: targetTransition.id },
          });
        } else {
          warnings.push(`Could not find transition for status "${issue.status}"`);
        }
      } catch {
        warnings.push(`Could not transition to "${issue.status}" - skipped`);
      }
    }

    // Assign to sprint if this ticket is in the sprint set
    if (sprintId && SPRINT_TICKETS.has(issue.issueKey)) {
      try {
        await jiraClient.post(`/rest/agile/1.0/sprint/${sprintId}/issue`, {
          issues: [newKey],
        });
      } catch {
        warnings.push('Could not assign to sprint - skipped');
      }
    }

    res.json({
      success: true,
      oldKey: issue.issueKey,
      newKey,
      summary: issue.summary,
      warnings,
    });
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 'No response';
      const statusText = error.response?.statusText || '';
      const errorData = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      errorMessage = `HTTP ${status} ${statusText} - ${errorData}`;
    } else if (error instanceof Error) {
      errorMessage = `${error.name}: ${error.message}`;
    }

    res.status(500).json({
      success: false,
      oldKey: issue.issueKey,
      summary: issue.summary,
      error: errorMessage,
    });
  }
};
