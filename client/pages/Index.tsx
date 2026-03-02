import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2, Upload, Database, Key, Mail, Building2 } from "lucide-react";

interface JiraConfig {
  domain: string;
  email: string;
  apiToken: string;
  targetProject: string;
}

interface ImportResult {
  success: boolean;
  created: number;
  failed: number;
  errors: string[];
  warnings: string[];
}

export default function Index() {
  const [config, setConfig] = useState<JiraConfig>({
    domain: '',
    email: '',
    apiToken: '',
    targetProject: ''
  });

  const [importing, setImporting] = useState(false);
  const [progressTotal, setProgressTotal] = useState(0);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [currentTicket, setCurrentTicket] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    // Validate all required fields
    const missingFields = [];
    if (!config.domain) missingFields.push('Jira Domain');
    if (!config.email) missingFields.push('Email');
    if (!config.apiToken) missingFields.push('API Token');
    if (!config.targetProject) missingFields.push('Target Project Key');

    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields:\n\n${missingFields.join('\n')}`);
      return;
    }

    if (config.domain.includes('://') || config.domain.endsWith('/')) {
      alert('Invalid Jira Domain format.\n\nPlease enter just the domain without https:// or trailing slash.\n\nExample: your-company.atlassian.net');
      return;
    }

    setImporting(true);
    setResult(null);
    setProgressCurrent(0);
    setCurrentTicket('Loading tickets...');

    try {
      // Step 1: Fetch the list of tickets
      const ticketsRes = await fetch('/api/tickets');
      if (!ticketsRes.ok) {
        throw new Error(`Failed to load tickets: ${ticketsRes.status}`);
      }
      const { total, tickets } = await ticketsRes.json();
      setProgressTotal(total);

      // Step 2: Find existing sprint or create new one
      let sprintId: number | undefined;
      setCurrentTicket('Setting up sprint...');
      try {
        const sprintRes = await fetch('/api/setup-sprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config,
            sprintName: 'Insureco: Master Sprint',
          }),
        });
        const sprintData = await sprintRes.json();
        if (sprintData.success) {
          sprintId = sprintData.sprintId;
        }
      } catch {
        // Sprint setup failed - continue without sprint assignment
      }

      // Step 3: Import each ticket one at a time
      let created = 0;
      let failed = 0;
      const errors: string[] = [];
      const warnings: string[] = [];
      const issueKeyMap: Record<string, string> = {};

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        setProgressCurrent(i);
        setCurrentTicket(`${ticket.summary} (${ticket.issueType})`);

        try {
          const importRes = await fetch('/api/import-ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticketIndex: ticket.index,
              config,
              issueKeyMap,
              sprintId,
            }),
          });

          const data = await importRes.json();

          if (data.success) {
            created++;
            issueKeyMap[data.oldKey] = data.newKey;
            if (data.warnings?.length > 0) {
              warnings.push(...data.warnings.map((w: string) => `${ticket.summary}: ${w}`));
            }
          } else {
            failed++;
            errors.push(`${ticket.summary}: ${data.error}`);
          }
        } catch (err) {
          failed++;
          errors.push(`${ticket.summary}: ${err instanceof Error ? err.message : 'Network error'}`);
        }
      }

      setProgressCurrent(total);
      setCurrentTicket('Complete');
      setResult({ success: failed === 0, created, failed, errors, warnings });
    } catch (error) {
      setResult({
        success: false,
        created: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        warnings: [],
      });
    } finally {
      setImporting(false);
    }
  };

  const progressPercent = progressTotal > 0 ? Math.round((progressCurrent / progressTotal) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Header />
        <ConfigCard config={config} setConfig={setConfig} importing={importing} />
        <PrerequisitesAlert />
        <ImportInfoCard />

        {/* Import Button */}
        <div className="flex justify-center mb-6">
          <Button
            onClick={handleImport}
            disabled={importing || !config.domain || !config.email || !config.apiToken || !config.targetProject}
            size="lg"
            className="px-8 shadow-lg"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Start Import
              </>
            )}
          </Button>
        </div>

        {/* Progress */}
        {(importing || progressCurrent > 0) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Import Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {progressCurrent} of {progressTotal} tickets
                  </span>
                  <span className="font-medium">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} />
              </div>
              {currentTicket && (
                <p className="text-sm text-muted-foreground">Current: {currentTicket}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && <ResultsAlert result={result} />}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="text-center mb-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
        <Database className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-4xl font-bold text-foreground mb-3">Jira Ticket Importer</h1>
      <p className="text-lg text-muted-foreground">Import Demo InsureCo tickets to your Jira project</p>
    </div>
  );
}

function ConfigCard({
  config,
  setConfig,
  importing,
}: {
  config: JiraConfig;
  setConfig: (c: JiraConfig) => void;
  importing: boolean;
}) {
  return (
    <Card className="mb-6 shadow-lg border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Jira Configuration
        </CardTitle>
        <CardDescription>Enter your Jira credentials and target project</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="domain" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Jira Domain
            </Label>
            <Input
              id="domain"
              placeholder="your-domain.atlassian.net"
              value={config.domain}
              onChange={(e) => setConfig({ ...config, domain: e.target.value })}
              disabled={importing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={config.email}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
              disabled={importing}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiToken">API Token (Standard API Token)</Label>
          <Input
            id="apiToken"
            type="password"
            placeholder="Your Jira API token"
            value={config.apiToken}
            onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
            disabled={importing}
          />
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Token Type:</strong> Standard API Token (not OAuth)</p>
            <p>
              Generate from{' '}
              <a
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Atlassian Account Settings &rarr; Security &rarr; API tokens
              </a>
            </p>
            <p className="text-amber-700 dark:text-amber-400">
              <strong>Required permissions:</strong> Your Jira account must have:
            </p>
            <ul className="ml-4 space-y-0.5 text-amber-700 dark:text-amber-400">
              <li>- Create issues in the target project</li>
              <li>- Add attachments to issues</li>
              <li>- Browse projects permission</li>
            </ul>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetProject">Target Project Key</Label>
          <Input
            id="targetProject"
            placeholder="PROJ (e.g., DI, TEST, DEMO)"
            value={config.targetProject}
            onChange={(e) => setConfig({ ...config, targetProject: e.target.value.toUpperCase() })}
            disabled={importing}
          />
          <p className="text-xs text-muted-foreground">The project key where tickets will be imported</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PrerequisitesAlert() {
  return (
    <Alert className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
      <AlertDescription>
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5">&#9888;&#65039;</div>
          <div className="flex-1">
            <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Prerequisites Required</p>
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
              Before importing, ensure the following requirements are met:
            </p>
            <div className="text-sm text-amber-800 dark:text-amber-200 space-y-3 mb-3">
              <div>
                <p className="font-semibold mb-1.5">Your Target Project Must Have:</p>
                <ul className="space-y-1 ml-4">
                  <li className="flex items-start gap-2">
                    <span>-</span>
                    <span>
                      <strong>Issue Types:</strong> Bug, Epic, Story, Task{' '}
                      <a href="https://support.atlassian.com/jira-cloud-administration/docs/add-edit-and-delete-an-issue-type/" target="_blank" rel="noopener noreferrer" className="underline">
                        (How to add)
                      </a>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>-</span>
                    <span><strong>Attachments enabled</strong> (usually on by default)</span>
                  </li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Issues with missing issue types will fail to import. Story points will be set if the field exists.
            </p>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

function ImportInfoCard() {
  return (
    <Card className="mb-6 bg-accent/5 border-accent/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Upload className="w-5 h-5 text-accent mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold mb-2">What will be imported?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              27 Demo InsureCo Jira tickets with the following fields:
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              {['Title (Summary)', 'Description', 'Issue Type', 'Parent Links', 'Attachments', 'Story Points*'].map(field => (
                <div key={field} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>{field}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground border-t border-accent/20 pt-2">
              *Story Points use customfield_10016. If the field doesn't exist, it will be skipped.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultsAlert({ result }: { result: ImportResult }) {
  return (
    <Alert className={result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
      <div className="flex items-start gap-3">
        {result.success ? (
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
        )}
        <div className="flex-1">
          <AlertDescription>
            <p className="font-semibold mb-2">
              {result.success ? 'Import Completed!' : 'Import Finished with Errors'}
            </p>
            <div className="space-y-1 text-sm">
              <p>Created: {result.created} tickets</p>
              {result.failed > 0 && <p>Failed: {result.failed} tickets</p>}
            </div>
            {result.warnings.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="font-medium text-sm">Warnings:</p>
                {result.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-700">{w}</p>
                ))}
              </div>
            )}
            {result.errors.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="font-medium text-sm">Errors:</p>
                {result.errors.map((error, i) => (
                  <p key={i} className="text-xs text-red-700">{error}</p>
                ))}
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
