// Get references to all the HTML elements we need
const recordButton = document.getElementById('record-button');
const recordButtonText = document.getElementById('record-button-text');
const notesList = document.getElementById('notes-list');
const loadingIndicator = document.getElementById('loading-indicator');
const emptyState = document.getElementById('empty-state');

let isRecording = false; // State to track recording
let recognition = null; // Speech recognition instance
let recordingTimeout = null; // Timeout for recording

// Initialize speech recognition
function initializeSpeechRecognition() {
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
  } else if ('SpeechRecognition' in window) {
    recognition = new SpeechRecognition();
  } else {
    console.error('Speech recognition not supported');
    return false;
  }

  recognition.continuous = false;
  recognition.interimResults = true; // Enable interim results for better feedback
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    console.log('Speech recognition started - listening for speech...');
    recordButtonText.textContent = 'Listening... Speak now!';
  };

  recognition.onresult = (event) => {
    console.log('Speech recognition result received:', event);
    
    let finalTranscript = '';
    let interimTranscript = '';
    
    // Process all results
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    
    console.log('Final transcript:', finalTranscript);
    console.log('Interim transcript:', interimTranscript);
    
    // Update UI with interim results
    if (interimTranscript) {
      recordButtonText.textContent = `Listening... "${interimTranscript}"`;
    }
    
    // Process final transcript
    if (finalTranscript) {
      console.log('Processing final transcript:', finalTranscript);
      processTranscript(finalTranscript);
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    
    // Handle specific error types
    switch(event.error) {
      case 'not-allowed':
        showError('Microphone access denied. Please allow microphone access and try again.');
        break;
      case 'no-speech':
        showError('No speech detected. Please try speaking louder or closer to the microphone.');
        break;
      case 'audio-capture':
        showError('No microphone found. Please check your microphone connection.');
        break;
      case 'network':
        showError('Network error. Please check your internet connection.');
        break;
      case 'aborted':
        console.log('Speech recognition aborted - this is normal when stopping');
        break;
      default:
        showError(`Speech recognition error: ${event.error}. Please try again.`);
    }
    
    resetRecordingState();
  };

  recognition.onend = () => {
    console.log('Speech recognition ended');
    resetRecordingState();
  };

  recognition.onnomatch = () => {
    console.log('No speech was recognized');
    showError('No speech was recognized. Please try speaking more clearly.');
    resetRecordingState();
  };

  return true;
}

// Process the transcript and create a note with instant results + AI enhancement
async function processTranscript(transcript) {
  try {
    console.log('Processing transcript:', transcript);
    
    if (!transcript || transcript.trim().length === 0) {
      console.log('Empty transcript, skipping processing');
      return;
    }
    
    // Get the current tab's info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('Current tab:', tab);
    
    // Create initial note with basic processing for INSTANT display
    const initialNote = {
      id: Date.now(),
      created: new Date().toLocaleString(),
      summary: transcript.trim(),
      tags: extractKeywords(transcript),
      actions: extractActionItems(transcript),
      url: tab.url,
      urlTitle: tab.title,
      confidence: 'processing',
      insights: [],
      isProcessing: true
    };
    
    console.log('Created initial note for instant display:', initialNote);

    // Save and display the note IMMEDIATELY
    await saveNote(initialNote);
    renderNote(initialNote, true); // 'true' = prepend to top of list
    
    console.log('Note displayed instantly, now enhancing with AI...');

    // Now enhance with Chrome AI in the background
    try {
      const enhancedData = await processWithChromeAI(transcript);
      
      // Update the note with enhanced data
      const enhancedNote = {
        ...initialNote,
        summary: enhancedData.summary || initialNote.summary,
        tags: enhancedData.tags || initialNote.tags,
        actions: enhancedData.actions || initialNote.actions,
        confidence: enhancedData.confidence || 'high',
        insights: enhancedData.insights || [],
        isProcessing: false
      };
      
      console.log('Enhanced note with Chrome AI:', enhancedNote);
      
      // Update the saved note
      await updateNote(enhancedNote);
      
      // Update the UI with enhanced data
      updateNoteInUI(enhancedNote);
      
    } catch (aiError) {
      console.log('AI enhancement failed, keeping basic processing:', aiError);
      // Update note to show processing complete
      const finalNote = {
        ...initialNote,
        confidence: 'medium',
        isProcessing: false
      };
      await updateNote(finalNote);
      updateNoteInUI(finalNote);
    }

  } catch (error) {
    console.error("Failed to process transcript:", error);
    showError("Failed to process your audio. Please try again.");
  }
}

