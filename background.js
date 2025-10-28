// This script ensures that when the user clicks the 
// extension icon, the side panel opens.
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});