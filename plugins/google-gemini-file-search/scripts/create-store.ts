#!/usr/bin/env node
/**
 * Create a new Google Gemini File Search Store
 *
 * Usage:
 *   ts-node create-store.ts --name "My Knowledge Base" --project "customer-support"
 *   node create-store.js --name "My Knowledge Base"
 */

import { GoogleGenAI } from '@google/genai'

interface CreateStoreOptions {
  name: string
  project?: string
  environment?: string
}

async function createFileSearchStore(options: CreateStoreOptions) {
  // Validate API key
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    console.error('❌ Error: GOOGLE_API_KEY environment variable is required')
    console.error('   Create an API key at: https://aistudio.google.com/apikey')
    process.exit(1)
  }

  // Initialize client
  console.log('Initializing Google Gemini client...')
  const ai = new GoogleGenAI({ apiKey })

  try {
    // Check if store already exists
    console.log(`\nChecking for existing store: "${options.name}"...`)
    let existingStore = null
    let pageToken: string | null = null

    do {
      const page = await ai.fileSearchStores.list({ pageToken: pageToken || undefined })
      existingStore = page.fileSearchStores?.find(
        s => s.displayName === options.name
      )
      pageToken = page.nextPageToken || null
    } while (!existingStore && pageToken)

    if (existingStore) {
      console.log('⚠️  Store already exists:')
      console.log(`   Name: ${existingStore.name}`)
      console.log(`   Display Name: ${existingStore.displayName}`)
      console.log(`   Created: ${existingStore.createTime}`)
      console.log('\n   Use this store name for uploads and queries.')
      return
    }

    // Create new store
    console.log('Creating new file search store...')
    const customMetadata: Record<string, string> = {}
    if (options.project) {
      customMetadata.project = options.project
    }
    if (options.environment) {
      customMetadata.environment = options.environment
    }

    const fileStore = await ai.fileSearchStores.create({
      config: {
        displayName: options.name,
        ...(Object.keys(customMetadata).length > 0 && { customMetadata })
      }
    })

    console.log('\n✅ Store created successfully!')
    console.log(`   Name: ${fileStore.name}`)
    console.log(`   Display Name: ${fileStore.displayName}`)
    console.log(`   Created: ${fileStore.createTime}`)
    console.log('\n   Use this store name for uploads and queries:')
    console.log(`   export FILE_SEARCH_STORE="${fileStore.name}"`)

  } catch (error) {
    console.error('\n❌ Error creating store:', error)
    if (error instanceof Error) {
      console.error(`   ${error.message}`)
    }
    process.exit(1)
  }
}

// Parse command-line arguments
function parseArgs(): CreateStoreOptions {
  const args = process.argv.slice(2)
  const options: Partial<CreateStoreOptions> = {}

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) {
      options.name = args[i + 1]
      i++
    } else if (args[i] === '--project' && args[i + 1]) {
      options.project = args[i + 1]
      i++
    } else if (args[i] === '--environment' && args[i + 1]) {
      options.environment = args[i + 1]
      i++
    }
  }

  if (!options.name) {
    console.error('Usage: ts-node create-store.ts --name "Store Name" [--project "project"] [--environment "env"]')
    console.error('\nExample:')
    console.error('  ts-node create-store.ts --name "Customer Support KB" --project "support" --environment "production"')
    process.exit(1)
  }

  return options as CreateStoreOptions
}

// Main execution
if (require.main === module) {
  const options = parseArgs()
  createFileSearchStore(options).catch(error => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })
}

export { createFileSearchStore, CreateStoreOptions }