// Process transcript using Chrome's built-in AI APIs with improved implementation
async function processWithChromeAI(transcript) {
  try {
    console.log('Processing with Chrome AI APIs:', transcript);
    
    // Check if Chrome AI APIs are available
    if (typeof chrome.ai === 'undefined') {
      console.log('Chrome AI APIs not available, using enhanced local processing');
      return await enhancedLocalProcessing(transcript);
    }

    // Use Chrome's prompt API for enhanced processing
    const promptResult = await chrome.ai.prompt({
      text: `You are an AI assistant that analyzes voice transcripts. Please analyze this transcript and provide a structured response.

TRANSCRIPT: "${transcript}"

Please provide:
1. A concise, professional summary (max 80 words)
2. 5-7 relevant keywords/tags
3. Specific actionable tasks (break down complex sentences)
4. Confidence level (high/medium/low)
5. 2-3 key insights

Respond ONLY with valid JSON in this exact format:
{
  "summary": "Brief professional summary here",
  "tags": ["keyword1", "keyword2", "keyword3"],
  "actions": ["Specific action 1", "Specific action 2"],
  "confidence": "high",
  "insights": ["Insight 1", "Insight 2"]
}`
    });

    console.log('Chrome AI prompt result:', promptResult);

    // Parse the AI response
    let processedData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = promptResult.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        processedData = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed AI response:', processedData);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.log('Failed to parse AI response, using enhanced local processing');
      return await enhancedLocalProcessing(transcript);
    }

    // Validate and clean the data
    processedData = validateAndCleanAIData(processedData, transcript);
    
    console.log('Final processed data:', processedData);
    return processedData;

  } catch (error) {
    console.error('Chrome AI processing failed:', error);
    return await enhancedLocalProcessing(transcript);
  }
}

// Enhanced local processing when Chrome AI is not available
async function enhancedLocalProcessing(transcript) {
  console.log('Using enhanced local processing');
  
  // Create a more sophisticated summary
  const summary = createSmartSummary(transcript);
  
  // Enhanced keyword extraction
  const tags = extractEnhancedKeywords(transcript);
  
  // Better action item extraction
  const actions = extractEnhancedActionItems(transcript);
  
  // Generate insights
  const insights = generateInsights(transcript, actions);
  
  return {
    summary,
    tags,
    actions,
    confidence: 'medium',
    insights
  };
}

// Create a smart summary
function createSmartSummary(transcript) {
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length === 1) {
    return sentences[0].trim();
  }
  
  // Extract key information
  const words = transcript.toLowerCase().split(/\s+/);
  const actionWords = words.filter(word => 
    ['need', 'have', 'must', 'should', 'want', 'plan', 'going', 'will'].includes(word)
  );
  
  if (actionWords.length > 0) {
    return `Planning and organizing tasks: ${sentences.slice(0, 2).join('. ')}.`;
  }
  
  return sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '...' : '');
}

