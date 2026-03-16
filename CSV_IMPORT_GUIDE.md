# CSV Bulk Import for Team Members

This feature allows you to quickly import multiple team members at once using a CSV file.

## CSV Format

The CSV file should have the following columns:

```
name,email,role,skills,utilization
```

### Column Descriptions

- **name**: Full name of the team member (required)
- **email**: Email address of the team member (required)
- **role**: Job role/position (e.g., Frontend Developer, Backend Developer, Product Manager, etc.)
- **skills**: Comma-separated list of skills (e.g., React React Native TypeScript)
- **utilization**: Target utilization percentage (0-120, default: 85)

## Example CSV

```csv
name,email,role,skills,utilization
John Doe,john.doe@company.com,Frontend Developer,React React Native TypeScript,85
Jane Smith,jane.smith@company.com,Backend Developer,Node.js Python PostgreSQL,90
Bob Johnson,bob.johnson@company.com,Full Stack Developer,React Node.js MongoDB,80
Alice Williams,alice.williams@company.com,Product Designer,Figma Design Systems UI/UX,75
Charlie Brown,charlie.brown@company.com,QA Engineer,Selenium Jest Testing,70
```

## How to Use

1. Click "Add Team Member" button
2. Switch to "Bulk Import (CSV)" tab
3. Either:
   - **Download Sample CSV**: Click the "Download Sample CSV" link to get a pre-formatted template
   - **Paste CSV Data**: Paste your CSV data directly into the textarea
4. Click "Import Members" to bulk import all members

## Sample File

A sample CSV file is provided: `sample_team_members.csv`

You can use this file as a template by:
1. Opening it in Excel, Google Sheets, or any text editor
2. Modifying the data
3. Copying the content and pasting it into the import dialog

## Notes

- Minimum 1 team member per import (1 header row + 1 data row)
- Email addresses must be valid
- If a member fails to import, other members will still be imported
- You'll see a summary of successful and failed imports
- All members are added to the default team of your organization
