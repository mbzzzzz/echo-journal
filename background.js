// This script ensures that when the user clicks the 
// extension icon, the side panel opens.
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Handle scheduled reminders
chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    if (!alarm?.name?.startsWith('echo-reminder:')) return;
    const parts = alarm.name.split(':');
    // echo-reminder:<noteId>:<actionIndex>
    const noteId = Number(parts[1]);
    const actionIndex = Number(parts[2]);
    const { notes = [] } = await chrome.storage.local.get('notes');
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const actionText = note.actions?.[actionIndex] || 'Task';

    chrome.notifications.create(`echo-reminder-${noteId}-${actionIndex}`, {
      type: 'basic',
      iconUrl: 'images/icon128.png',
      title: 'Echo Reminder',
      message: actionText.replace(/^•\s*/, ''),
      priority: 2
    });
  } catch (e) {
    // no-op
  }
});