// Enhanced keyword extraction
function extractEnhancedKeywords(transcript) {
  const words = transcript.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  // Remove common words
  const stopWords = ['this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'there', 'could', 'other', 'after', 'first', 'well', 'also', 'where', 'much', 'some', 'very', 'when', 'here', 'just', 'into', 'over', 'think', 'more', 'your', 'work', 'know', 'good', 'make', 'take', 'come', 'look', 'want', 'need', 'help', 'like', 'feel', 'seem', 'keep', 'give', 'find', 'tell', 'ask', 'turn', 'move', 'play', 'run', 'walk', 'talk', 'call', 'open', 'close', 'start', 'stop', 'go', 'get', 'put', 'use', 'see', 'hear', 'feel', 'taste', 'smell'];
  
  const filteredWords = words.filter(word => !stopWords.includes(word));
  
  // Get unique words and limit to 6
  return [...new Set(filteredWords)].slice(0, 6);
}

// Enhanced action item extraction
function extractEnhancedActionItems(transcript) {
  const sentences = transcript.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  const actions = [];
  
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    
    // Check for action patterns
    if (lowerSentence.includes('need to') || lowerSentence.includes('have to') || 
        lowerSentence.includes('should') || lowerSentence.includes('must') ||
        lowerSentence.includes('remember to') || lowerSentence.includes('don\'t forget')) {
      
      // Break down complex sentences
      const tasks = breakDownSentence(sentence);
      actions.push(...tasks);
    }
    
    // Check for direct action verbs
    const actionVerbs = ['send', 'email', 'call', 'meet', 'prepare', 'create', 'write', 'review', 'analyze', 'complete', 'finish', 'submit', 'deliver', 'read', 'study', 'learn'];
    actionVerbs.forEach(verb => {
      if (lowerSentence.includes(verb)) {
        const action = `• ${sentence.trim()}`;
        if (!actions.includes(action)) {
          actions.push(action);
        }
      }
    });
  });
  
  return [...new Set(actions)].slice(0, 5);
}

// Generate insights
function generateInsights(transcript, actions) {
  const insights = [];
  
  if (actions.length > 2) {
    insights.push('Multiple tasks identified requiring organization');
  }
  
  if (transcript.toLowerCase().includes('tomorrow') || transcript.toLowerCase().includes('next week')) {
    insights.push('Time-sensitive tasks with deadlines');
  }
  
  if (transcript.toLowerCase().includes('manager') || transcript.toLowerCase().includes('team')) {
    insights.push('Tasks involving collaboration or reporting');
  }
  
  return insights.slice(0, 3);
}

// Validate and clean AI data
function validateAndCleanAIData(data, transcript) {
  // Ensure required fields exist
  const cleaned = {
    summary: data.summary || transcript.trim(),
    tags: Array.isArray(data.tags) ? data.tags.slice(0, 6) : extractEnhancedKeywords(transcript),
    actions: Array.isArray(data.actions) ? data.actions.map(action => 
      action.startsWith('•') ? action : `• ${action}`
    ).slice(0, 5) : extractEnhancedActionItems(transcript),
    confidence: ['high', 'medium', 'low'].includes(data.confidence) ? data.confidence : 'medium',
    insights: Array.isArray(data.insights) ? data.insights.slice(0, 3) : []
  };
  
  return cleaned;
}

// Extract keywords from transcript
function extractKeywords(transcript) {
  // Simple keyword extraction - in a real app, you'd use more sophisticated NLP
  const words = transcript.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'there', 'could', 'other', 'after', 'first', 'well', 'also', 'where', 'much', 'some', 'very', 'when', 'here', 'just', 'into', 'over', 'think', 'more', 'your', 'work', 'know', 'good', 'make', 'take', 'come', 'look', 'want', 'need', 'help', 'like', 'feel', 'seem', 'keep', 'give', 'find', 'tell', 'ask', 'turn', 'move', 'play', 'run', 'walk', 'talk', 'call', 'open', 'close', 'start', 'stop', 'go', 'get', 'put', 'use', 'see', 'hear', 'feel', 'taste', 'smell'].includes(word));
  
  return [...new Set(words)].slice(0, 5); // Remove duplicates and limit to 5
}

// Extract action items from transcript
function extractActionItems(transcript) {
  const actionWords = ['need to', 'should', 'must', 'have to', 'remember to', 'don\'t forget', 'todo', 'task', 'action', 'send', 'email', 'call', 'meet', 'prepare', 'create', 'write', 'review', 'analyze', 'complete', 'finish', 'submit', 'deliver'];
  
  // Split into sentences and clean them
  const sentences = transcript
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  const actionItems = [];
  
  // Process each sentence
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    
    // Check if sentence contains action words
    const hasActionWord = actionWords.some(word => lowerSentence.includes(word));
    
    if (hasActionWord) {
      // Try to break down complex sentences into specific tasks
      const tasks = breakDownSentence(sentence);
      actionItems.push(...tasks);
    }
  });
  
  // Remove duplicates and limit to 5
  return [...new Set(actionItems)].slice(0, 5);
}

