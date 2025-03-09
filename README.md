# Claude Coder

Claude Coder is an Electron application that captures screenshots and leverages the Anthropic Claude 3.7 API to analyze them. It can solve questions, generate code, or provide detailed answers based on screenshots. The app supports both single screenshot processing and multi-page mode for capturing multiple images before analysis.

## Features

- **Screenshot Capture:** Use global keyboard shortcuts to capture the screen.
- **Claude Integration:** Send captured screenshots to Anthropic's Claude API for automated analysis.
- **Multi-Page Mode:** Combine multiple screenshots for questions spanning several pages.
- **Customizable UI:** Transparent, always-on-top window with an instruction banner and markdown-rendered responses.
- **Global Shortcuts:** Easily control the application using keyboard shortcuts.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- An Anthropic API key

## Installation

1. **Clone the repository:**

   ```
   git clone https://github.com/cachatj/oa-coder-claude3_7.git
   cd oa-coder-claude3_7
   ```
2. **Install the dependencies:**
   ```
   npm install
   ```
3. **Configure the application:**
   Create a config.json file in the project root with your Anthropic API key and (optionally) your desired model. For example:
    ```
    {
      "apiKey": "YOUR_ANTHROPIC_API_KEY",
      "model": "claude-3-7-sonnet-20250219"
    }
    ```
  - Note: If the model field is omitted, the application defaults to "claude-3-7-sonnet-20250219".


## Usage

1. **Start the Application:**
    Run the following command to launch Claude Coder:
    ```
    npm start
    ```
2. **Global Keyboard Shortcuts:**

    - Ctrl+Shift+S: Capture a screenshot and process it immediately. In multi-page mode, this shortcut finalizes the session and sends all captured screenshots for processing.
    - Ctrl+Shift+A: Capture an additional screenshot in multi-page mode. The instruction banner will remind you of the mode and available shortcuts.
    - Ctrl+Shift+R: Reset the current process, clearing all captured screenshots and any displayed results.
    - Ctrl+Shift+H: Show / Hide toggle