import { useState } from 'react';
import {
  BookOpen, LayoutDashboard, List, Zap, Search,
  ChevronDown, ChevronRight, CheckCircle, AlertTriangle,
  ExternalLink, Terminal, FileCode, Clock, Shield
} from 'lucide-react';

interface Step {
  title: string;
  steps: string[];
  note?: string;
  warning?: string;
  tip?: string;
}

interface Guide {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  docUrl: string;
  estimatedTime: string;
  prereqs: string[];
  phases: { title: string; icon: React.ReactNode; steps: Step[] }[];
  tips: string[];
}

const GUIDES: Guide[] = [
  {
    id: 'playbook',
    name: 'Playbook',
    subtitle: 'Automated incident response',
    icon: <BookOpen size={20} />,
    color: '#d9861c',
    description: 'A Microsoft Sentinel Playbook is a Logic App workflow that automates responses to alerts and incidents. Playbooks can notify teams, enrich incidents with threat intelligence, block users, isolate machines, and integrate with third-party ticketing systems.',
    docUrl: 'https://learn.microsoft.com/en-us/azure/sentinel/automate-responses-with-playbooks',
    estimatedTime: '30–60 minutes',
    prereqs: [
      'Active Microsoft Sentinel workspace',
      'Logic Apps Contributor role on the subscription (or resource group)',
      'Microsoft Sentinel Contributor or Responder role',
      'If connecting to Microsoft 365: Exchange Online or Teams admin permissions for the API connector',
      'If blocking users via Entra ID: User Administrator or Global Administrator role',
    ],
    phases: [
      {
        title: 'Phase 1: Navigate to Playbooks',
        icon: <Terminal size={16} />,
        steps: [
          {
            title: 'Open Microsoft Sentinel Playbooks',
            steps: [
              'Go to https://portal.azure.com and sign in',
              'In the search bar, type Microsoft Sentinel and select it',
              'Click on your Sentinel workspace name from the list',
              'In the left navigation menu, scroll down to Configuration section',
              'Click Automation',
              'At the top of the Automation page, click the Playbooks tab',
              'You will see a list of existing playbooks (or an empty list if none exist yet)',
              'Click + Create at the top left, then select Playbook with incident trigger',
            ]
          }
        ]
      },
      {
        title: 'Phase 2: Configure the Playbook Basics',
        icon: <FileCode size={16} />,
        steps: [
          {
            title: 'Fill in the Create Playbook form',
            steps: [
              'On the Create playbook page, ensure you are on the Basics tab',
              'Subscription: select your Azure subscription from the dropdown',
              'Resource group: select an existing resource group or click Create new and enter a name (e.g., rg-sentinel-playbooks)',
              'Playbook name: enter a descriptive name using hyphens (e.g., Incident-Notify-Teams-OnHigh)',
              'Region: select the same region as your Microsoft Sentinel workspace',
              'Log Analytics workspace: select your Sentinel workspace from the dropdown — this links the playbook to Sentinel',
              'Enable diagnostics logs in Log Analytics: toggle this On — it records playbook run history',
              'Tags (optional): click Next: Tags and add any resource tags your organisation requires',
              'Click Review + create, then click Create',
              'Wait 30–60 seconds for the Logic App to provision',
              'When deployment completes, click Go to resource or Edit in designer',
            ]
          }
        ]
      },
      {
        title: 'Phase 3: Build the Logic App Workflow',
        icon: <Zap size={16} />,
        steps: [
          {
            title: 'Understand the designer interface',
            steps: [
              'The Logic App Designer opens with a pre-built trigger: When Microsoft Sentinel incident creation rule was triggered',
              'This trigger fires every time a Sentinel incident is created or updated (depending on your automation rule)',
              'You cannot delete or change this trigger — all playbook logic goes below it',
              'Click on the trigger block to expand it and see the incident schema (account, alert, bookmark, entity details)',
              'Below the trigger you will see a + icon — click it to add the first action',
              'You can also switch to Code view (top menu) to view or paste the JSON definition directly',
            ]
          },
          {
            title: 'Add a Teams notification action (example)',
            steps: [
              'Click the + icon below the trigger, then click Add an action',
              'In the search box, type Microsoft Teams and press Enter',
              'Select Microsoft Teams from the connector list',
              'From the list of actions, click Post a message in a chat or channel',
              'A Sign in prompt appears — click Sign in and authenticate with an account that has access to Teams',
              'After sign-in, fill in the fields:',
              'Post as: select User or Flow bot',
              'Post in: select Channel',
              'Team: select the Teams team from the dropdown (e.g., Security Operations)',
              'Channel: select the channel (e.g., Incident Alerts)',
              'Message: click in the field, then click the dynamic content icon (lightning bolt)',
              'From the dynamic content panel, select Incident title, Incident severity, and Incident description',
              'Add static text around the dynamic fields, for example: 🚨 New Incident: [Incident title] | Severity: [Incident severity]',
              'Click Save at the top of the designer',
            ],
            tip: 'Use the Dynamic content panel to insert incident properties like titles, severity, URLs, and entity details directly into your message or email body.'
          },
          {
            title: 'Add an incident comment action (best practice)',
            steps: [
              'After the Teams action, click the + icon and select Add an action',
              'Search for Microsoft Sentinel and select it',
              'From the list, click Add comment to incident (V3)',
              'Incident ARM ID: click the field and select Incident ARM ID from the dynamic content panel',
              'Comment message: type a record of what the playbook did, e.g.: Playbook executed: Teams notification sent to Security Operations channel at [Timestamp]',
              'Add the Timestamp dynamic field from the dynamic content panel',
              'Click Save',
              'Adding comments creates an audit trail directly in the Sentinel incident',
            ]
          },
          {
            title: 'Add conditional logic (optional)',
            steps: [
              'To run actions only for High or Critical incidents, click + and select Add an action > Control > Condition',
              'In the Condition block, click Choose a value and select Incident severity from dynamic content',
              'Set the operator to is equal to',
              'Set the value to High (type it manually)',
              'Click Add row and add a second condition: Incident severity is equal to Critical',
              'Change And to Or between conditions',
              'In the If true branch: add your notification/response actions',
              'In the If false branch: you can add a lower-priority action or leave it empty',
              'Click Save when complete',
            ]
          }
        ]
      },
      {
        title: 'Phase 4: Test and Assign Permissions',
        icon: <CheckCircle size={16} />,
        steps: [
          {
            title: 'Grant the playbook permissions to access Sentinel',
            steps: [
              'In the Logic App resource, click Identity in the left menu (under Settings)',
              'On the System assigned tab, toggle Status to On and click Save, then Yes to confirm',
              'An Object ID is assigned — copy it for the next step',
              'Now navigate back to your Microsoft Sentinel workspace',
              'Click Settings in the Sentinel left menu, then select Workspace settings',
              'In the workspace page, click Access control (IAM) in the left menu',
              'Click + Add > Add role assignment',
              'Role tab: search for Microsoft Sentinel Responder and select it, click Next',
              'Members tab: click + Select members, search for your Logic App name, select it, and click Select',
              'Click Review + assign twice to save the role assignment',
              'This allows the playbook to read incidents and post comments without needing user credentials',
            ],
            note: 'The managed identity approach is more secure than using user credentials in connectors, as it does not depend on a specific user account staying active.'
          },
          {
            title: 'Test the playbook manually',
            steps: [
              'Navigate back to Microsoft Sentinel > Automation > Playbooks tab',
              'Find your playbook in the list and click its name',
              'Click Run on the playbook overview page',
              'A panel opens asking you to select an incident to test with',
              'Select any existing incident from your workspace and click Run',
              'The playbook executes — click Runs history in the Logic App to see the result',
              'In Runs history, click on the most recent run to see each step that executed',
              'Green ticks = success, red X = failure with error message',
              'Click on any failed step to see the detailed error and fix accordingly',
              'If Teams notification was sent, verify it appeared in the correct channel',
            ]
          }
        ]
      }
    ],
    tips: [
      'Name playbooks with a consistent convention: Action-Target-Condition (e.g., Block-User-OnHighSeverity)',
      'Always add a comment to incident action at the end so analysts know the playbook ran',
      'Use managed identity (system-assigned identity) instead of user credentials for connectors where possible',
      'Clone an existing playbook from the Sentinel GitHub templates repository at aka.ms/sentinelgithub',
      'Test playbooks against low-severity test incidents before attaching to automation rules in production',
      'Review Logic App run history weekly — failed runs mean your automated response is silently not working',
    ]
  },
  {
    id: 'workbook',
    name: 'Workbook',
    subtitle: 'Interactive security dashboards',
    icon: <LayoutDashboard size={20} />,
    color: '#0ea5e9',
    description: 'Microsoft Sentinel Workbooks are interactive dashboards built on Azure Monitor Workbooks. They visualise security data from your Log Analytics workspace using KQL queries, charts, tables, grids, and tiles. Use them for SOC dashboards, compliance reporting, and investigation views.',
    docUrl: 'https://learn.microsoft.com/en-us/azure/sentinel/monitor-your-data',
    estimatedTime: '20–90 minutes depending on complexity',
    prereqs: [
      'Active Microsoft Sentinel workspace with data ingested',
      'Log Analytics Reader role (minimum) to run KQL queries',
      'Microsoft Sentinel Reader role to view Sentinel-specific data',
      'Monitoring Contributor role to create and save workbooks',
      'Familiarity with KQL (Kusto Query Language) is helpful but not required for template-based workbooks',
    ],
    phases: [
      {
        title: 'Phase 1: Use a Built-in Template (Recommended Starting Point)',
        icon: <LayoutDashboard size={16} />,
        steps: [
          {
            title: 'Browse and deploy a workbook template',
            steps: [
              'In Microsoft Sentinel, click Workbooks in the left navigation under Threat Management',
              'The Workbooks page opens with two tabs: My workbooks (your saved copies) and Templates',
              'Click the Templates tab to browse the 100+ built-in templates',
              'Use the search box to find specific templates (e.g., type "Azure AD" or "Firewall")',
              'Browse categories using the filter dropdowns: Data Sources, Categories, or Content type',
              'Click on a template card to see a preview and description',
              'Click Save to save a copy to your workspace — the saved copy appears in My workbooks',
              'Click the saved workbook to open it in view mode',
              'Use the Time range selector at the top to adjust the time window shown',
              'Use the Subscription and Workspace filters if you have multiple environments',
            ]
          }
        ]
      },
      {
        title: 'Phase 2: Create a Custom Workbook from Scratch',
        icon: <FileCode size={16} />,
        steps: [
          {
            title: 'Create a new empty workbook',
            steps: [
              'In Sentinel > Workbooks, click + Add workbook at the top',
              'A new blank workbook opens in Edit mode',
              'Click Edit at the top left if the workbook opens in view mode',
              'You will see the workbook editor with a toolbar at the top and canvas below',
              'Click the + Add button in the toolbar to add elements: Query, Text, Parameters, Metric, or Link',
              'First, add a title: click + Add > Add text',
              'In the text editor, use Markdown: type # My Security Dashboard (# = heading 1)',
              'Add a subtitle: ## Overview of Security Events - Last 7 Days',
              'Click Done Editing on the text block',
            ]
          },
          {
            title: 'Add a time parameter',
            steps: [
              'Click + Add > Add parameters',
              'In the parameters block, click Add Parameter',
              'Parameter name: TimeRange (no spaces)',
              'Display name: Time Range',
              'Parameter type: select Time range picker',
              'Required: check this box',
              'Default value: select Last 7 days from the dropdown',
              'Click Save at the bottom of the parameter form',
              'Click Done Editing on the parameters block',
              'The time range picker will appear in your workbook for users to adjust',
            ]
          },
          {
            title: 'Add a KQL query visualisation',
            steps: [
              'Click + Add > Add query',
              'In the query block, ensure Data source is set to Logs and Resource type is set to Log Analytics',
              'In the query editor box, type or paste a KQL query. Example for sign-in failures:',
              'SigninLogs | where TimeGenerated > ago(7d) | where ResultType != "0" | summarize FailureCount = count() by UserPrincipalName | order by FailureCount desc | take 20',
              'Click Run Query to verify results appear in the preview below',
              'In the Visualization dropdown, select the display type: Grid (table), Bar chart, Line chart, Pie chart, Map, Tiles, or Stat',
              'For the sign-in failures example, select Grid to see a sortable table',
              'Click Column Settings to rename columns, set column widths, and add conditional formatting (e.g., colour FailureCount red when above 50)',
              'In Column settings, click on the FailureCount column > change Renderer to Thresholds > set threshold values and colours',
              'Click Save and Close in column settings, then click Done Editing on the query block',
            ],
            tip: 'Click Advanced Settings on any query block to reference the TimeRange parameter: set Time range to use parameter and select your TimeRange parameter. This makes the query respond to the time picker.'
          },
          {
            title: 'Add a chart for trending data',
            steps: [
              'Click + Add > Add query below your grid',
              'Enter a trending KQL query. Example for security events over time:',
              'SecurityEvent | where TimeGenerated > ago(7d) | summarize EventCount = count() by bin(TimeGenerated, 1h) | order by TimeGenerated asc',
              'Click Run Query to verify results',
              'Change Visualization to Line chart',
              'In the chart settings, set X-axis to TimeGenerated and Y-axis to EventCount',
              'Set the Chart title field to Security Events per Hour',
              'Click Done Editing on the query block',
            ]
          },
          {
            title: 'Add summary tiles (stat blocks)',
            steps: [
              'Click + Add > Add query',
              'Enter a count query. Example: SecurityAlert | where TimeGenerated > ago(24h) | summarize TotalAlerts = count()',
              'Click Run Query',
              'Change Visualization to Tiles',
              'In Tile Settings, set Title to Total Alerts (24h) and set Value field to TotalAlerts',
              'Set the tile style: choose Info, Success, Warning, or Error based on context',
              'Click Done Editing',
              'Repeat for other summary metrics: high severity alerts, active incidents, new users, etc.',
            ]
          }
        ]
      },
      {
        title: 'Phase 3: Save and Share',
        icon: <CheckCircle size={16} />,
        steps: [
          {
            title: 'Save the workbook',
            steps: [
              'Click the Save (floppy disk) icon or press Ctrl+S',
              'In the Save dialog, enter a Title for the workbook (e.g., SOC Daily Dashboard)',
              'Subscription: select your Azure subscription',
              'Resource group: select the resource group where you want to save the workbook',
              'Location: select the same region as your Sentinel workspace',
              'Save to a: select Shared report (visible to all users with access) or My reports (private)',
              'Click Apply to save',
              'The workbook is now accessible from Sentinel > Workbooks > My workbooks tab',
            ]
          },
          {
            title: 'Pin to Azure dashboard (optional)',
            steps: [
              'Open the workbook in view mode (click Done Editing if in edit mode)',
              'Click the Share icon (chain-link) at the top toolbar',
              'Select Pin to dashboard',
              'Choose an existing Azure dashboard or create a new one',
              'Select the workbook components you want to pin (individual queries or the whole workbook)',
              'Click Pin — the workbook tiles appear on your Azure dashboard at https://portal.azure.com/#dashboard',
            ]
          }
        ]
      }
    ],
    tips: [
      'Start with a built-in template and modify it rather than building from scratch',
      'Use the TimeRange parameter on every query so the workbook responds to the time picker',
      'Add conditional formatting to tables to highlight critical values in red automatically',
      'Use Group elements to create collapsible sections and keep large workbooks organised',
      'Export workbooks as ARM templates from the workbook editor toolbar for version control and sharing',
      'The Sentinel GitHub repository (aka.ms/sentinelgithub) has hundreds of community workbook templates',
    ]
  },
  {
    id: 'watchlist',
    name: 'Watchlist',
    subtitle: 'Reference data for KQL enrichment',
    icon: <List size={20} />,
    color: '#10b981',
    description: 'Microsoft Sentinel Watchlists allow you to import external data (CSV files) into your workspace for use in KQL queries, analytics rules, and hunting. Common uses include lists of high-value users, known bad IPs, VIP employees, approved software, and network asset inventories.',
    docUrl: 'https://learn.microsoft.com/en-us/azure/sentinel/watchlists',
    estimatedTime: '10–20 minutes',
    prereqs: [
      'Active Microsoft Sentinel workspace',
      'Microsoft Sentinel Contributor role to create watchlists',
      'A CSV file with a header row and at least one column to use as the search key',
      'CSV file must be UTF-8 encoded and under 3.8 MB per upload (up to 3 million rows maximum across all watchlists)',
    ],
    phases: [
      {
        title: 'Phase 1: Prepare Your CSV File',
        icon: <FileCode size={16} />,
        steps: [
          {
            title: 'Format the CSV file correctly',
            steps: [
              'Open Microsoft Excel, Notepad, or any text editor',
              'Create a CSV file with the first row as headers (column names)',
              'Example for a VIP Users watchlist: create columns UserPrincipalName, DisplayName, Department, RiskLevel',
              'Example header row: UserPrincipalName,DisplayName,Department,RiskLevel',
              'Populate rows with data: john.smith@company.com,John Smith,Executive,High',
              'Ensure there are no blank header columns and no special characters in column names (use underscores instead of spaces)',
              'Save the file as CSV UTF-8 format: in Excel, File > Save As > select CSV UTF-8 (Comma delimited) from the file type dropdown',
              'Verify the file by opening it in Notepad — each row should be on a new line with commas separating values',
              'Note the name of the column you will use as the Search key — this is the primary lookup field (e.g., UserPrincipalName)',
            ]
          }
        ]
      },
      {
        title: 'Phase 2: Create the Watchlist',
        icon: <List size={16} />,
        steps: [
          {
            title: 'Open the Watchlists page',
            steps: [
              'In Microsoft Sentinel, scroll down the left navigation to the Configuration section',
              'Click Watchlist',
              'The Watchlists page shows all existing watchlists with their item counts and last update times',
              'Click + New at the top left to create a new watchlist',
            ]
          },
          {
            title: 'Fill in the General tab',
            steps: [
              'Name: enter a short identifier name without spaces (e.g., VIPUsers) — this is used in KQL queries',
              'Description: enter a human-readable description (e.g., Executive and VIP user accounts for elevated monitoring)',
              'Watchlist alias: this auto-fills from the Name field — leave it as-is unless you need a different alias',
              'Note: the alias is how you reference the watchlist in KQL: _GetWatchlist("VIPUsers")',
              'Click Next: Source',
            ]
          },
          {
            title: 'Fill in the Source tab',
            steps: [
              'Source type: select Local file (to upload a CSV from your computer)',
              'Alternatively select Azure Storage if your CSV is stored in Azure Blob Storage',
              'Number of lines before row with headings: set to 0 if your first row is the header',
              'Upload file: click the folder icon and browse to your saved CSV file, then click Open',
              'After upload, the preview table shows your data — verify columns and rows look correct',
              'Search key: click the dropdown and select the column to use as the primary key (e.g., UserPrincipalName)',
              'The search key must contain unique values — no duplicates in that column',
              'Click Next: Review and Create',
            ]
          },
          {
            title: 'Review and create the watchlist',
            steps: [
              'Review the summary: Watchlist name, alias, record count, and search key column',
              'Verify the record count matches your CSV file row count (minus the header)',
              'Click Create — ingestion begins immediately',
              'Large watchlists (thousands of rows) may take 1–2 minutes to fully ingest',
              'The new watchlist appears on the Watchlists page with an item count',
              'Click on the watchlist name to view the records and verify data quality',
            ]
          }
        ]
      },
      {
        title: 'Phase 3: Use the Watchlist in KQL',
        icon: <Search size={16} />,
        steps: [
          {
            title: 'Query the watchlist in Log Analytics',
            steps: [
              'Navigate to Microsoft Sentinel > Logs (or Azure Monitor > Logs)',
              'Watchlists are queried using the _GetWatchlist() function',
              'To see all items in your watchlist, run: _GetWatchlist("VIPUsers")',
              'To join the watchlist with sign-in data, use: let vipUsers = _GetWatchlist("VIPUsers") | project UserPrincipalName, RiskLevel; SigninLogs | join kind=inner (vipUsers) on UserPrincipalName | project TimeGenerated, UserPrincipalName, RiskLevel, ResultType, Location',
              'To check if a value is in the watchlist: SecurityAlert | extend isvip = UserPrincipalName in (_GetWatchlist("VIPUsers") | project UserPrincipalName) | where isvip == true',
              'Click Run to test the query returns expected results',
            ],
            tip: 'Reference watchlists in analytic rules by including the _GetWatchlist() function in the rule query. This way, updating the watchlist automatically changes which entities the rule monitors — no need to edit the rule itself.'
          },
          {
            title: 'Update the watchlist with new data',
            steps: [
              'In Sentinel > Watchlist, click on the watchlist name',
              'Click Edit watchlist to modify individual records in the portal',
              'To replace all records: click Update watchlist > Upload new file',
              'Upload a new CSV with all records (both existing and new) — the watchlist is replaced entirely',
              'To add a single record: click Edit watchlist > + Add new > fill in the fields manually > Save',
              'To delete a record: select the checkbox next to a record and click Delete',
            ]
          }
        ]
      }
    ],
    tips: [
      'Use consistent naming for watchlists and their aliases — analytics rules reference the alias in KQL',
      'Keep a master copy of watchlist CSVs in a SharePoint folder so they can be updated and re-uploaded easily',
      'Create watchlists for: VIP/executive users, approved service accounts, known malicious IPs, internal IP ranges, and critical servers',
      'Watchlist records are stored in the _Watchlist table in Log Analytics — you can also query them directly',
      'Set up a Logic App playbook to automatically update watchlists when new threat intelligence is received',
      'Watchlists are not version-controlled by default — export a copy before making changes',
    ]
  },
  {
    id: 'automation',
    name: 'Automation Rule',
    subtitle: 'Trigger playbooks and actions automatically',
    icon: <Zap size={20} />,
    color: '#f59e0b',
    description: 'Automation rules in Microsoft Sentinel automatically trigger playbooks, change incident status, assign incidents, or add tags when incidents match defined conditions. They are the primary way to orchestrate automated responses without manual intervention.',
    docUrl: 'https://learn.microsoft.com/en-us/azure/sentinel/automate-incident-handling-with-automation-rules',
    estimatedTime: '10–15 minutes per rule',
    prereqs: [
      'Active Microsoft Sentinel workspace',
      'Microsoft Sentinel Contributor role to create automation rules',
      'At least one playbook already created and tested (for playbook-trigger rules)',
      'The playbook must have Microsoft Sentinel permissions (managed identity with Sentinel Responder role)',
    ],
    phases: [
      {
        title: 'Phase 1: Open Automation Rules',
        icon: <Zap size={16} />,
        steps: [
          {
            title: 'Navigate to the Automation page',
            steps: [
              'In Microsoft Sentinel, click Automation in the left navigation under Configuration',
              'The Automation page has three tabs: Automation rules, Playbooks, and Automation (legacy)',
              'Click the Automation rules tab',
              'You will see any existing automation rules listed with their status, trigger type, and priority',
              'Click + Create at the top left, then select Automation rule',
            ]
          }
        ]
      },
      {
        title: 'Phase 2: Define Trigger and Conditions',
        icon: <Search size={16} />,
        steps: [
          {
            title: 'Set the automation rule name and trigger',
            steps: [
              'Automation rule name: enter a descriptive name (e.g., Auto-Assign-HighSeverity-Incidents)',
              'Trigger: select when the rule fires. Options are:',
              '  → When incident is created (fires once when a new incident is opened)',
              '  → When incident is updated (fires each time an incident property changes)',
              '  → When alert is created (fires on each individual alert before incident grouping)',
              'For most incident-response automation, select When incident is created',
              'Note: Incident Updated trigger can create loops if your actions also update incidents — be careful with this option',
            ]
          },
          {
            title: 'Add conditions to filter incidents',
            steps: [
              'Under Conditions, click + Add to add filtering criteria',
              'Condition 1 — Severity filter:',
              '  Click the first dropdown and select Incident severity',
              '  Set operator to Equals',
              '  Set value to High',
              '  Click + Add and add another: Incident severity Equals Critical',
              '  Change the And connector between them to Or (click And to toggle it)',
              'Condition 2 — Analytics rule name filter (optional):',
              '  Click + Add condition',
              '  Select Analytics rule name from the dropdown',
              '  Set operator to Contains',
              '  Type a keyword to match specific rule names (e.g., Brute Force)',
              'Condition 3 — Tactic filter (optional):',
              '  Select Incident tactics from the dropdown',
              '  Set to Contains: select specific MITRE ATT&CK tactics like Credential Access or Lateral Movement',
              'You can add up to 50 conditions per automation rule using And/Or logic',
            ]
          }
        ]
      },
      {
        title: 'Phase 3: Define Actions',
        icon: <CheckCircle size={16} />,
        steps: [
          {
            title: 'Add actions to execute when conditions match',
            steps: [
              'Under Actions, click + Add action',
              'Available action types:',
              '',
              'Assign owner: click Add action > Assign owner > select a user or group from the Entra ID picker. Use this to route incidents to the right analyst automatically.',
              '',
              'Change status: click Add action > Change status > select Active, Closed, or In Progress. Example: auto-close informational incidents.',
              '',
              'Change severity: click Add action > Change severity > select High, Medium, Low, or Informational. Use to normalise severity from noisy rules.',
              '',
              'Add tags: click Add action > Add tags > type a tag name and press Enter (e.g., AutoProcessed, NeedsReview). Tags appear in the incident list for filtering.',
              '',
              'Run playbook: click Add action > Run playbook > click the dropdown and select your playbook from the list. If no playbooks appear, check that the playbook was created with the Sentinel incident trigger and has Sentinel Responder permissions.',
              '',
              'You can add multiple actions in sequence — they run in the order listed',
              'Use the six-dot drag handles on the left of each action to reorder them',
            ]
          },
          {
            title: 'Set rule order and expiration',
            steps: [
              'Order: set a number from 1–1000 (lower numbers run first when multiple rules match the same incident)',
              'Recommended: use multiples of 10 (10, 20, 30) so you can insert rules between existing ones later',
              'Status: ensure Enabled is selected so the rule is active immediately',
              'Expiration: optionally set an end date if the rule is temporary (e.g., for a security incident response period)',
              'Click Apply to save the automation rule',
              'The rule appears in the Automation rules list and begins triggering on matching incidents immediately',
            ],
            tip: 'Set rule order carefully. If two rules match the same incident, the lower order number runs first. If an earlier rule changes a property that a later rule checks, the later rule may not match as expected.'
          }
        ]
      },
      {
        title: 'Phase 4: Test the Automation Rule',
        icon: <Terminal size={16} />,
        steps: [
          {
            title: 'Verify the rule triggers correctly',
            steps: [
              'Navigate to Sentinel > Incidents to see your active incidents',
              'Create a test incident or wait for a real incident matching your conditions to arrive',
              'Click on the incident and check the Activity log tab — you should see an entry showing which automation rules ran and what actions were taken',
              'If a playbook was triggered, click on the playbook name in the activity log to go directly to its run history',
              'In the Logic App run history, verify each step completed successfully (green ticks)',
              'If the rule did not fire, check: incident severity matches conditions, rule is Enabled, rule order allows it to run',
              'To test a playbook action without waiting for a real incident: go to Automation > Playbooks tab > find your playbook > click Run > select a test incident',
            ]
          }
        ]
      }
    ],
    tips: [
      'Use automation rules to triage noise first: auto-close or reduce severity of known-good false positives before analysts see them',
      'Create a tag like "Triaged-Auto" on automated actions so analysts know a rule already ran',
      'Combine multiple conditions with AND logic to be precise — overly broad rules create unnecessary playbook executions',
      'Use the Incident Updated trigger sparingly — it fires on every change including when you manually edit an incident',
      'Test rules with a low-priority test incident before applying to production high-severity rules',
      'Review automation rule effectiveness monthly: check how many incidents each rule matched in the past 30 days',
    ]
  },
  {
    id: 'analytic',
    name: 'Analytic Rule',
    subtitle: 'Custom threat detection with KQL',
    icon: <Search size={20} />,
    color: '#8b5cf6',
    description: 'Analytic rules are the core detection engine of Microsoft Sentinel. They run KQL queries on a schedule against your Log Analytics data, and when results are returned, they create alerts and incidents. Custom analytic rules let you detect threats specific to your environment.',
    docUrl: 'https://learn.microsoft.com/en-us/azure/sentinel/detect-threats-custom',
    estimatedTime: '30–60 minutes per rule',
    prereqs: [
      'Active Microsoft Sentinel workspace with relevant data sources connected and ingesting',
      'Microsoft Sentinel Contributor role to create and manage analytic rules',
      'A working KQL query that returns the events you want to detect (test in Logs first)',
      'Understanding of the data schema for the tables your query uses (e.g., SigninLogs, SecurityEvent, AuditLogs)',
      'Knowledge of MITRE ATT&CK framework tactics and techniques for rule classification (optional but recommended)',
    ],
    phases: [
      {
        title: 'Phase 1: Design and Test Your KQL Query',
        icon: <Terminal size={16} />,
        steps: [
          {
            title: 'Write and validate the detection query in Logs',
            steps: [
              'Before creating the rule, go to Microsoft Sentinel > Logs',
              'Write and test your KQL query here until it returns the expected results',
              'Example — detecting multiple failed sign-in attempts (brute force):',
              'SigninLogs',
              '| where TimeGenerated > ago(1h)',
              '| where ResultType != "0"',
              '| summarize FailureCount = count(), DistinctIPs = dcount(IPAddress) by UserPrincipalName, bin(TimeGenerated, 5m)',
              '| where FailureCount > 10',
              '| extend AlertDetail = strcat("User: ", UserPrincipalName, " failed ", FailureCount, " times from ", DistinctIPs, " IPs")',
              'Verify: the query returns rows when there are brute force attempts, and returns nothing during normal operations',
              'Click Run and review results to ensure the data is as expected',
              'Note down the field names that identify the entity: UserPrincipalName is the account entity here',
              'Adjust thresholds and time windows until the query detects real threats without too many false positives',
            ],
            warning: 'Do not include | take or | limit in your analytic rule query — these cap results and may cause you to miss incidents. Remove any limit statements before using the query in a rule.'
          }
        ]
      },
      {
        title: 'Phase 2: Create the Analytic Rule',
        icon: <Shield size={16} />,
        steps: [
          {
            title: 'Open the Analytics rule creation wizard',
            steps: [
              'In Microsoft Sentinel, click Analytics in the left navigation under Configuration',
              'The Analytics page shows all active, disabled, and template rules',
              'Click + Create at the top left',
              'Select Scheduled query rule (the most common type for custom detections)',
              'The Create analytic rule wizard opens with 5 tabs: General, Set rule logic, Incident settings, Automated response, Review and create',
            ]
          },
          {
            title: 'Fill in the General tab',
            steps: [
              'Name: enter a clear descriptive name (e.g., Brute Force Attack - Multiple Failed Sign-ins)',
              'Description: describe what the rule detects, why it matters, and any known false positives. Example: Detects when a single account has more than 10 failed authentication attempts within a 5-minute window, indicating potential brute force or password spray.',
              'Severity: select the appropriate severity:',
              '  High → attacks likely in progress, immediate response needed',
              '  Medium → suspicious activity requiring investigation',
              '  Low → informational, worth reviewing',
              '  Informational → baseline/audit events with no immediate threat',
              'MITRE ATT&CK:',
              '  Tactic: click the dropdown and select the MITRE tactic (e.g., Credential Access)',
              '  Technique: select the specific technique (e.g., T1110 - Brute Force)',
              '  Sub-technique: optionally select a sub-technique (e.g., T1110.001 - Password Guessing)',
              'Status: leave as Enabled to activate the rule immediately',
              'Click Next: Set rule logic',
            ]
          },
          {
            title: 'Set rule logic',
            steps: [
              'Rule query: paste your tested KQL query from Logs into the large text box',
              'Remove any time filters using ago() from the query — Sentinel adds its own time window',
              'Replace | where TimeGenerated > ago(1h) with: the lookback period is configured below',
              'Map entities (CRITICAL — this links alerts to user, IP, host entities in Sentinel):',
              '  Click + Add new entity mapping',
              '  Entity type: select Account',
              '  Identifier: select UPN (UserPrincipalName)',
              '  Field: select UserPrincipalName from your query results columns',
              '  Add another entity: Entity type = IP, Identifier = Address, Field = IPAddress',
              '  Proper entity mapping enables investigation in the Entity behaviour and UEBA features',
              'Query scheduling:',
              '  Run query every: set to 5 Minutes (for near real-time detection) or up to 14 Days for less time-sensitive rules',
              '  Lookup data from the last: set the lookback window. For the brute force example, set 1 Hour',
              '  Note: lookup window must be >= the run frequency',
              'Alert threshold:',
              '  Generate alert when: set to Is greater than 0',
              '  This means any row returned by your query creates an alert',
              '  If your query already summarises and filters (like the brute force example), leave threshold at 0',
              'Event grouping:',
              '  Group all events into a single alert: combines all query result rows into one alert (recommended for aggregated queries)',
              '  Trigger an alert for each event: creates one alert per result row (use for raw event detection)',
              'Results simulation:',
              '  Click Test with current data to run the query and preview results — verify it returns data',
              'Click Next: Incident settings',
            ]
          },
          {
            title: 'Configure Incident settings',
            steps: [
              'Incident creation:',
              '  Enable: Enabled — this creates incidents from alerts (enabled by default)',
              '  If disabled, alerts are created but not grouped into incidents (useful for high-volume informational rules)',
              'Alert grouping:',
              '  Group related alerts into a single incident: toggle to Enabled (recommended)',
              '  Group alerts triggered within the last: set a time window (e.g., 5 hours)',
              '  This prevents alert storms from creating hundreds of separate incidents',
              'Grouping key: select how alerts are grouped:',
              '  Grouping based on selected entities and details: recommended — groups alerts affecting the same user or IP',
              '  From the dropdown, select Account and/or IP as the grouping entities',
              '  This means multiple brute force alerts against the same user are grouped into one incident',
              'Re-open closed incidents: toggle On to re-open an incident if new matching alerts arrive within the grouping window',
              'Click Next: Automated response',
            ]
          },
          {
            title: 'Configure Automated response',
            steps: [
              'Alert automation (runs when an alert is created): click + Add and select a playbook to run on each alert',
              'Incident automation (runs when an incident is created): this references your automation rules created separately',
              'For now, leave these blank or select an appropriate notification playbook',
              'Note: automation rules (created under Sentinel > Automation) are preferred over alert-level playbooks for most use cases',
              'Click Next: Review and create',
            ]
          }
        ]
      },
      {
        title: 'Phase 3: Review, Save and Monitor',
        icon: <CheckCircle size={16} />,
        steps: [
          {
            title: 'Review and create the rule',
            steps: [
              'On the Review and create tab, read through all the settings you configured',
              'Check: Rule name, Severity, MITRE tactics, Query, Run frequency, Lookback window, Entity mapping, Incident creation, Alert grouping',
              'If anything needs correcting, click Back to return to that tab',
              'Click Save to create the rule',
              'The rule appears in the Analytics list with an Active status',
              'The first run will occur within one run-frequency interval (e.g., within 5 minutes for a 5-minute rule)',
            ]
          },
          {
            title: 'Monitor rule performance',
            steps: [
              'After the rule has been running for 24 hours, check its performance',
              'Navigate to Analytics and find your rule in the list',
              'The Last run column shows when it last executed',
              'The Alerts column shows how many alerts it has generated',
              'Click on the rule name > View > Incidents to see incidents it has created',
              'If the rule generates too many false positives: click Edit > Set rule logic > adjust thresholds or add exclusion filters (e.g., | where UserPrincipalName !in ("service_account@company.com", "svc-backup@company.com"))',
              'If the rule is not firing when expected: check the query in Logs with the same time window to verify data exists',
              'Navigate to Incidents and filter by the rule name to review all incidents it has created',
            ],
            tip: 'After creating a rule, simulate a detection by finding a past event in your logs that would trigger the rule and verify an incident was created. If the lookback window includes that event and the rule is enabled, an incident should appear within one run cycle.'
          }
        ]
      }
    ],
    tips: [
      'Always test the full KQL query in Logs before creating the rule — save time by catching errors early',
      'Remove ago() time filters from your query before pasting it into the rule — use the Lookback period setting instead',
      'Entity mapping is critical — without it, Sentinel cannot correlate this rule\'s alerts with other incidents involving the same user or IP',
      'Start rules with a high threshold to reduce false positives, then lower it gradually as you tune',
      'Use the Simulation feature in Set rule logic to test the query against real data before saving',
      'Create a duplicate of existing built-in templates (Click duplicate on any template rule) and modify it rather than writing from scratch',
      'Check the Sentinel GitHub repository at aka.ms/sentinelgithub for hundreds of community-contributed analytic rules',
      'Schedule high-confidence rules to run every 5 minutes, and broad/noisy rules to run every 1 hour to reduce resource consumption',
    ]
  }
];