// Break down a complex sentence into specific actionable tasks
function breakDownSentence(sentence) {
  const tasks = [];
  const lowerSentence = sentence.toLowerCase();
  
  // Common patterns for actionable tasks
  const patterns = [
    // "I have to X and Y" -> ["I have to X", "I have to Y"]
    /i have to ([^,]+?)(?:\s+and\s+([^,]+?))?(?:\s+and\s+([^,]+?))?/gi,
    // "I need to X, Y, and Z" -> ["I need to X", "I need to Y", "I need to Z"]
    /i need to ([^,]+?)(?:,\s*([^,]+?))?(?:,\s*and\s+([^,]+?))?/gi,
    // "Send X to Y" -> ["Send X to Y"]
    /send ([^,]+?) to ([^,]+?)/gi,
    // "Email X about Y" -> ["Email X about Y"]
    /email ([^,]+?) about ([^,]+?)/gi,
    // "Call X" -> ["Call X"]
    /call ([^,]+?)/gi,
    // "Meet with X" -> ["Meet with X"]
    /meet with ([^,]+?)/gi,
    // "Prepare X" -> ["Prepare X"]
    /prepare ([^,]+?)/gi,
    // "Create X" -> ["Create X"]
    /create ([^,]+?)/gi,
    // "Write X" -> ["Write X"]
    /write ([^,]+?)/gi,
    // "Review X" -> ["Review X"]
    /review ([^,]+?)/gi,
    // "Analyze X" -> ["Analyze X"]
    /analyze ([^,]+?)/gi,
    // "Complete X" -> ["Complete X"]
    /complete ([^,]+?)/gi,
    // "Finish X" -> ["Finish X"]
    /finish ([^,]+?)/gi,
    // "Submit X" -> ["Submit X"]
    /submit ([^,]+?)/gi,
    // "Deliver X" -> ["Deliver X"]
    /deliver ([^,]+?)/gi
  ];
  
  // Try to match patterns
  patterns.forEach(pattern => {
    const matches = [...sentence.matchAll(pattern)];
    matches.forEach(match => {
      if (match[1]) {
        const task = `• ${match[0].trim()}`;
        if (!tasks.includes(task)) {
          tasks.push(task);
        }
      }
    });
  });
  
  // If no patterns matched, try to split by common conjunctions
  if (tasks.length === 0) {
    const conjunctions = [' and ', ' then ', ' after that ', ' next ', ' also '];
    let currentSentence = sentence;
    
    conjunctions.forEach(conj => {
      if (currentSentence.toLowerCase().includes(conj)) {
        const parts = currentSentence.split(conj);
        parts.forEach(part => {
          const trimmed = part.trim();
          if (trimmed.length > 10) { // Only include substantial parts
            tasks.push(`• ${trimmed}`);
          }
        });
      }
    });
  }
  
  // If still no tasks, create a single task from the sentence
  if (tasks.length === 0) {
    tasks.push(`• ${sentence.trim()}`);
  }
  
  return tasks;
}

// Reset recording state
function resetRecordingState() {
  isRecording = false;
  recordButton.disabled = false;
  recordButtonText.textContent = 'RECORD';
  loadingIndicator.classList.add('hidden');
  
  // Clear any existing timeout
  if (recordingTimeout) {
    clearTimeout(recordingTimeout);
    recordingTimeout = null;
  }
}

// Request microphone permission
async function requestMicrophonePermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately - we just needed permission
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
}

