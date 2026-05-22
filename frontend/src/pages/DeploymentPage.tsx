import { useState } from 'react';
import {
  Shield, Cloud, Wifi, AppWindow,
  CheckCircle, AlertTriangle, ChevronDown, ChevronRight,
  ExternalLink, Monitor, Server, Globe, Lock, Users, Database
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
interface Step {
  title: string;
  steps: string[];
  note?: string;
}
interface Prereq {
  icon: React.ReactNode;
  label: string;
  detail: string;
}
interface Product {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  docUrl: string;
  prerequisites: Prereq[];
  phases: { title: string; icon: React.ReactNode; steps: Step[] }[];
  postDeployment: string[];
  estimatedTime: string;
  licenseRequired: string;
}

// ── Deployment data ────────────────────────────────────────────────────────
const PRODUCTS: Product[] = [
  {
    id: 'identity',
    name: 'Defender for Identity',
    subtitle: 'Active Directory threat detection',
    icon: <Shield size={22} />,
    color: '#d9861c',
    description: 'Microsoft Defender for Identity (formerly Azure Advanced Threat Protection) monitors your on-premises Active Directory, detecting advanced threats, compromised identities, and malicious insider actions.',
    docUrl: 'https://learn.microsoft.com/en-us/defender-for-identity/deploy/deploy-defender-identity',
    estimatedTime: '4–8 hours',
    licenseRequired: 'Microsoft 365 E5, EMS E5, or Defender for Identity standalone',
    prerequisites: [
      { icon: <Server size={14}/>, label: 'Domain Controllers', detail: 'Windows Server 2012 R2 or later. Sensor must be installed on ALL DCs, ADFS servers, ADCS servers, and Entra Connect servers.' },
      { icon: <Monitor size={14}/>, label: 'Hardware per sensor', detail: 'Minimum: 2-core CPU, 6 GB RAM, 10 GB disk. Recommended: 4-core CPU, 8 GB RAM, 10 GB disk. .NET Framework 4.7 or later required.' },
      { icon: <Globe size={14}/>, label: 'Network connectivity', detail: 'Sensors must reach *.atp.azure.com on port 443 (HTTPS). URL: yourtenant.atp.azure.com. Proxy configuration supported.' },
      { icon: <Lock size={14}/>, label: 'Directory Service Account', detail: 'Create a dedicated AD user account (not admin). Read-only access to all objects in monitored domains. Required for LDAP queries and entity resolution.' },
      { icon: <Users size={14}/>, label: 'Admin permissions', detail: 'Global Administrator or Security Administrator in Microsoft Entra ID to create the MDI workspace. Local Administrator on each server to install the sensor.' },
      { icon: <Database size={14}/>, label: 'Ports to open', detail: 'Inbound on DCs: Port 135 (RPC), 137 (NetBIOS), 389 (LDAP), 636 (LDAPS), 3268 (GC LDAP), 445 (SMB), 88 (Kerberos). Outbound: 443 to Azure.' },
    ],
    phases: [
      {
        title: 'Phase 1: Create the MDI Workspace',
        icon: <Globe size={16}/>,
        steps: [
          {
            title: 'Access the Defender portal',
            steps: [
              'Open a browser and navigate to https://security.microsoft.com',
              'Sign in with a Global Administrator or Security Administrator account',
              'In the left navigation pane, expand the Settings section at the bottom',
              'Click on Identities under the Settings menu',
            ]
          },
          {
            title: 'Create workspace and configure settings',
            steps: [
              'Click Get started on the Defender for Identity overview page',
              'The workspace is automatically provisioned in your nearest Azure region',
              'Wait 2–3 minutes for provisioning to complete — you will see a confirmation banner',
              'Once provisioned, you are redirected to the Sensors page under Settings > Identities',
              'Note your workspace URL in the format: yourtenant.atp.azure.com (shown on the page)',
            ]
          },
          {
            title: 'Configure Directory Service Account',
            steps: [
              'In the Defender portal, navigate to Settings > Identities > Directory Service Accounts',
              'Click Add credentials',
              'Select Account type: Active Directory user (standard account, not gMSA initially)',
              'Enter the Domain, Username, and Password of your dedicated DSA account',
              'For the DSA, create a standard AD user: New-ADUser -Name "MDI-DSA" -SamAccountName "MDI-DSA" -PasswordNeverExpires $true -Enabled $true',
              'Grant the DSA read access: In Active Directory Users and Computers, enable Advanced Features under View',
              'Right-click the domain root > Properties > Security > Add the MDI-DSA account with Read permission',
              'Click Save in the Defender portal after entering credentials',
            ]
          }
        ]
      },
      {
        title: 'Phase 2: Download and Deploy Sensors',
        icon: <Server size={16}/>,
        steps: [
          {
            title: 'Download the sensor installer',
            steps: [
              'In the Defender portal, go to Settings > Identities > Sensors',
              'Click Add sensor at the top right of the page',
              'In the Add sensor panel, click Download installer',
              'The file Azure ATP Sensor Setup.zip is downloaded (~300 MB)',
              'IMPORTANT: Also copy the Access key shown on this page — you need it for installation',
              'Extract the ZIP file to a shared folder accessible from all DCs, or copy to each DC individually',
            ]
          },
          {
            title: 'Install sensor on each Domain Controller',
            steps: [
              'Log in to the Domain Controller with a local Administrator account',
              'Copy the extracted sensor setup files to the DC (e.g., to C:\\MDISensorSetup\\)',
              'Open an elevated command prompt (Run as Administrator)',
              'Navigate to the folder: cd C:\\MDISensorSetup\\',
              'Run the installer: .\\Azure ATP Sensor Setup.exe',
              'In the Setup Wizard, click Next on the welcome screen',
              'Review the licence agreement, check I accept, and click Next',
              'In the Installation folder field, keep the default (C:\\Program Files\\Azure Advanced Threat Protection Sensor\\) or change it',
              'In the Access key field, paste the Access key you copied from the portal',
              'Click Install and wait for installation to complete (5–10 minutes)',
              'Click Finish when the wizard completes',
              'The Azure Advanced Threat Protection Sensor service will start automatically',
            ]
          },
          {
            title: 'Silent installation via command line (for multiple DCs)',
            steps: [
              'For automated deployment, run: .\\Azure ATP Sensor Setup.exe /quiet NetFrameworkCommandLineArguments="/q" AccessKey="<paste-your-access-key>"',
              'Use this command in a deployment script, SCCM, or Intune Remediation script',
              'Verify installation by running: Get-Service "AATPSensor" on each DC',
            ],
            note: 'Deploy to ALL Domain Controllers, ADFS servers, ADCS servers, and Entra Connect (AAD Connect) servers for full coverage.'
          }
        ]
      },
      {
        title: 'Phase 3: Verify and Configure',
        icon: <CheckCircle size={16}/>,
        steps: [
          {
            title: 'Verify sensor health in the portal',
            steps: [
              'In the Defender portal, go to Settings > Identities > Sensors',
              'Each installed sensor should appear in the list within 5 minutes',
              'Check the Status column — it should show Running (green)',
              'Check the Version column to confirm the latest sensor version is installed',
              'Click on a sensor name to see detailed health information',
              'Verify the Domain name shown matches your Active Directory domain',
              'If a sensor shows Stopped or an error, check the Event Viewer on that server under Applications and Services Logs > Microsoft > Windows > AATPSensor',
            ]
          },
          {
            title: 'Configure notification settings',
            steps: [
              'In the Defender portal, go to Settings > Identities > Notifications and reports',
              'Click Health issues — enter email addresses for sensor health alerts',
              'Click Alerts — configure email alerts for high/medium severity alerts',
              'Consider configuring a Syslog server if you use a SIEM',
            ]
          },
          {
            title: 'Configure honeytoken accounts',
            steps: [
              'In the Defender portal, go to Settings > Identities > Entity tags',
              'Click Honeytoken and then Add',
              'Select accounts that should never be used in normal operations — any authentication against them triggers an alert',
              'Recommended: create a dedicated decoy account (e.g., svc-legacy-backup) and tag it here',
            ]
          },
          {
            title: 'Review initial detections',
            steps: [
              'Navigate to Incidents & alerts > Alerts in the Defender portal',
              'Filter by Detection source = Defender for Identity',
              'Initial alerts typically appear within 24 hours as MDI learns your environment',
              'Navigate to Identities > Health issues to check for any configuration warnings',
              'Visit Identities > Lateral movement paths to see potential attack paths in your environment',
            ]
          }
        ]
      }
    ],
    postDeployment: [
      'Wait 48 hours for MDI to learn your environment baseline before tuning alerts',
      'Review and tune exclusions in Settings > Identities > Exclusions for known false positives',
      'Integrate with Microsoft Sentinel via the Defender for Identity data connector',
      'Enable integration with Defender for Endpoint for correlated detections',
      'Schedule monthly review of Lateral Movement Paths report',
      'Configure Privileged Identity Management (PIM) based on MDI privileged account discoveries',
      'Review the Security Assessment recommendations at security.microsoft.com > Secure Score',
    ]
  },
  {
    id: 'cloud',
    name: 'Defender for Cloud',
    subtitle: 'Cloud workload protection & CSPM',
    icon: <Cloud size={22} />,
    color: '#0ea5e9',
    description: 'Microsoft Defender for Cloud provides unified security management and threat protection for cloud workloads across Azure, AWS, GCP, and hybrid environments. It includes Cloud Security Posture Management (CSPM) and Cloud Workload Protection (CWP).',
    docUrl: 'https://learn.microsoft.com/en-us/azure/defender-for-cloud/get-started',
    estimatedTime: '2–4 hours initial, ongoing for full coverage',
    licenseRequired: 'Azure subscription required. CSPM (foundational) is free. Defender plans are paid per resource.',
    prerequisites: [
      { icon: <Globe size={14}/>, label: 'Azure subscription', detail: 'Active Azure subscription with Owner or Contributor role. For Management Group deployment, Owner on the Management Group is required.' },
      { icon: <Users size={14}/>, label: 'Required roles', detail: 'Security Admin or Security Reader role on the subscription to view recommendations. Contributor to enable Defender plans. Owner to assign policies.' },
      { icon: <Server size={14}/>, label: 'Azure Arc (for hybrid)', detail: 'For on-premises and multi-cloud servers, Azure Arc must be deployed. Download Arc agent from Azure portal > Azure Arc > Servers > Add.' },
      { icon: <Database size={14}/>, label: 'Log Analytics workspace', detail: 'Create a Log Analytics workspace in the same region as your resources. Used by the monitoring agent for data collection. Note the workspace ID and key.' },
      { icon: <Monitor size={14}/>, label: 'Supported resource types', detail: 'Servers (Windows/Linux), SQL databases, Storage accounts, Containers (AKS), App Service, Key Vault, ARM, DNS, Resource Manager.' },
      { icon: <Lock size={14}/>, label: 'Azure Policy', detail: 'Defender for Cloud uses Azure Policy for enforcement. Ensure Azure Policy is not blocked by existing policies in your tenant.' },
    ],
    phases: [
      {
        title: 'Phase 1: Enable Defender for Cloud',
        icon: <Cloud size={16}/>,
        steps: [
          {
            title: 'Access Defender for Cloud',
            steps: [
              'Open the Azure portal at https://portal.azure.com',
              'Sign in with an account that has Owner or Security Admin role on the subscription',
              'In the search bar at the top, type Defender for Cloud and press Enter',
              'Click on Microsoft Defender for Cloud in the search results',
              'If this is your first visit, you will see a Getting started page',
              'Click Upgrade on the Getting started page to enable enhanced features, or click Skip for free tier only',
            ]
          },
          {
            title: 'Enable Defender plans on your subscription',
            steps: [
              'In the Defender for Cloud left menu, click Environment settings',
              'Expand the tree and click on your Azure subscription name',
              'You will see the Defender plans page showing all available plan categories',
              'Review each plan: Servers, Databases, Storage, Containers, App Service, Key Vault, APIs, Resource Manager, DNS',
              'For each plan you want to enable, toggle the switch from Off to On',
              'Recommended starting set: Enable Servers (Plan 2 for EDR integration), Databases, Storage, Key Vault, and Resource Manager',
              'Click Save at the top of the page after enabling your selected plans',
              'Note: Each plan has a per-resource cost — review pricing at aka.ms/mdcpricing before enabling',
            ]
          },
          {
            title: 'Configure auto-provisioning (monitoring agents)',
            steps: [
              'In Environment settings for your subscription, click Auto provisioning in the left menu',
              'Enable Log Analytics agent/Azure Monitor Agent toggle to On',
              'Select Use workspace(s) created by Defender for Cloud (auto) or choose a custom Log Analytics workspace',
              'Enable Vulnerability assessment for machines toggle — select Microsoft Defender Vulnerability Management (recommended)',
              'Enable Guest Configuration agent if you want OS-level compliance assessment',
              'Click Save to apply auto-provisioning settings',
              'New VMs will automatically have the agent deployed; existing VMs can be onboarded manually',
            ]
          }
        ]
      },
      {
        title: 'Phase 2: Connect Multi-Cloud and Hybrid',
        icon: <Globe size={16}/>,
        steps: [
          {
            title: 'Connect AWS account',
            steps: [
              'In Defender for Cloud, click Environment settings in the left menu',
              'Click Add environment at the top, then select Amazon Web Services',
              'Enter an account name (e.g., "Production AWS"), select the Azure subscription to bill against, and choose the region',
              'Click Next: Select plans and choose which AWS Defender plans to enable',
              'Click Next: Configure access — you will need to create an AWS CloudFormation stack',
              'Click Download the CloudFormation template to download the CFT file',
              'Log in to your AWS Management Console at console.aws.amazon.com',
              'Navigate to CloudFormation > Stacks > Create stack > With new resources',
              'Upload the downloaded template file and click Next',
              'Give the stack a name (e.g., DefenderForCloudConnector) and click Next > Submit',
              'Wait for the stack to complete (status: CREATE_COMPLETE), then return to the Azure portal',
              'Click Next: Review and create, then Create',
            ]
          },
          {
            title: 'Connect GCP project',
            steps: [
              'In Environment settings, click Add environment > Google Cloud Platform',
              'Enter the project name, select subscription and resource group',
              'Click Next: Select plans and enable desired GCP Defender plans',
              'Click Next: Configure access — follow instructions to run a gcloud script in Cloud Shell',
              'Open Google Cloud Shell at shell.cloud.google.com',
              'Paste and run each gcloud command shown in the wizard',
              'Return to Azure portal and click Next: Review and create > Create',
            ]
          },
          {
            title: 'Onboard on-premises servers via Azure Arc',
            steps: [
              'In the Azure portal, search for Azure Arc and navigate to Servers',
              'Click Add > Add a single server (or multiple servers for bulk)',
              'Select the subscription, resource group, region, and OS type',
              'Click Next: Tags and add any relevant tags',
              'Click Next: Download and run script',
              'Copy the generated script (PowerShell for Windows, Shell for Linux)',
              'On each on-premises server, run the script in an elevated session',
              'The script installs the Azure Connected Machine Agent and registers the server',
              'Verify the server appears in Azure Arc > Servers with status Connected',
              'Return to Defender for Cloud — Arc-connected servers now appear in recommendations',
            ]
          }
        ]
      },
      {
        title: 'Phase 3: Security Posture & Recommendations',
        icon: <CheckCircle size={16}/>,
        steps: [
          {
            title: 'Review Secure Score and recommendations',
            steps: [
              'In Defender for Cloud, click Recommendations in the left menu',
              'Review your Secure Score percentage at the top of the page',
              'Recommendations are grouped by Security controls — expand each control to see individual items',
              'Click on a recommendation to see affected resources, remediation steps, and impact on Secure Score',
              'Use the Filter button to filter by severity (High/Medium/Low), environment, or resource type',
              'Click Fix on supported recommendations for automated remediation where available',
              'For manual recommendations, follow the detailed remediation steps provided',
            ]
          },
          {
            title: 'Configure regulatory compliance',
            steps: [
              'In Defender for Cloud, click Regulatory compliance in the left menu',
              'By default, the Microsoft Cloud Security Benchmark is applied',
              'Click Manage compliance policies to add additional standards',
              'Click Add more standards and select from: ISO 27001, NIST SP 800-53, PCI DSS, SOC 2, CIS, GDPR, and more',
              'Click Add to add the standard — assessments appear within 24 hours',
              'Use the Download report button to generate compliance reports for auditors',
            ]
          },
          {
            title: 'Configure email notifications and alerts',
            steps: [
              'In Environment settings, click Email notifications under your subscription',
              'Enter email addresses for security alert notifications',
              'Select severity levels: enable All high severity alerts as minimum',
              'Enable Weekly digest for a summary email',
              'Click Save',
              'For real-time SIEM integration, navigate to Security alerts > Export and configure continuous export to Log Analytics or Event Hub',
            ]
          }
        ]
      }
    ],
    postDeployment: [
      'Set a target Secure Score improvement goal — aim for 10-point increase per quarter',
      'Create a remediation backlog in your issue tracker based on High severity recommendations',
      'Configure Workflow automation to auto-create tickets in ServiceNow/Jira for new High alerts',
      'Enable Microsoft Sentinel data connector for Defender for Cloud alerts',
      'Review the Attack path analysis page to find critical risk paths',
      'Set up DevSecOps integration by connecting Azure DevOps or GitHub repositories',
      'Schedule weekly review of new recommendations using the Defender for Cloud workbook in Azure Monitor',
    ]
  },
  {
    id: 'iot',
    name: 'Defender for IoT',
    subtitle: 'OT & IoT network security monitoring',
    icon: <Wifi size={22} />,
    color: '#10b981',
    description: 'Microsoft Defender for IoT provides agentless network monitoring for OT/ICS environments and IoT devices. It passively analyses network traffic to discover devices, detect threats, and provide vulnerability management without impacting operational technology.',
    docUrl: 'https://learn.microsoft.com/en-us/azure/defender-for-iot/organizations/getting-started',
    estimatedTime: '1–3 days for OT deployment, 1–2 hours for Enterprise IoT',
    licenseRequired: 'Microsoft 365 E5 or Defender for IoT license. OT sites licensed per committed device count.',
    prerequisites: [
      { icon: <Server size={14}/>, label: 'Network sensor hardware', detail: 'Physical or virtual appliance for OT networks. Recommended: Dell PowerEdge or Lenovo certified appliances. Virtual: 4-core CPU, 8 GB RAM, 100 GB disk, 2 NICs minimum.' },
      { icon: <Wifi size={14}/>, label: 'SPAN/TAP port', detail: 'Configure a SPAN (Switch Port ANalyzer) or network TAP on managed switches to mirror OT/ICS traffic to the sensor monitoring interface. This is passive monitoring only — no traffic injection.' },
      { icon: <Globe size={14}/>, label: 'Management connectivity', detail: 'Sensor management interface needs connectivity to portal.azure.com on port 443. OT monitoring interface is passive — no internet required for traffic analysis.' },
      { icon: <Users size={14}/>, label: 'Azure permissions', detail: 'Contributor role on the Azure subscription where Defender for IoT is enabled. Security Admin role to view alerts in the Defender portal.' },
      { icon: <Database size={14}/>, label: 'Network segments to monitor', detail: 'Identify all OT/ICS network segments: SCADA, DCS, PLCs, HMIs, engineering workstations. Plan one sensor per network segment (or VLAN) that cannot route to others.' },
      { icon: <Lock size={14}/>, label: 'Enterprise IoT (optional)', detail: 'For Enterprise IoT (office/campus IoT devices), Defender for Endpoint Plan 2 must already be deployed. No additional sensor hardware required.' },
    ],
    phases: [
      {
        title: 'Phase 1: Activate Defender for IoT in Azure',
        icon: <Globe size={16}/>,
        steps: [
          {
            title: 'Enable Defender for IoT',
            steps: [
              'Navigate to the Azure portal at https://portal.azure.com',
              'In the search bar, type Defender for IoT and select it from the results',
              'Click Get started on the overview page',
              'Select your Azure subscription from the dropdown',
              'Choose the pricing plan: Enterprise IoT (for office IoT) or OT Plan (for operational technology)',
              'For OT networks, click Pricing and select the number of committed devices (choose your expected device count — you can adjust later)',
              'Click Save to activate the plan',
            ]
          },
          {
            title: 'Create an OT site and sensor',
            steps: [
              'In Defender for IoT, click Sites and sensors in the left menu',
              'Click Create site at the top',
              'Enter a Site name (e.g., "Manufacturing Plant 1") and select the site type: Manufacturing, Energy, Corporate, or Custom',
              'Select a Display language and timezone for the site',
              'Click Create site',
              'Within the site, click Add sensor',
              'Enter a Sensor name (e.g., "OT-Sensor-Floor1")',
              'Select Sensor type: Cloud connected (recommended) for Azure-integrated monitoring, or Locally managed for air-gapped environments',
              'Select the sensor version matching your planned deployment',
              'Click Register — you will receive an Activation file download prompt',
              'Download the activation file (.zip) — this is required during sensor setup',
            ]
          }
        ]
      },
      {
        title: 'Phase 2: Deploy and Configure the OT Sensor',
        icon: <Server size={16}/>,
        steps: [
          {
            title: 'Install sensor software (virtual appliance)',
            steps: [
              'Download the OT sensor ISO from the Defender for IoT portal: Sites and sensors > your sensor > Download software',
              'Select the sensor version and click Download ISO',
              'On your virtualisation host (Hyper-V, VMware, or KVM), create a new VM with: 4 vCPUs, 8 GB RAM, 100 GB disk, 2 network adapters',
              'Mount the downloaded ISO and boot the VM from it',
              'At the installation screen, select Install Sensor from the menu using arrow keys',
              'Follow the on-screen prompts to select disk and confirm installation',
              'The installation takes 15–20 minutes and the VM reboots automatically',
              'After reboot, the sensor presents a local management web interface at https://[sensor-IP]',
            ]
          },
          {
            title: 'Initial sensor configuration',
            steps: [
              'Open a browser and navigate to https://[sensor-management-IP]',
              'Accept the self-signed certificate warning',
              'Log in with the default credentials: Username: admin, Password: admin (you will be forced to change this)',
              'Set a new strong password and click Save',
              'In the sensor web interface, click System settings (gear icon) > Network settings',
              'Configure the Management interface: set a static IP, subnet mask, default gateway, and DNS',
              'Configure the Monitoring interface(s): leave IP settings blank — these are passive listening interfaces',
              'Click Save and the sensor will restart its network services',
            ]
          },
          {
            title: 'Activate the sensor with your Azure workspace',
            steps: [
              'In the sensor web interface, click System settings > Defender for IoT activation',
              'Click Upload activation file and select the .zip file you downloaded from the Azure portal',
              'Click Activate — the sensor connects to Azure within 2–3 minutes',
              'Verify the connection: the status bar at the top should show Connected to cloud (green)',
              'Back in the Azure portal at Defender for IoT > Sites and sensors, your sensor should now show Status: Connected',
            ]
          },
          {
            title: 'Configure SPAN/TAP port on your switch',
            steps: [
              'Identify the switch that handles traffic for the OT network segment to monitor',
              'On a Cisco switch, configure SPAN with: monitor session 1 source vlan [OT-VLAN] both; monitor session 1 destination interface [port-connected-to-sensor]',
              'On a Cisco Catalyst: interface [destination-port]; no shutdown; switchport mode access',
              'On a Juniper switch: set forwarding-options port-mirroring input [source-interface]; set forwarding-options port-mirroring output interface [destination]',
              'Connect the sensor monitoring NIC to the SPAN destination port',
              'In the sensor web interface, go to System settings > Interface configurations',
              'Enable the monitoring interface and assign it to the SPAN-receiving NIC',
              'Click Save — the sensor begins passive traffic capture immediately',
            ],
            note: 'The monitoring interface captures traffic passively. It never sends traffic to the OT network. SPAN configuration should be validated with your network team before implementation.'
          }
        ]
      },
      {
        title: 'Phase 3: Device Discovery and Alert Review',
        icon: <CheckCircle size={16}/>,
        steps: [
          {
            title: 'Review discovered devices',
            steps: [
              'In the Defender for IoT Azure portal, click Device inventory in the left menu',
              'Within 1–4 hours of SPAN traffic flowing, devices will begin appearing automatically',
              'Review each discovered device — Defender for IoT identifies: IP address, MAC address, vendor, device type (PLC, HMI, switch, etc.), firmware version where available',
              'Click on any device to see detailed information and communication patterns',
              'Flag critical devices by clicking the star icon — this increases alert priority for these assets',
              'Export the device inventory to CSV: click Export at the top for an OT asset register',
            ]
          },
          {
            title: 'Configure alert rules and review initial alerts',
            steps: [
              'Navigate to Alerts in the Defender for IoT left menu',
              'Review auto-generated alerts — common initial alerts include new device detected, protocol violation, and policy violations',
              'For alerts that are known/approved (e.g., a scheduled backup generating unusual traffic), click the alert > Learn — this teaches the sensor this is normal behaviour',
              'Navigate to Settings > Alert exclusions to create permanent exclusions for recurring known-good activities',
              'Configure alert forwarding: Settings > Alert forwarding > Add rule — forward to email, Syslog, or Microsoft Sentinel',
            ]
          },
          {
            title: 'Configure baseline and learning mode',
            steps: [
              'During initial deployment, the sensor runs in Learning mode for 2–4 weeks',
              'In learning mode, the sensor identifies normal communication patterns without alerting on them',
              'After the learning period, go to System settings > Network modelling',
              'Click Stop learning to switch to Alert mode — any deviation from learned baselines will now generate alerts',
              'Recommended: Monitor in learning mode for a full production cycle (including any maintenance windows or batch jobs) before stopping learning',
            ]
          }
        ]
      }
    ],
    postDeployment: [
      'Deploy additional sensors for each isolated network segment — one sensor cannot monitor traffic it cannot see',
      'Integrate with Microsoft Sentinel using the Defender for IoT data connector for centralised alert management',
      'Configure vulnerability assessments under Sites and sensors > your sensor > Vulnerability report',
      'Set up regular device inventory exports for your OT asset management process',
      'Configure maintenance windows in the sensor to suppress alerts during planned maintenance',
      'Review and update the sensor software quarterly — updates are available in the sensor management interface',
      'Train OT/ICS staff on alert review procedures — OT alerts require OT context to triage correctly',
    ]
  },
  {
    id: 'cloudapps',
    name: 'Defender for Cloud Apps',
    subtitle: 'CASB & shadow IT discovery',
    icon: <AppWindow size={22} />,
    color: '#8b5cf6',
    description: 'Microsoft Defender for Cloud Apps (formerly Microsoft Cloud App Security) is a Cloud Access Security Broker (CASB) that provides deep visibility into cloud app usage, data controls, threat detection, and compliance across SaaS applications.',
    docUrl: 'https://learn.microsoft.com/en-us/defender-cloud-apps/get-started',
    estimatedTime: '2–6 hours for initial setup',
    licenseRequired: 'Microsoft 365 E5, EMS E5, or Defender for Cloud Apps standalone. Included in Microsoft 365 E5 Security.',
    prerequisites: [
      { icon: <Users size={14}/>, label: 'Admin permissions', detail: 'Global Administrator or Security Administrator in Microsoft Entra ID. Cloud App Security Administrator role can also be used for portal access.' },
      { icon: <Globe size={14}/>, label: 'Microsoft 365 integration', detail: 'Defender for Cloud Apps is pre-integrated with Microsoft 365. Automatic integration requires at least one Microsoft 365 workload (Exchange, SharePoint, Teams, etc.) to be active.' },
      { icon: <Monitor size={14}/>, label: 'Log collector (for Shadow IT)', detail: 'To discover shadow IT from firewall/proxy logs, deploy a log collector appliance (Docker container) on a Linux host. Requirements: Ubuntu 14.04+ or RHEL 7+, Docker CE, 4-core CPU, 8 GB RAM.' },
      { icon: <Database size={14}/>, label: 'Firewall/proxy log format', detail: 'Supported log sources for Cloud Discovery: Cisco ASA, Palo Alto, Check Point, Fortinet, Juniper, Blue Coat, Zscaler, iboss, and 100+ others. Manual log upload also supported.' },
      { icon: <Server size={14}/>, label: 'App connectors', detail: 'API-based connectors available for: Salesforce, ServiceNow, Box, Dropbox, GitHub, Okta, Workday, Google Workspace, AWS, Azure, and others. Admin credentials required for each app.' },
      { icon: <Lock size={14}/>, label: 'Conditional Access App Control', detail: 'To use real-time session controls, devices must route through Microsoft Entra ID Conditional Access. Identity Protection or Entra ID P1/P2 recommended.' },
    ],
    phases: [
      {
        title: 'Phase 1: Initial Setup and Microsoft 365 Integration',
        icon: <Globe size={16}/>,
        steps: [
          {
            title: 'Access Defender for Cloud Apps',
            steps: [
              'Navigate to the Microsoft Defender portal at https://security.microsoft.com',
              'Sign in with a Global Administrator or Security Administrator account',
              'In the left navigation, scroll down to Cloud apps section',
              'Click on Cloud app catalog to confirm Defender for Cloud Apps is available',
              'Alternatively, navigate directly to https://portal.cloudappsecurity.com',
              'On first access, you will be prompted to confirm your data residency region — select your preferred region and click Continue',
            ]
          },
          {
            title: 'Configure Microsoft 365 app connector',
            steps: [
              'In Defender for Cloud Apps, click Settings (gear icon) at the top right',
              'Under Connected apps, click App connectors',
              'Click Connect an app and select Office 365 from the list',
              'In the connection dialog, review the permissions that will be granted',
              'Select the Microsoft 365 components to monitor: Exchange Online, SharePoint, OneDrive, Teams, Azure AD, Dynamics',
              'Click Connect Office 365 — this grants API permissions automatically using your admin credentials',
              'Wait 2–5 minutes for the initial data sync',
              'The connector status changes to Connected (green) when complete',
              'Click on the Office 365 connector to see discovered apps, users, and activities',
            ]
          },
          {
            title: 'Connect additional app connectors',
            steps: [
              'In Settings > App connectors, click Connect an app',
              'For Salesforce: select Salesforce, click Connect Salesforce, and enter your Salesforce admin credentials when prompted',
              'For GitHub: select GitHub, follow OAuth flow, and authorise the permissions',
              'For AWS: select Amazon Web Services, click Add Amazon Web Services, and enter your AWS Access Key ID and Secret Access Key from an IAM user with SecurityAudit permissions',
              'For Google Workspace: select Google Workspace, enter your Google admin credentials, and approve the OAuth consent',
              'Each connector syncs user accounts, files, activities, and configurations — initial sync takes 15–60 minutes depending on data volume',
              'Verify each connector shows Connected status before proceeding',
            ]
          }
        ]
      },
      {
        title: 'Phase 2: Shadow IT Discovery',
        icon: <Monitor size={16}/>,
        steps: [
          {
            title: 'Configure automated log upload (log collector)',
            steps: [
              'In Defender for Cloud Apps, go to Settings > Cloud Discovery > Automatic log upload',
              'Click Add data source',
              'Enter a name for the log source (e.g., "Palo Alto Firewall")',
              'Select your device type from the dropdown (Cisco ASA, Palo Alto Networks, Fortinet, Zscaler, etc.)',
              'Select the Receiver type: FTP, FTPS, Syslog UDP, Syslog TCP, or Syslog TLS',
              'Click Save — the data source is created',
              'Click Add log collector',
              'Enter a name and select the data source(s) this collector will receive',
              'Click Create — a Docker command is generated',
              'On your Linux host with Docker installed, run the generated Docker command (it starts with: docker run -p ...)',
              'The log collector container starts and creates a listener on the configured port',
              'Configure your firewall/proxy to forward logs to the log collector IP and port',
            ]
          },
          {
            title: 'Manual log upload (for testing or one-time discovery)',
            steps: [
              'In Settings > Cloud Discovery, click Manual log upload',
              'Select your Data source (firewall/proxy type)',
              'Click Browse and select your exported log file (text/CSV format)',
              'Click Upload',
              'Processing takes 5–30 minutes depending on file size',
              'Once processed, navigate to Cloud Discovery > Dashboard to see discovered apps',
            ]
          },
          {
            title: 'Review Cloud Discovery results',
            steps: [
              'Navigate to Cloud apps > Cloud Discovery in the left menu',
              'The dashboard shows total apps discovered, users, traffic volume, and risk score',
              'Click Discovered apps to see the full list — apps are scored from 1–10 (10 = most trusted)',
              'Use the Filters to show only High risk apps (risk score under 5)',
              'Click on any app to see detailed usage: which users accessed it, how much data was uploaded/downloaded',
              'For apps you want to block or sanction: click the three dots (...) next to the app > Tag as Unsanctioned or Tag as Sanctioned',
              'Create a report: click Generate Cloud Discovery executive report for management reporting',
            ]
          }
        ]
      },
      {
        title: 'Phase 3: Policies, Alerts, and Session Controls',
        icon: <Lock size={16}/>,
        steps: [
          {
            title: 'Create Cloud Discovery policies',
            steps: [
              'In Defender for Cloud Apps, click Policies in the left menu',
              'Click Create policy > Cloud discovery anomaly detection policy',
              'This creates an automated policy that alerts on sudden spikes in cloud app usage',
              'Click Create policy > App discovery policy for ongoing discovery monitoring',
              'Set the policy filters: Risk score is less than 5, User count is greater than 10',
              'Set Actions: Send email alert to your security team address',
              'Click Create',
            ]
          },
          {
            title: 'Create activity and file policies',
            steps: [
              'Click Create policy > Activity policy',
              'Enter a policy name (e.g., "Impossible travel detection")',
              'Under Activity filters, select Activity type: Login success',
              'Enable Repeat activity filter and set Impossible travel to Yes',
              'Set Governance actions: Send alert to admin, Suspend user (optional — use with caution)',
              'Click Create',
              'Click Create policy > File policy to create data loss prevention rules',
              'Example: policy name "Sensitive data shared externally", filter: Sharing level = External, File matches: any DLP policy',
              'Set Governance: Remove external sharing, Notify file owner',
              'Click Create',
            ]
          },
          {
            title: 'Configure Conditional Access App Control',
            steps: [
              'Conditional Access App Control routes sessions through Defender for Cloud Apps for real-time monitoring',
              'In Entra ID admin center, go to Protection > Conditional Access',
              'Create a new policy targeting your users and the apps you want to control',
              'Under Session, select Use Conditional Access App Control',
              'Select Monitor only (to start) or Block specific activities',
              'Enable the policy',
              'Back in Defender for Cloud Apps, go to Settings > Conditional Access App Control apps',
              'The apps targeted by your CA policy will appear here',
              'Click the three dots next to an app > Edit to configure specific session controls: block downloads, block uploads, block copy-paste, add watermarks to downloaded files',
            ]
          },
          {
            title: 'Set up alert notifications and SIEM integration',
            steps: [
              'In Defender for Cloud Apps Settings, click Security extensions > SIEM agents',
              'Click Add SIEM agent to connect Microsoft Sentinel, Splunk, ArcSight, or generic Syslog',
              'For Microsoft Sentinel: install the Microsoft Defender for Cloud Apps data connector in Sentinel',
              'For generic Syslog: download the SIEM agent JAR file and configure it on a Java-enabled host',
              'Configure email notifications: Settings > Mail settings — set your notification sender address',
              'Settings > Alerts — configure default alert thresholds and auto-dismiss rules',
            ]
          }
        ]
      }
    ],
    postDeployment: [
      'Run Cloud Discovery for 30 days before blocking unsanctioned apps — allow time for full shadow IT visibility',
      'Review the Top risky users report weekly: Cloud apps > Users and accounts > sort by Investigation priority',
      'Integrate Defender for Cloud Apps with Microsoft Purview for unified data loss prevention',
      'Configure app governance add-on for OAuth app visibility and control at aka.ms/appgovernance',
      'Enable Threat Intelligence integration to automatically flag apps associated with known malware',
      'Set up Power Automate workflows to auto-respond to high-severity alerts',
      'Review monthly the App connectors health status — connectors can lose authorisation when admin passwords change',
    ]
  }
];

// ── Subcomponents ──────────────────────────────────────────────────────────
function PrereqCard({ prereq }: { prereq: Prereq }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
      <div className="mt-0.5 flex-shrink-0" style={{ color: 'var(--acc)' }}>{prereq.icon}</div>
      <div>
        <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text)' }}>{prereq.label}</div>
        <div className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>{prereq.detail}</div>
      </div>
    </div>
  );
}

