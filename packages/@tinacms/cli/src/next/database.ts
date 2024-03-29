import {
  createDatabaseInternal,
  FilesystemBridge,
  Database,
  TinaLevelClient,
  Bridge,
} from '@tinacms/graphql'
import {
  ConfigManager,
  LEGACY_TINA_FOLDER,
  TINA_FOLDER,
} from './config-manager'
import { logger } from '../logger'
import { pipeline } from 'readable-stream'
import { createServer } from 'net'
import { ManyLevelHost } from 'many-level'
import { MemoryLevel } from 'memory-level'

export const createDBServer = (port: number) => {
  const levelHost = new ManyLevelHost(
    // @ts-ignore
    new MemoryLevel<string, Record<string, any>>({
      valueEncoding: 'json',
    })
  )
  const dbServer = createServer(function (socket) {
    // Pipe socket into host stream and vice versa
    return pipeline(socket, levelHost.createRpcStream(), socket, () => {
      // Disconnected
    })
  })
  dbServer.once('error', (err) => {
    // @ts-ignore err.code undefined
    if (err?.code === 'EADDRINUSE') {
      throw new Error(
        `Tina Dev server is already in use. Datalayer server is busy on port ${port}`
      )
    }
  })
  dbServer.listen(port)
}

export async function createAndInitializeDatabase({
  configManager,
  datalayerPort,
  bridgeOverride,
  preview,
}: {
  configManager: ConfigManager
  datalayerPort: number
  bridgeOverride?: Bridge
  preview?: boolean
}) {
  let database: Database
  const bridge =
    bridgeOverride ||
    new FilesystemBridge(configManager.rootPath, configManager.contentRootPath)

  if (configManager.hasSelfHostedConfig()) {
    database = preview
      ? await configManager.loadPreviewDatabaseFile()
      : await configManager.loadDatabaseFile()
    database.bridge = bridge
    if (configManager.config.contentApiUrlOverride) {
      return database
    }
    logger.warn(
      `Found a database config file at ${configManager.printRelativePath(
        preview
          ? configManager.selfHostedPreviewDatabaseFilePath
          : configManager.selfHostedDatabaseFilePath
      )} but there was no "contentApiUrlOverride" set. Falling back to built-in datalayer`
    )
  }

  const level = new TinaLevelClient(datalayerPort)
  level.openConnection()
  database = createDatabaseInternal({
    namespace: database?.contentNamespace || (preview ? 'preview' : undefined),
    bridge,
    level,
    tinaDirectory: configManager.isUsingLegacyFolder
      ? LEGACY_TINA_FOLDER
      : TINA_FOLDER,
  })

  return database
}
