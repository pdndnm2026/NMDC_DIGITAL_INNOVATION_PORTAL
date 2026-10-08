import { Idea, ProblemStatement, Project } from '../types/index.js';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
  createdTime?: string;
}

export interface SheetMetadata {
  id: number;
  title: string;
  rowCount?: number;
  columnCount?: number;
}

export interface SpreadsheetDetails {
  spreadsheetId: string;
  title: string;
  sheets: SheetMetadata[];
}

/**
 * List Google Spreadsheets accessible by the user in Google Drive
 */
export async function listSpreadsheets(accessToken: string): Promise<DriveSpreadsheetFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,modifiedTime,createdTime)&orderBy=modifiedTime desc&pageSize=25`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to list spreadsheets (HTTP ${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Get metadata and sheets list for a specific spreadsheet
 */
export async function getSpreadsheetDetails(accessToken: string, spreadsheetId: string): Promise<SpreadsheetDetails> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to get spreadsheet details (HTTP ${response.status})`);
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Untitled Spreadsheet',
    sheets: (data.sheets || []).map((s: any) => ({
      id: s.properties?.sheetId,
      title: s.properties?.title || 'Sheet1',
      rowCount: s.properties?.gridProperties?.rowCount,
      columnCount: s.properties?.gridProperties?.columnCount,
    })),
  };
}

/**
 * Read values from a specified range in a spreadsheet
 */
export async function getSpreadsheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<{ range: string; values: (string | number)[][] }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to read values from sheet (HTTP ${response.status})`);
  }

  const data = await response.json();
  return {
    range: data.range,
    values: data.values || [],
  };
}

/**
 * Create a new spreadsheet with initial sheets and populated data
 */
export async function createSpreadsheet(
  accessToken: string,
  title: string,
  sheetsConfig: {
    title: string;
    headerRow: string[];
    rows: (string | number)[][];
  }[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const requestBody = {
    properties: {
      title,
    },
    sheets: sheetsConfig.map((sc) => ({
      properties: {
        title: sc.title,
        gridProperties: {
          rowCount: Math.max(sc.rows.length + 10, 50),
          columnCount: Math.max(sc.headerRow.length + 2, 10),
          frozenRowCount: 1,
        },
      },
      data: [
        {
          startRow: 0,
          startColumn: 0,
          rowData: [
            {
              values: sc.headerRow.map((h) => ({
                userEnteredValue: { stringValue: h },
                userEnteredFormat: {
                  backgroundColor: { red: 0.12, green: 0.35, blue: 0.8 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                },
              })),
            },
            ...sc.rows.map((row) => ({
              values: row.map((cell) => {
                if (typeof cell === 'number') {
                  return { userEnteredValue: { numberValue: cell } };
                }
                return { userEnteredValue: { stringValue: String(cell ?? '') } };
              }),
            })),
          ],
        },
      ],
    })),
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to create Google Spreadsheet (HTTP ${response.status})`);
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
  };
}

/**
 * Append rows to an existing spreadsheet
 */
export async function appendSpreadsheetRows(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  rows: (string | number)[][]
): Promise<{ updatedRows: number }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: rows,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to append rows to sheet (HTTP ${response.status})`);
  }

  const data = await response.json();
  return {
    updatedRows: data.updates?.updatedRows || rows.length,
  };
}

/**
 * Export NMDC Employee Innovation Ideas to a new Google Spreadsheet
 */
export async function exportIdeasToNewSheet(
  accessToken: string,
  ideas: Idea[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const dateStr = new Date().toISOString().split('T')[0];
  const title = `NMDC Innovation Portal - Employee Ideas Register [${dateStr}]`;

  const headerRow = [
    'Idea Code',
    'Title',
    'Department',
    'Submitter Name',
    'Designation',
    'Submission Date',
    'Status',
    'Innovation Score / 100',
    'Est. Annual Savings (₹ Lakhs)',
    'Problem Identified',
    'Proposed Innovation',
    'Expected Impact',
  ];

  const rows = ideas.map((idea) => [
    idea.ideaCode,
    idea.title,
    idea.department,
    idea.submitterName,
    idea.designation || 'Engineer',
    idea.submittedAt || new Date().toISOString(),
    idea.status,
    idea.aiAnalysis?.potentialBusinessValue || 'High',
    idea.estimatedAnnualSavings || 'N/A',
    idea.problemStatement,
    idea.proposedInnovation,
    idea.expectedBenefit,
  ]);

  return createSpreadsheet(accessToken, title, [
    {
      title: 'NMDC Ideas Register',
      headerRow,
      rows,
    },
  ]);
}

/**
 * Export NMDC Published Challenges to a new Google Spreadsheet
 */
export async function exportChallengesToNewSheet(
  accessToken: string,
  challenges: ProblemStatement[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const dateStr = new Date().toISOString().split('T')[0];
  const title = `NMDC Innovation Portal - Active Challenges [${dateStr}]`;

  const headerRow = [
    'Challenge Code',
    'Title',
    'Department',
    'Category',
    'Status',
    'Submission Deadline',
    'Indicative Budget',
    'Proposals Received',
    'Problem Description',
    'Expected Outcome',
  ];

  const rows = challenges.map((c) => [
    c.code,
    c.title,
    c.department,
    c.category,
    c.status,
    c.submissionDeadline,
    c.budgetaryIndication,
    c.respondedVendorsCount,
    c.problemDescription,
    c.expectedOutcome,
  ]);

  return createSpreadsheet(accessToken, title, [
    {
      title: 'Active Challenges',
      headerRow,
      rows,
    },
  ]);
}

/**
 * Export NMDC Projects and Pilots to a new Google Spreadsheet
 */
export async function exportProjectsToNewSheet(
  accessToken: string,
  projects: Project[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const dateStr = new Date().toISOString().split('T')[0];
  const title = `NMDC Innovation Portal - Project Register [${dateStr}]`;

  const headerRow = [
    'Project Code',
    'Project Name',
    'Vendor Partner',
    'NMDC Department',
    'Current Stage',
    'Health',
    'Approved Budget (₹ Cr)',
    'Actual Expenditure (₹ Cr)',
    'Expected Completion',
    'Realized RoI (₹ Cr)',
  ];

  const rows = projects.map((p) => {
    const totalRealisedCr = (p.benefits || []).reduce((acc, b) => acc + (b.realisedAnnualCr || 0), 0);
    return [
      p.projectCode,
      p.name,
      p.vendorName,
      p.nmdcDepartment,
      p.currentStage,
      p.health,
      p.approvedBudgetCr,
      p.actualExpenditureCr,
      p.targetCompletionDate,
      totalRealisedCr,
    ];
  });

  return createSpreadsheet(accessToken, title, [
    {
      title: 'Projects Register',
      headerRow,
      rows,
    },
  ]);
}