function PhaseSection({ phase }: { phase: Product['phases'][0] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{ background: 'var(--bg3)' }}>
        <span style={{ color: 'var(--acc)' }}>{phase.icon}</span>
        <span className="font-semibold text-sm flex-1" style={{ color: 'var(--text)' }}>{phase.title}</span>
        {open ? <ChevronDown size={14} style={{ color: 'var(--text3)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text3)' }} />}
      </button>
      {open && (
        <div className="p-4 space-y-5" style={{ background: 'var(--card-bg)' }}>
          {phase.steps.map((section, si) => (
            <div key={si}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white"
                  style={{ background: 'var(--acc)' }}>{si + 1}</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{section.title}</div>
              </div>
              <div className="ml-7 space-y-1.5">
                {section.steps.map((step, i) => (
                  <div key={i} className="flex gap-2.5 text-xs" style={{ color: 'var(--text2)' }}>
                    <span className="mt-0.5 flex-shrink-0 font-mono" style={{ color: 'var(--acc)' }}>{String(i + 1).padStart(2, '0')}.</span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
                {section.note && (
                  <div className="flex gap-2 mt-2 p-2.5 rounded-lg" style={{ background: 'rgba(217,134,28,0.08)', border: '1px solid rgba(217,134,28,0.2)' }}>
                    <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--acc)' }} />
                    <span className="text-xs leading-relaxed" style={{ color: 'var(--acc)' }}>{section.note}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductGuide({ product }: { product: Product }) {
  const [section, setSection] = useState<'prereqs' | 'deployment' | 'post'>('prereqs');

  const TABS = [
    { id: 'prereqs' as const, label: 'Prerequisites' },
    { id: 'deployment' as const, label: 'Deployment' },
    { id: 'post' as const, label: 'Post-Deployment' },
  ];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="px-5 py-4" style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${product.color}20`, color: product.color, border: `1px solid ${product.color}40` }}>
              {product.icon}
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>{product.name}</div>
              <div className="text-xs" style={{ color: 'var(--text3)' }}>{product.subtitle}</div>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <span className="text-[10px] px-2 py-1 rounded-full font-mono" style={{ background: 'var(--bg3)', color: 'var(--text2)' }}>
              ⏱ {product.estimatedTime}
            </span>
            <a href={product.docUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full transition-colors"
              style={{ background: `${product.color}15`, color: product.color, border: `1px solid ${product.color}30` }}>
              <ExternalLink size={10} /> Microsoft Docs
            </a>
          </div>
        </div>
        <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--text2)' }}>{product.description}</p>
        <div className="mt-2 text-[10px]" style={{ color: 'var(--text3)' }}>
          <span className="font-semibold">License: </span>{product.licenseRequired}
        </div>
      </div>

      {/* Sub-tab bar */}
      <div className="flex" style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setSection(t.id)}
            className="flex-1 text-xs py-2.5 font-semibold transition-colors"
            style={{
              borderBottom: section === t.id ? `2px solid ${product.color}` : '2px solid transparent',
              color: section === t.id ? product.color : 'var(--text3)',
              background: section === t.id ? `${product.color}08` : 'transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4" style={{ background: 'var(--card-bg)' }}>
        {section === 'prereqs' && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>
              Complete all prerequisites before starting deployment
            </div>
            <div className="grid gap-2">
              {product.prerequisites.map((p, i) => <PrereqCard key={i} prereq={p} />)}
            </div>
          </div>
        )}
        {section === 'deployment' && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>
              Follow phases in order — each phase builds on the previous
            </div>
            {product.phases.map((phase, i) => <PhaseSection key={i} phase={phase} />)}
          </div>
        )}
        {section === 'post' && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>
              Complete after initial deployment is verified and running
            </div>
            <div className="space-y-2">
              {product.postDeployment.map((item, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <CheckCircle size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                  <span className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export function DeploymentPage() {
  const [activeProduct, setActiveProduct] = useState<string>('identity');
  const product = PRODUCTS.find(p => p.id === activeProduct)!;

  return (
    <div>
      {/* Product selector */}
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
        {PRODUCTS.map(p => (
          <button key={p.id} onClick={() => setActiveProduct(p.id)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all"
            style={{
              background: activeProduct === p.id ? `${p.color}15` : 'var(--card-bg)',
              border: activeProduct === p.id ? `2px solid ${p.color}` : '1px solid var(--border)',
              color: activeProduct === p.id ? p.color : 'var(--text2)',
            }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${p.color}20`, color: p.color }}>
              {p.icon}
            </div>
            <div>
              <div className="text-xs font-bold leading-tight" style={{ color: activeProduct === p.id ? p.color : 'var(--text)' }}>
                {p.name}
              </div>
              <div className="text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--text3)' }}>
                {p.subtitle}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Active product guide */}
      <ProductGuide product={product} />
    </div>
  );
}