// ── Sub-components ──────────────────────────────────────────────────────────
function StepSection({ section, index }: { section: Step; index: number }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 mb-2 w-full text-left group">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 text-white"
          style={{ background: 'var(--acc)' }}>{index + 1}</div>
        <span className="text-sm font-semibold flex-1" style={{ color: 'var(--text)' }}>{section.title}</span>
        {open
          ? <ChevronDown size={13} style={{ color: 'var(--text3)' }} />
          : <ChevronRight size={13} style={{ color: 'var(--text3)' }} />}
      </button>
      {open && (
        <div className="ml-8 space-y-1.5">
          {section.steps.map((step, i) => {
            if (!step.trim()) return <div key={i} className="h-1" />;
            const isCommand = step.startsWith('|') || step.startsWith('SigninLogs') || step.startsWith('SecurityEvent') || step.startsWith('_Get') || step.startsWith('let ');
            if (isCommand) {
              return (
                <div key={i} className="rounded-md px-3 py-1.5 font-mono text-[11px] leading-relaxed"
                  style={{ background: 'var(--code-bg)', color: '#10b981', border: '1px solid var(--border)' }}>
                  {step}
                </div>
              );
            }
            const isArrow = step.trim().startsWith('→') || step.trim().startsWith('  →');
            const isSubBullet = step.startsWith('  ');
            return (
              <div key={i} className={`flex gap-2 text-xs ${isSubBullet ? 'ml-4' : ''}`} style={{ color: isArrow ? 'var(--acc2)' : 'var(--text2)' }}>
                {!isSubBullet && <span className="font-mono flex-shrink-0 mt-0.5" style={{ color: 'var(--acc)' }}>{String(i + 1).padStart(2, '0')}.</span>}
                {isSubBullet && <span className="flex-shrink-0 mt-0.5" style={{ color: 'var(--text3)' }}>›</span>}
                <span className="leading-relaxed">{step.trim()}</span>
              </div>
            );
          })}
          {section.warning && (
            <div className="flex gap-2 mt-2 p-2.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5 text-red-400" />
              <span className="text-xs leading-relaxed text-red-400">{section.warning}</span>
            </div>
          )}
          {section.note && (
            <div className="flex gap-2 mt-2 p-2.5 rounded-lg" style={{ background: 'rgba(217,134,28,0.08)', border: '1px solid rgba(217,134,28,0.2)' }}>
              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--acc)' }} />
              <span className="text-xs leading-relaxed" style={{ color: 'var(--acc)' }}>{section.note}</span>
            </div>
          )}
          {section.tip && (
            <div className="flex gap-2 mt-2 p-2.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle size={12} className="flex-shrink-0 mt-0.5 text-emerald-400" />
              <span className="text-xs leading-relaxed text-emerald-400">{section.tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PhaseCard({ phase }: { phase: Guide['phases'][0] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        style={{ background: 'var(--bg3)' }}>
        <span style={{ color: 'var(--acc)' }}>{phase.icon}</span>
        <span className="font-semibold text-sm flex-1" style={{ color: 'var(--text)' }}>{phase.title}</span>
        {open ? <ChevronDown size={14} style={{ color: 'var(--text3)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text3)' }} />}
      </button>
      {open && (
        <div className="p-4" style={{ background: 'var(--card-bg)' }}>
          {phase.steps.map((section, i) => <StepSection key={i} section={section} index={i} />)}
        </div>
      )}
    </div>
  );
}

function GuideView({ guide }: { guide: Guide }) {
  const [tab, setTab] = useState<'steps' | 'prereqs' | 'tips'>('prereqs');
  const TABS = [
    { id: 'prereqs' as const, label: 'Prerequisites' },
    { id: 'steps' as const, label: 'Step-by-Step Guide' },
    { id: 'tips' as const, label: 'Best Practices' },
  ];
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="px-5 py-4" style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${guide.color}20`, color: guide.color, border: `1px solid ${guide.color}40` }}>
              {guide.icon}
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>How to create a {guide.name}</div>
              <div className="text-xs" style={{ color: 'var(--text3)' }}>{guide.subtitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-1 rounded-full font-mono" style={{ background: 'var(--bg3)', color: 'var(--text2)' }}>
              <Clock size={9} className="inline mr-1" />{guide.estimatedTime}
            </span>
            <a href={guide.docUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full"
              style={{ background: `${guide.color}15`, color: guide.color, border: `1px solid ${guide.color}30` }}>
              <ExternalLink size={9} /> Docs
            </a>
          </div>
        </div>
        <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--text2)' }}>{guide.description}</p>
      </div>

      {/* Tab bar */}
      <div className="flex" style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 text-xs py-2.5 font-semibold transition-colors"
            style={{
              borderBottom: tab === t.id ? `2px solid ${guide.color}` : '2px solid transparent',
              color: tab === t.id ? guide.color : 'var(--text3)',
              background: tab === t.id ? `${guide.color}08` : 'transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4" style={{ background: 'var(--card-bg)' }}>
        {tab === 'prereqs' && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>
              Verify all prerequisites before starting
            </div>
            <div className="space-y-2">
              {guide.prereqs.map((p, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <CheckCircle size={13} className="flex-shrink-0 mt-0.5" style={{ color: guide.color }} />
                  <span className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'steps' && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>
              Complete phases in order
            </div>
            {guide.phases.map((phase, i) => <PhaseCard key={i} phase={phase} />)}
          </div>
        )}
        {tab === 'tips' && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>
              Recommendations from Microsoft and the security community
            </div>
            <div className="space-y-2">
              {guide.tips.map((tip, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <CheckCircle size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                  <span className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export function SentinelPage() {
  const [active, setActive] = useState('playbook');
  const guide = GUIDES.find(g => g.id === active)!;

  return (
    <div>
      {/* Guide selector */}
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-5">
        {GUIDES.map(g => (
          <button key={g.id} onClick={() => setActive(g.id)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all"
            style={{
              background: active === g.id ? `${g.color}15` : 'var(--card-bg)',
              border: active === g.id ? `2px solid ${g.color}` : '1px solid var(--border)',
            }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${g.color}20`, color: g.color }}>
              {g.icon}
            </div>
            <div className="text-[11px] font-semibold leading-tight"
              style={{ color: active === g.id ? g.color : 'var(--text)' }}>
              {g.name}
            </div>
          </button>
        ))}
      </div>

      <GuideView guide={guide} />
    </div>
  );
}
