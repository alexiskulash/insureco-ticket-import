import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2, Upload, Database, Key, Mail, Building2, ListTodo } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const STORAGE_KEY = 'jira-importer-config';

function loadSavedConfig(): JiraConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        domain: parsed.domain || '',
        email: parsed.email || '',
        apiToken: parsed.apiToken || '',
        targetProject: parsed.targetProject || 'DEMO',
      };
    }
  } catch {}
  return { domain: '', email: '', apiToken: '', targetProject: 'DEMO' };
}

function saveConfig(config: JiraConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

function clearSavedConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export default function Index() {
  const [config, setConfig] = useState<JiraConfig>(loadSavedConfig);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem(STORAGE_KEY));
  const [deleteExisting, setDeleteExisting] = useState(false);

  const [importing, setImporting] = useState(false);
  const [progressTotal, setProgressTotal] = useState(0);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [currentTicket, setCurrentTicket] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [skippedTickets, setSkippedTickets] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadTickets() {
      try {
        const res = await fetch('/api/tickets');
        if (res.ok) {
          const data = await res.json();
          setTicketsList(data.tickets || []);
        }
      } catch (err) {
        console.error("Failed to fetch tickets", err);
      } finally {
        setLoadingTickets(false);
      }
    }
    loadTickets();
  }, []);

  const handleCheckExisting = async () => {
    // Validate all required fields
    const missingFields = [];
    if (!config.domain) missingFields.push('Jira Domain');
    if (!config.email) missingFields.push('Email');
    if (!config.apiToken) missingFields.push('API Token');
    if (!config.targetProject) missingFields.push('Target Project Key');

    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields to check existing tickets:\n\n${missingFields.join('\n')}`);
      return;
    }

    if (config.domain.includes('://') || config.domain.endsWith('/')) {
      alert('Invalid Jira Domain format.\n\nPlease enter just the domain without https:// or trailing slash.\n\nExample: your-company.atlassian.net');
      return;
    }

    setCheckingExisting(true);
    try {
      const res = await fetch('/api/check-existing-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.existingKeys) {
          if (deleteExisting) {
            setSkippedTickets(prev => {
              const newSkipped = new Set(prev);
              data.existingKeys.forEach((key: string) => newSkipped.delete(key));
              return newSkipped;
            });
            if (data.existingKeys.length === 0) {
              alert('No existing tickets found in Jira. You are good to go!');
            } else {
              alert(`Found ${data.existingKeys.length} existing tickets in Jira. They will be deleted and recreated during import.`);
            }
          } else {
            setSkippedTickets(prev => {
              const newSkipped = new Set(prev);
              data.existingKeys.forEach((key: string) => newSkipped.add(key));
              return newSkipped;
            });

            if (data.existingKeys.length === 0) {
              alert('No existing tickets found in Jira. You are good to go!');
            } else {
              alert(`Found ${data.existingKeys.length} existing tickets in Jira. They have been marked to be skipped.`);
            }
          }
        }
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Failed to check existing tickets. Error: ${data.error || res.statusText}\n\nPlease verify your credentials and project key.`);
      }
    } catch (err) {
      console.error("Failed to check existing tickets", err);
      alert('Network error while checking existing tickets.');
    } finally {
      setCheckingExisting(false);
    }
  };

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

    // Save or clear config based on remember me
    if (rememberMe) {
      saveConfig(config);
    } else {
      clearSavedConfig();
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
      let epicKeyMap: Record<string, string> = {};
      setCurrentTicket('Setting up sprint and epics...');
      try {
        const sprintRes = await fetch('/api/setup-sprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config,
            sprintName: 'InsureCo: Sprint',
          }),
        });
        const sprintData = await sprintRes.json();
        if (sprintData.success) {
          sprintId = sprintData.sprintId;
          epicKeyMap = sprintData.epicKeyMap || {};
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

      // Filter out tickets that are marked to be skipped
      const ticketsToImport = tickets.filter((t: any) => !skippedTickets.has(t.issueKey));
      setProgressTotal(ticketsToImport.length);

      if (deleteExisting && ticketsToImport.length > 0) {
        setCurrentTicket('Deleting existing matching tickets...');
        try {
          const deleteRes = await fetch('/api/delete-matching-tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              config,
              summaries: ticketsToImport.map((t: any) => t.summary),
            }),
          });
          const deleteData = await deleteRes.json();
          if (!deleteData.success) {
            console.error('Failed to delete existing tickets:', deleteData.error);
          }
        } catch (err) {
          console.error('Error deleting existing tickets:', err);
        }
      }

      for (let i = 0; i < ticketsToImport.length; i++) {
        const ticket = ticketsToImport[i];
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
              epicKeyMap,
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

      setProgressCurrent(ticketsToImport.length);
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
      <div className="container mx-auto px-4 py-12 max-w-[1200px]">
        <Header />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Tickets Preview */}
          <Card className="h-[90vh] min-h-[600px] flex flex-col shadow-lg border-2">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ListTodo className="w-5 h-5" />
                    Tickets to Import
                    {!loadingTickets && (
                      <Badge variant="secondary" className="ml-2 font-normal text-xs">
                        {ticketsList.length - skippedTickets.size} of {ticketsList.length} selected
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    These tickets will be imported into your Jira project. Click a row to skip it.
                  </CardDescription>
                </div>
                {checkingExisting && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Checking existing...
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
              {loadingTickets ? (
                <div className="flex-1 flex justify-center items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="flex-1 h-full px-6">
                  <Table className="table-fixed">
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="w-auto">Summary</TableHead>
                        <TableHead className="w-[80px] text-center">Points</TableHead>
                        <TableHead className="w-[100px]">Sprint</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ticketsList.map((t, idx) => {
                        const isSkipped = skippedTickets.has(t.issueKey);
                        return (
                          <TableRow
                            key={t.issueKey || idx}
                            onClick={() => {
                              const newSkipped = new Set(skippedTickets);
                              if (isSkipped) {
                                newSkipped.delete(t.issueKey);
                              } else {
                                newSkipped.add(t.issueKey);
                              }
                              setSkippedTickets(newSkipped);
                            }}
                            className={`cursor-pointer transition-colors ${
                              isSkipped
                                ? 'bg-red-50/50 hover:bg-red-50/80 opacity-60'
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <TableCell className="font-medium text-sm truncate max-w-0">
                              <div className="flex items-center gap-2 truncate">
                                {isSkipped && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                <span className={`truncate ${isSkipped ? 'line-through text-muted-foreground' : ''}`} title={t.summary}>
                                  {t.summary}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground whitespace-nowrap">{t.storyPoints ?? '-'}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {t.sprint ? (
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-transparent">Sprint</Badge>
                              ) : (
                                <Badge variant="secondary" className="font-normal">Backlog</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Right Column: Configuration & Import */}
          <div className="flex flex-col gap-6">
            <ConfigCard
              config={config}
              setConfig={setConfig}
              importing={importing}
              rememberMe={rememberMe}
              setRememberMe={setRememberMe}
              deleteExisting={deleteExisting}
              setDeleteExisting={setDeleteExisting}
            />
            <PrerequisitesAlert />

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mb-6">
              <Button
                onClick={handleCheckExisting}
                disabled={importing || checkingExisting || !config.domain || !config.email || !config.apiToken || !config.targetProject}
                variant="outline"
                size="lg"
                className="px-8 shadow-lg h-11 w-full sm:w-auto"
              >
                {checkingExisting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    Check Existing
                  </>
                )}
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || checkingExisting || !config.domain || !config.email || !config.apiToken || !config.targetProject}
                size="lg"
                className="px-8 shadow-lg h-11 w-full sm:w-auto"
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
  rememberMe,
  setRememberMe,
  deleteExisting,
  setDeleteExisting,
}: {
  config: JiraConfig;
  setConfig: (c: JiraConfig) => void;
  importing: boolean;
  rememberMe: boolean;
  setRememberMe: (v: boolean) => void;
  deleteExisting: boolean;
  setDeleteExisting: (v: boolean) => void;
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
              onChange={(e) => {
                setConfig({ ...config, domain: e.target.value });
              }}
              onBlur={() => {
                let val = config.domain.trim();

                // Automatically strip out http://, https://
                val = val.replace(/^https?:\/\//, '');
                // Strip out trailing slash and anything after it
                val = val.split('/')[0];

                if (val && !val.includes('.')) {
                  val = `${val}.atlassian.net`;
                }

                setConfig({ ...config, domain: val });
              }}
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
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetProject">Target Project Key</Label>
          <Input
            id="targetProject"
            placeholder="PROJ (e.g., DI, TEST, DEMO)"
            value={config.targetProject}
            onChange={(e) => setConfig({ ...config, targetProject: e.target.value.toUpperCase().trim() })}
            disabled={importing}
          />
          <p className="text-xs text-muted-foreground">The project key where tickets will be imported</p>
        </div>

        <div className="flex flex-col gap-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => {
                setRememberMe(e.target.checked);
                if (!e.target.checked) clearSavedConfig();
              }}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
              Remember my credentials
            </Label>
            <span className="text-xs text-muted-foreground">(saved in browser only)</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="deleteExisting"
              checked={deleteExisting}
              onChange={(e) => setDeleteExisting(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              disabled={importing}
            />
            <Label htmlFor="deleteExisting" className="text-sm font-normal cursor-pointer text-red-700 dark:text-red-400">
              Delete existing matching tickets
            </Label>
            <span className="text-xs text-muted-foreground hidden sm:inline">(deletes them before creating new ones during import)</span>
          </div>
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
            <div className="text-sm text-amber-800 dark:text-amber-200 space-y-3 mb-3">
              <div>
                <p className="font-semibold mb-1.5">Board Features (enable in Project Settings &rarr; Features):</p>
                <ul className="space-y-1 ml-4">
                  <li className="flex items-start gap-2">
                    <span>-</span>
                    <span>
                      <strong>Backlog</strong>{' '}
                      <a href="https://support.atlassian.com/jira-software-cloud/docs/enable-the-backlog-for-a-scrum-board/" target="_blank" rel="noopener noreferrer" className="underline">(How to enable)</a>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>-</span>
                    <span>
                      <strong>Sprints</strong>{' '}
                      <a href="https://support.atlassian.com/jira-software-cloud/docs/enable-sprints/" target="_blank" rel="noopener noreferrer" className="underline">(How to enable)</a>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>-</span>
                    <span>
                      <strong>Estimation</strong> (for story points){' '}
                      <a href="https://support.atlassian.com/jira-software-cloud/docs/configure-estimation/" target="_blank" rel="noopener noreferrer" className="underline">(How to enable)</a>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>-</span>
                    <span>
                      <strong>List view</strong>{' '}
                      <a href="https://support.atlassian.com/jira-software-cloud/docs/view-and-edit-your-issues-in-a-list/" target="_blank" rel="noopener noreferrer" className="underline">(How to enable)</a>
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
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
