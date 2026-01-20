import express, { Request, Response } from "express"
import cors from "cors"

const app = express()
const PORT = 3001

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))

app.use(express.json())

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is running!" })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal API server listening on http://localhost:${PORT}`)
})