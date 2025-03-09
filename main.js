const {
  app,
  BrowserWindow,
  globalShortcut,
  desktopCapturer
} = require('electron')
const path = require('path')
const fs = require('fs')
const { Anthropic } = require('@anthropic-ai/sdk')

let config
try {
  const configPath = path.join(__dirname, 'config.json')
  const configData = fs.readFileSync(configPath, 'utf8')
  config = JSON.parse(configData)

  if (!config.apiKey) {
    throw new Error('API key is missing in config.json')
  }

  // Set default model if not specified
  if (!config.model) {
    config.model = 'claude-3-7-sonnet-20250219'
    console.log('Model not specified in config, using default:', config.model)
  }
} catch (err) {
  console.error('Error reading config:', err)
  app.quit()
}
const anthropic = new Anthropic({ apiKey: config.apiKey })

let mainWindow
let screenshots = []
let multiPageMode = false

function updateInstruction (instruction) {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('update-instruction', instruction)
  }
}

function hideInstruction () {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('hide-instruction')
  }
}

async function captureScreenshot () {
  try {
    hideInstruction()
    mainWindow.hide()
    await new Promise(res => setTimeout(res, 200))

    // Use Electron's desktopCapturer to get a screenshot
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    })

    // Get the primary display source
    const primarySource = sources[0]

    if (!primarySource) {
      throw new Error('No screen source found')
    }

    // Get the image data as base64
    const base64Data = primarySource.thumbnail.toPNG().toString('base64')

    mainWindow.show()
    return base64Data
  } catch (err) {
    mainWindow.show()
    if (mainWindow.webContents) {
      mainWindow.webContents.send('error', err.message)
    }
    throw err
  }
}

async function processScreenshots () {
  try {
    // Build message with text + each screenshot
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Can you solve the Python or SQL technical coding assessment question for me and give the final answer/code? Please concisely provide your rational or logic for solving it a particular way, then provide the full code using common sense, built in approaches.'
          }
        ]
      }
    ]

    // Add screenshots to the user message content array
    for (const img of screenshots) {
      // For Anthropic API, we need to use the correct format for images
      messages[0].content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: img
        }
      })
      console.log(`Added image to request (length: ${img.length} characters)`)
    }

    console.log('Sending request to Anthropic API with model:', config.model)

    // Make the request
    const response = await anthropic.messages.create({
      model: config.model,
      messages: messages,
      max_tokens: 5000
    })

    // Send the text to the renderer
    mainWindow.webContents.send('analysis-result', response.content[0].text)
  } catch (err) {
    console.error('Error in processScreenshots:', err)
    if (mainWindow.webContents) {
      mainWindow.webContents.send('error', err.message)
    }
  }
}

// Reset everything
function resetProcess () {
  screenshots = []
  multiPageMode = false
  mainWindow.webContents.send('clear-result')
  updateInstruction(
    'Ctrl+Shift+S: Screenshot | Ctrl+Shift+A: Multi-mode | Ctrl+Shift+H: Toggle visibility'
  )
}

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    paintWhenInitiallyHidden: true,
    contentProtection: true,
    type: 'toolbar'
  })

  mainWindow.loadFile('index.html')
  mainWindow.setContentProtection(true)
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1)

  // Ctrl+Shift+S => single or final screenshot
  globalShortcut.register('CommandOrControl+Shift+S', async () => {
    try {
      const img = await captureScreenshot()
      screenshots.push(img)
      await processScreenshots()
    } catch (error) {
      console.error('Ctrl+Shift+S error:', error)
    }
  })

  // Ctrl+Shift+A => multi-page mode
  globalShortcut.register('CommandOrControl+Shift+A', async () => {
    try {
      if (!multiPageMode) {
        multiPageMode = true
        updateInstruction(
          'Multi-mode: Ctrl+Shift+A to add, Ctrl+Shift+S to finalize'
        )
      }
      const img = await captureScreenshot()
      screenshots.push(img)
      updateInstruction(
        'Multi-mode: Ctrl+Shift+A to add, Ctrl+Shift+S to finalize'
      )
    } catch (error) {
      console.error('Ctrl+Shift+A error:', error)
    }
  })

  // Ctrl+Shift+R => reset
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    resetProcess()
  })

  // Ctrl+Shift+H => toggle window visibility
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
    }
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
