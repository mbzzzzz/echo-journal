# 🎤 ECHO JOURNAL - AI-Powered Voice Thoughts

A beautiful, modern Chrome extension that captures your thoughts through voice recording with instant AI-powered processing and organization.

![Echo Journal](https://img.shields.io/badge/Chrome-Extension-blue?style=for-the-badge&logo=google-chrome)
![AI Powered](https://img.shields.io/badge/AI-Powered-purple?style=for-the-badge&logo=openai)
![Voice Recognition](https://img.shields.io/badge/Voice-Recognition-green?style=for-the-badge&logo=google)

## ✨ Features

### 🎯 **Instant Voice Capture**
- **One-Click Recording**: Simple, beautiful record button
- **Real-Time Feedback**: See your speech being transcribed live
- **Instant Results**: Notes appear immediately after recording

### 🧠 **AI-Powered Processing**
- **Chrome AI Integration**: Uses Chrome's built-in AI APIs for enhanced processing
- **Smart Summarization**: Converts voice transcripts into concise summaries
- **Action Item Extraction**: Automatically identifies and breaks down actionable tasks
- **Intelligent Tagging**: Generates relevant keywords and topics
- **AI Insights**: Provides contextual insights and analysis

### 🎨 **Beautiful UI/UX**
- **Material Design**: Modern, expressive design with bold fonts and styling
- **Glass-morphism Effects**: Stunning visual effects with backdrop blur
- **Smooth Animations**: Fluid transitions and micro-interactions
- **Responsive Layout**: Perfect fit for Chrome side panels
- **Dark Theme**: Easy on the eyes with gradient backgrounds

### 📋 **Smart Organization**
- **Action Items**: Automatically extracted and formatted as actionable tasks
- **Tags**: Intelligent keyword extraction for easy categorization
- **Source Tracking**: Links back to the webpage where you recorded
- **Confidence Levels**: AI confidence indicators for reliability
- **Insights**: Additional context and important points

## 🚀 Installation

### From Source (Development)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/echo-journal.git
   cd echo-journal
   ```

2. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `echo-journal` folder

3. **Pin the Extension**:
   - Click the puzzle piece icon in Chrome toolbar
   - Pin "Echo - Private Audio Journal" to your toolbar

## 🎯 Usage

1. **Open the Extension**: Click the Echo Journal icon in your Chrome toolbar
2. **Start Recording**: Click the "RECORD" button and speak your thoughts
3. **View Results**: Your note appears instantly with AI-enhanced processing
4. **Organize**: Use tags and action items to stay organized
5. **Access Anytime**: All notes are saved locally and accessible anytime

## 🛠️ Technical Details

### **Architecture**
- **Manifest V3**: Latest Chrome extension standard
- **Web Speech API**: Browser-native speech recognition
- **Chrome AI APIs**: Built-in AI processing capabilities
- **Local Storage**: All data stored locally for privacy
- **Side Panel**: Modern Chrome side panel interface

### **AI Processing Pipeline**
1. **Voice Recognition**: Web Speech API converts speech to text
2. **Instant Display**: Basic processing shows results immediately
3. **AI Enhancement**: Chrome AI APIs enhance the content in background
4. **Live Updates**: UI updates automatically when AI processing completes

### **Key Technologies**
- **HTML5**: Semantic markup structure
- **CSS3**: Advanced styling with animations and effects
- **JavaScript ES6+**: Modern JavaScript with async/await
- **Chrome Extensions API**: Native browser integration
- **Web Speech API**: Speech-to-text functionality

## 📁 Project Structure

```
echo-journal/
├── manifest.json          # Extension configuration
├── sidepanel.html         # Main UI structure
├── sidepanel.js           # Core functionality and AI processing
├── style.css              # Styling and animations
├── background.js          # Service worker (if needed)
├── images/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

## 🔧 Development

### **Prerequisites**
- Chrome Browser (latest version)
- Basic knowledge of HTML, CSS, and JavaScript
- Chrome Developer Tools

### **Key Functions**

#### **Speech Processing**
```javascript
// Initialize speech recognition
function initializeSpeechRecognition()

// Process transcript with AI
async function processWithChromeAI(transcript)

// Enhanced local processing
async function enhancedLocalProcessing(transcript)
```

#### **AI Integration**
```javascript
// Chrome AI API integration
const promptResult = await chrome.ai.prompt({
  text: `Analyze transcript: "${transcript}"`
});

// Fallback processing
const enhancedData = await enhancedLocalProcessing(transcript);
```

#### **UI Management**
```javascript
// Render notes with animations
function renderNote(note, prepend)

// Update notes in real-time
function updateNoteInUI(updatedNote)

// Instant results display
async function processTranscript(transcript)
```

## 🎨 Customization

### **Styling**
The extension uses custom CSS with extensive animations and effects. Key styling areas:

- **Colors**: Gradient backgrounds and accent colors
- **Animations**: Smooth transitions and micro-interactions
- **Typography**: Bold, expressive fonts
- **Layout**: Responsive design for side panels

### **AI Processing**
Customize AI processing by modifying:

- **Prompt Templates**: Change AI prompt structure
- **Fallback Logic**: Modify local processing algorithms
- **Confidence Thresholds**: Adjust AI confidence levels
- **Insight Generation**: Customize insight extraction

## 🔒 Privacy & Security

- **Local Storage**: All data stored locally on your device
- **No External APIs**: Uses only Chrome's built-in APIs
- **No Data Collection**: No personal data sent to external servers
- **Secure Permissions**: Minimal required permissions

## 🐛 Troubleshooting

### **Common Issues**

1. **Microphone Not Working**:
   - Check browser permissions
   - Ensure microphone is not blocked
   - Try refreshing the extension

2. **AI Processing Not Working**:
   - Check Chrome version (AI APIs require latest Chrome)
   - Extension will fallback to enhanced local processing
   - Check console for error messages

3. **Notes Not Saving**:
   - Check Chrome storage permissions
   - Clear browser cache if needed
   - Reload the extension

### **Debug Mode**
Open Chrome DevTools to see detailed logging:
- Speech recognition events
- AI processing steps
- Error messages and debugging info

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Chrome Extensions Team**: For the excellent extension platform
- **Web Speech API**: For browser-native speech recognition
- **Chrome AI Team**: For built-in AI processing capabilities
- **Material Design**: For design inspiration and guidelines

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/echo-journal/issues) page
2. Create a new issue with detailed description
3. Include Chrome version and error messages

---

**Made with ❤️ for productivity and thought organization**

## 📸 How It Works (Screenshots)

The screenshots below show the full flow of Echo Journal running in the Chrome side‑panel. Save the images in `images/screenshots/` with the same filenames to render them on GitHub.

### 1) Recording and AI Processing

When you click RECORD, the app starts listening, shows a live interim transcript under the title, and then displays a processing state while AI runs in the background.

![Processing your thought](images/screenshots/1-processing.png)

What you see:
- Live interim transcript chip under the header
- Big processing state with progress dots
- This phase is very short; we create an instant note and then enhance it with AI in the background

### 2) Instant Note + Enhanced AI Output

Immediately after the recording stops, a new note appears with your raw summary, action items, and tags. As soon as the built‑in AI finishes, the note updates with a refined summary, insights, and confidence.

![Instant + enhanced note](images/screenshots/2-note-enhanced.png)

Highlights:
- Bold summary (inline‑editable)
- Action Items (each item inline‑editable)
- AI Insights (key points and confidence badge)
- Tags and Source link

### 3) Due‑date Parsing and Reminders

If your speech contains phrases like “tomorrow 3pm”, “next Tuesday”, or owners like “@John”, Echo extracts due dates/owners and schedules a Chrome alarm. You’ll get a native notification when it’s due.

![Another example note](images/screenshots/3-dates-reminders.png)

What’s happening behind the scenes:
- NLP parses simple dates/times and owners
- A Chrome alarm is scheduled per actionable item with a due date
- The service worker shows a notification when the reminder triggers

### 4) Multiple Notes, Consistent UX

Each note follows the same structure and is fully editable. You can change the summary or any action inline; changes are persisted immediately and reminders get re‑scheduled.

![Second example note](images/screenshots/4-multiple-notes.png)

Tips:
- Click any summary to edit; press Enter or blur to save
- Click any action line to edit; reminders are re‑computed automatically
- Click the trash icon to delete a note

> If these images don’t load on GitHub yet: place the four screenshot files in `images/screenshots/` using the names shown above (`1-processing.png`, `2-note-enhanced.png`, `3-dates-reminders.png`, `4-multiple-notes.png`) and commit.