// --- 1. Load existing notes from storage when panel opens ---
window.addEventListener('load', () => {
  // Initialize speech recognition
  if (!initializeSpeechRecognition()) {
    showError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
    return;
  }

  chrome.storage.local.get('notes', (data) => {
    if (data.notes && Array.isArray(data.notes)) {
      if (data.notes.length === 0) {
        showEmptyState();
      } else {
        data.notes.forEach(note => renderNote(note, false)); // 'false' = append
      }
    } else {
      showEmptyState();
    }
  });
});

// --- 2. The main event: clicking the Record button ---
recordButton.addEventListener('click', async () => {
  if (isRecording) {
    return; // Prevent multiple clicks
  }

  if (!recognition) {
    showError("Speech recognition not available. Please refresh the extension.");
    return;
  }

  // Request microphone permission first
  const hasPermission = await requestMicrophonePermission();
  if (!hasPermission) {
    showError('Microphone access is required for voice recording. Please allow microphone access in your browser settings and try again.');
    return;
  }

  isRecording = true;
  recordButton.disabled = true;
  recordButtonText.textContent = 'Listening...';
  loadingIndicator.classList.remove('hidden');
  emptyState.classList.add('hidden');

  // Set a timeout to stop recording after 30 seconds
  recordingTimeout = setTimeout(() => {
    console.log('Recording timeout reached, stopping recognition');
    if (recognition) {
      recognition.stop();
    }
    showError('Recording timeout. Please try again.');
  }, 30000);

  try {
    recognition.start();
  } catch (error) {
    console.error("Failed to start speech recognition:", error);
    showError("Failed to start recording. Please try again.");
    resetRecordingState();
  }
});

// --- 3. Helper Function: Renders a note object to the HTML ---
// EXTREME BOLD DESIGN WITH SPICY ANIMATIONS
function renderNote(note, prepend = false) {
  const noteElement = document.createElement('div');
  
  // Extreme card styling with multiple layers and animations
  noteElement.className = "note-card";
  
  // Add animated background elements
  noteElement.innerHTML = `
    <!-- Animated background gradient -->
    <div class="note-card-bg"></div>
    
    <!-- Floating particles effect -->
    <div class="note-particles">
      <div class="note-particle note-particle-1"></div>
      <div class="note-particle note-particle-2"></div>
      <div class="note-particle note-particle-3"></div>
    </div>
  `;
  
  // Format tags with extreme styling
  const tagsHtml = note.tags.map((tag, index) => 
    `<span class="tag" style="animation-delay: ${index * 0.2}s;">${tag}</span>`
  ).join(' ');
  
  // Format action items with extreme styling
  const actionsHtml = note.actions.length > 0
    ? `<div class="action-section">
         <h4 class="action-header">
           <div class="action-icon">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <path d="M9 12l2 2 4-4"></path>
             </svg>
           </div>
           <span class="action-title">ACTION ITEMS</span>
         </h4>
         <div class="action-list">
           ${note.actions.map((action, index) => 
             `<div class="action-item">
                <div class="action-bullet" style="animation-delay: ${index * 0.1}s;"></div>
                <span>${action.replace('• ', '')}</span>
              </div>`
           ).join('')}
         </div>
       </div>`
    : '';

  // Format insights with Chrome AI styling
  const insightsHtml = note.insights && note.insights.length > 0
    ? `<div class="insights-section">
         <h4 class="insights-header">
           <div class="insights-icon">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
             </svg>
           </div>
           <span class="insights-title">AI INSIGHTS</span>
           <div class="confidence-badge confidence-${note.confidence || 'medium'}">${(note.confidence || 'medium').toUpperCase()}</div>
         </h4>
         <div class="insights-list">
           ${note.insights.map((insight, index) => 
             `<div class="insight-item">
                <div class="insight-bullet" style="animation-delay: ${index * 0.1}s;"></div>
                <span>${insight}</span>
              </div>`
           ).join('')}
         </div>
       </div>`
    : '';

  // Enhanced source link styling
  const sourceHtml = note.url 
    ? `<a href="${note.url}" target="_blank" class="source-link" title="${note.urlTitle}">
         <div class="source-content">
           <div class="source-icon">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
               <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
             </svg>
           </div>
           <div class="source-text">
             <p class="source-label">SOURCE</p>
             <p class="source-title">${note.urlTitle ? note.urlTitle.substring(0, 50) : 'Active Tab'}${note.urlTitle && note.urlTitle.length > 50 ? '...' : ''}</p>
           </div>
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="source-arrow">
             <path d="M7 17L17 7"></path>
             <path d="M7 7h10v10"></path>
           </svg>
         </div>
       </a>`
    : '';

  // Set the main content with extreme styling
  const mainContent = document.createElement('div');
  mainContent.className = 'note-content';
  mainContent.innerHTML = `
    <div class="note-header">
      <div class="note-text-section">
        <p class="note-summary">${note.summary}</p>
        <p class="note-date">${note.created}</p>
      </div>
      <button class="delete-button" data-note-id="${note.id}" title="Delete note">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        </svg>
      </button>
    </div>
    ${actionsHtml}
    ${insightsHtml}
    <div class="tag-container">${tagsHtml}</div>
    ${sourceHtml}
  `;
  
  noteElement.appendChild(mainContent);
  
  // Add delete functionality
  const deleteBtn = noteElement.querySelector('.delete-button');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteNote(note.id);
    noteElement.classList.add('note-exit');
    setTimeout(() => {
      noteElement.remove();
      checkEmptyState();
    }, 300);
  });
  
  // Add animation classes
  if (prepend) {
    notesList.prepend(noteElement);
    noteElement.classList.add('note-enter');
  } else {
    notesList.appendChild(noteElement);
  }
  
  // Add processing class if note is being processed
  if (note.isProcessing) {
    noteElement.classList.add('processing');
  }
}

