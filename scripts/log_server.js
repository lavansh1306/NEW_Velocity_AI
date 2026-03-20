import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const logFile = path.join(process.cwd(), 'logs.txt');

app.post('/log', (req, res) => {
  const logEntry = `${new Date().toISOString()} - ${JSON.stringify(req.body)}\n`;
  fs.appendFileSync(logFile, logEntry);
  console.log("Logged:", req.body);
  res.sendStatus(200);
});

app.listen(9999, () => {
  console.log('Log server listening on port 9999');
});
