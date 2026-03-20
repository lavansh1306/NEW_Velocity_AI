# Project Task Upload Feature Guide

## Overview
The "Add a Project" section now includes an **"Import from File"** button that allows you to upload project tasks from CSV, XLSX, or PDF files. The system uses Google's Gemini AI to intelligently parse and extract task information from your documents.

## Supported File Formats

### CSV (Comma-Separated Values)
- Standard CSV format with task information
- Can include: Task Name, Assignee, Hours, Start Date, Due Date, Timeline
- Example:
  ```
  Task Name,Assignee,Hours,Start Date,Due Date,Timeline
  Build API,John Doe,40,2024-03-20,2024-04-03,Week 1
  Database Setup,Jane Smith,20,2024-03-20,2024-03-27,Week 1
  ```

### XLSX (Excel Spreadsheets)
- Excel workbooks with task data
- Multiple sheets supported (all sheets are parsed)
- Automatically handles formatting and headers
- Can include financial data, resource allocations, etc.

### PDF (Portable Document Format)
- Project scope documents
- Requirements documents
- Task lists
- Any PDF with task or project information

## Setup Instructions

### Step 1: Get a Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key

### Step 2: Configure Environment Variable
Add the following to your `.env` file:
```bash
VITE_GEMINI_API_KEY=your-api-key-here
```

### Step 3: Restart Development Server
If you're running the dev server, restart it to pick up the new environment variable.

## How to Use

### Uploading Tasks

1. **Navigate to Create Project**
   - Click on the "Create New Project" section

2. **Click "Import from File"**
   - You'll see the upload dialog
   - Click the upload area or browse for a file

3. **Select Your File**
   - Choose a CSV, XLSX, or PDF file (max 10MB)
   - The system will upload and parse it using AI

4. **Review Parsed Tasks**
   - A dialog shows all parsed tasks in a table
   - Each task includes:
     - Task Name
     - Assignee
     - Estimated Hours
     - Start Date
     - Due Date
     - Timeline/Phase

5. **Edit Tasks (Optional)**
   - Click on any field to edit
   - Change assignees from the dropdown
   - Adjust dates or hours as needed
   - Remove tasks using the X button (minimum 1 task required)

6. **Confirm Import**
   - Click "Add X Tasks" button to import
   - Tasks will replace any existing manual tasks
   - You can still add more tasks manually afterwards

### Manual Task Management

After importing, you can still:
- **Add more tasks** using the "Add Task" button
- **Edit existing tasks** directly in the table
- **Remove tasks** using the delete icon
- **Auto-calculate hours** by setting start and due dates (8 hours/day)

## Parsed Data Examples

### From CSV
```csv
Authentication Module,Dev Team - John,32,2024-03-20,2024-04-10,Sprint 1
UI Component Library,Jane,24,2024-03-20,2024-04-03,Sprint 1
API Testing,Bob,16,2024-03-27,2024-04-10,Sprint 2
```

### From XLSX
Excel spreadsheets are processed row by row, extracting:
- Column headers or cell values as task names
- Resource names as assignees
- Numerical values as hours
- Dates in any common format

### From PDF
Example project scope in PDF:
```
Project: Mobile App Redesign
Tasks:
1. UI UX Design - 40 hours
2. Mobile Development - 80 hours
3. Testing & QA - 20 hours
```

## AI Parsing Benefits

✅ **Intelligent Extraction**
- Understands context from various document formats
- Extracts even loosely structured information

✅ **Date Parsing**
- Recognizes multiple date formats
- Converts to YYYY-MM-DD automatically

✅ **Data Cleaning**
- Normalizes names and values
- Removes extra whitespace and formatting

✅ **Flexible Structure**
- Works with organized or unorganized documents
- Extracts key information intelligently

## Troubleshooting

### "Gemini API is not configured"
**Solution:** Add `VITE_GEMINI_API_KEY` to your `.env` file and restart the dev server.

### "Failed to parse file"
**Possible causes:**
- File is corrupted or invalid
- File is too large (> 10MB)
- Unsupported file format
- **Solution:** Try with a different file or ensure file is valid

### "No tasks parsed from file"
**Possible causes:**
- Document doesn't contain recognizable task information
- Data is in an unexpected format
- **Solution:** Ensure your file follows the examples above

### Dates not parsing correctly
**Solution:** Use common date formats:
- YYYY-MM-DD (preferred)
- MM/DD/YYYY
- DD-MMM-YYYY
- Full month names work too (e.g., "20 March 2024")

## Best Practices

1. **Organize Your Data**
   - Use clear headers in CSV/XLSX
   - Structure project documents logically
   - Include dates in recognizable formats

2. **Use Standard Naming**
   - Clear task names (not abbreviated)
   - Recognizable employee names from your system
   - Standard hour estimates

3. **Review Before Confirming**
   - Always review parsed tasks before importing
   - Check assignees are correct
   - Verify hours and dates make sense

4. **Combine Methods**
   - Import from file to get base tasks
   - Add/edit manually for fine-tuning
   - Keep it flexible

## Example Workflow

1. **Start with a Project Brief**
   - Export tasks from JIRA as CSV
   - Or export from your project management tool

2. **Upload to Velocity**
   - Click "Import from File"
   - Select your export file
   - Review and adjust

3. **Create Project**
   - Fill in project details
   - Select team members
   - Click "Create Project"

4. **Backlog Ready**
   - All tasks are instantly created
   - Team can start working immediately
   - No manual re-entry needed

## API Rate Limits

Using Gemini 1.5 Flash:
- Fast model for quick processing
- Handles well for standard project documents
- If you hit rate limits, wait a few seconds and try again

## Privacy & Security

✓ Files are only used for parsing
✓ Content is sent to Google's API for processing
✓ No data is stored on our servers
✓ Use your own API key (not shared)

For production deployments, consider:
- Using a service account for API calls
- Implementing request rate limiting
- Monitoring API usage

---

Need help? Check the error message in the dialog for specific guidance.