// --- 4. Helper Function: Saves a new note to local storage ---
async function saveNote(note) {
  try {
    const { notes = [] } = await chrome.storage.local.get('notes');
    const updatedNotes = [note, ...notes]; // Add new note to the beginning
    await chrome.storage.local.set({ notes: updatedNotes });
  } catch (error) {
    console.error("Failed to save note:", error);
    showError("Failed to save note. Please try again.");
  }
}

// --- 4.1. Helper Function: Updates an existing note ---
async function updateNote(updatedNote) {
  try {
    const { notes = [] } = await chrome.storage.local.get('notes');
    const noteIndex = notes.findIndex(note => note.id === updatedNote.id);
    
    if (noteIndex !== -1) {
      notes[noteIndex] = updatedNote;
      await chrome.storage.local.set({ notes });
      console.log('Note updated successfully');
    } else {
      console.error('Note not found for update');
    }
  } catch (error) {
    console.error("Failed to update note:", error);
  }
}

// --- 4.2. Helper Function: Updates note in UI ---
function updateNoteInUI(updatedNote) {
  try {
    // Find the note element in the UI
    const noteElement = document.querySelector(`[data-note-id="${updatedNote.id}"]`);
    if (!noteElement) {
      console.error('Note element not found in UI');
      return;
    }
    
    // Find the note card container
    const noteCard = noteElement.closest('.note-card');
    if (!noteCard) {
      console.error('Note card not found');
      return;
    }
    
    // Update the content
    const noteContent = noteCard.querySelector('.note-content');
    if (noteContent) {
      // Update summary
      const summaryElement = noteContent.querySelector('.note-summary');
      if (summaryElement) {
        summaryElement.textContent = updatedNote.summary;
      }
      
      // Update tags
      const tagContainer = noteContent.querySelector('.tag-container');
      if (tagContainer) {
        const tagsHtml = updatedNote.tags.map((tag, index) => 
          `<span class="tag" style="animation-delay: ${index * 0.2}s;">${tag}</span>`
        ).join(' ');
        tagContainer.innerHTML = tagsHtml;
      }
      
      // Update actions
      const actionSection = noteContent.querySelector('.action-section');
      if (actionSection && updatedNote.actions.length > 0) {
        const actionsHtml = `
          <h4 class="action-header">
            <div class="action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 12l2 2 4-4"></path>
              </svg>
            </div>
            <span class="action-title">ACTION ITEMS</span>
          </h4>
          <div class="action-list">
            ${updatedNote.actions.map((action, index) => 
              `<div class="action-item">
                 <div class="action-bullet" style="animation-delay: ${index * 0.1}s;"></div>
                 <span>${action.replace('• ', '')}</span>
               </div>`
            ).join('')}
          </div>
        `;
        actionSection.innerHTML = actionsHtml;
      }
      
      // Update insights
      const insightsSection = noteContent.querySelector('.insights-section');
      if (updatedNote.insights && updatedNote.insights.length > 0) {
        if (!insightsSection) {
          // Create insights section if it doesn't exist
          const insightsHtml = `
            <div class="insights-section">
              <h4 class="insights-header">
                <div class="insights-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                </div>
                <span class="insights-title">AI INSIGHTS</span>
                <div class="confidence-badge confidence-${updatedNote.confidence || 'medium'}">${(updatedNote.confidence || 'medium').toUpperCase()}</div>
              </h4>
              <div class="insights-list">
                ${updatedNote.insights.map((insight, index) => 
                  `<div class="insight-item">
                     <div class="insight-bullet" style="animation-delay: ${index * 0.1}s;"></div>
                     <span>${insight}</span>
                   </div>`
                ).join('')}
              </div>
            </div>
          `;
          
          // Insert insights section after actions
          const actionSection = noteContent.querySelector('.action-section');
          if (actionSection) {
            actionSection.insertAdjacentHTML('afterend', insightsHtml);
          } else {
            // Insert after note header if no actions
            const noteHeader = noteContent.querySelector('.note-header');
            if (noteHeader) {
              noteHeader.insertAdjacentHTML('afterend', insightsHtml);
            }
          }
        } else {
          // Update existing insights section
          const insightsList = insightsSection.querySelector('.insights-list');
          if (insightsList) {
            insightsList.innerHTML = updatedNote.insights.map((insight, index) => 
              `<div class="insight-item">
                 <div class="insight-bullet" style="animation-delay: ${index * 0.1}s;"></div>
                 <span>${insight}</span>
               </div>`
            ).join('');
          }
          
          // Update confidence badge
          const confidenceBadge = insightsSection.querySelector('.confidence-badge');
          if (confidenceBadge) {
            confidenceBadge.className = `confidence-badge confidence-${updatedNote.confidence || 'medium'}`;
            confidenceBadge.textContent = (updatedNote.confidence || 'medium').toUpperCase();
          }
        }
      }
      
      // Add processing indicator removal
      if (!updatedNote.isProcessing) {
        noteCard.classList.remove('processing');
      }
    }
    
    console.log('Note UI updated successfully');
    
  } catch (error) {
    console.error('Failed to update note in UI:', error);
  }
}

