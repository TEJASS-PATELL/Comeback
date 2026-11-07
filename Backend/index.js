import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'

const app = express()
const prisma = new PrismaClient()
const PORT = Number(process.env.PORT || 3001)
const DEFAULT_STATE_KEY = 'default'

app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ ok: true })
  } catch (error) {
    console.error('Database health check failed:', error)
    res.status(500).json({ ok: false, error: 'Database connection failed' })
  }
})

app.get('/api/state', async (req, res, next) => {
  try {
    const key = String(req.query.key || DEFAULT_STATE_KEY)
    const record = await prisma.appState.findUnique({ where: { key } })

    res.json({
      key,
      data: record?.data ?? null,
      updatedAt: record?.updatedAt ?? null,
    })
  } catch (error) {
    next(error)
  }
})

app.put('/api/state', async (req, res, next) => {
  try {
    const key = String(req.body?.key || DEFAULT_STATE_KEY)
    const data = req.body?.data

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      res.status(400).json({ error: 'Request body must include an object payload in `data`.' })
      return
    }

    const record = await prisma.appState.upsert({
      where: { key },
      update: { data },
      create: { key, data },
    })

    res.json({
      key: record.key,
      updatedAt: record.updatedAt,
    })
  } catch (error) {
    next(error)
  }
})

app.use((error, _req, res, _next) => {
  console.error('API request failed:', error)
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
  })
})

const server = app.listen(PORT, () => {
  console.log(`Hunter API listening on port ${PORT}`)
})

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)