// --- 5. Helper Function: Delete a note ---
async function deleteNote(noteId) {
  try {
    const { notes = [] } = await chrome.storage.local.get('notes');
    const updatedNotes = notes.filter(note => note.id !== noteId);
    await chrome.storage.local.set({ notes: updatedNotes });
  } catch (error) {
    console.error("Failed to delete note:", error);
    showError("Failed to delete note. Please try again.");
  }
}

// --- 6. Helper Function: Show empty state ---
function showEmptyState() {
  emptyState.classList.remove('hidden');
  notesList.classList.add('hidden');
}

// --- 7. Helper Function: Check if we should show empty state ---
function checkEmptyState() {
  const notes = notesList.querySelectorAll('.group');
  if (notes.length === 0) {
    showEmptyState();
  }
}

// --- 8. Helper Function: Show error message ---
function showError(message) {
  // Create a temporary error notification
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-notification';
  errorDiv.innerHTML = `
    <div class="error-content">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="error-icon">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      <span class="error-text">${message}</span>
    </div>
  `;
  
  document.body.appendChild(errorDiv);
  
  // Remove after 5 seconds with fade out
  setTimeout(() => {
    errorDiv.style.opacity = '0';
    errorDiv.style.transform = 'translateX(100%)';
    setTimeout(() => {
      errorDiv.remove();
    }, 300);
  }, 5000);
}