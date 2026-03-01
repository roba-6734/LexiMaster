/**
 * Background Script - Handles context menu and API communication
 */

// API Configuration
const hostPermissions = chrome.runtime.getManifest().host_permissions || [];
const normalizedApiHosts = hostPermissions.map((host) => host.replace('/*', ''));
const localApiHost = normalizedApiHosts.find((host) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(host));
const preferredApiHost = localApiHost || normalizedApiHosts.find((host) => host.startsWith('https://')) || normalizedApiHosts[0] || '';
const API_BASE_URL = preferredApiHost;

async function parseJsonSafe(response) {
    const text = await response.text();
    if (!text) {
        return {};
    }
    try {
        return JSON.parse(text);
    } catch {
        return {};
    }
}

function normalizeSelectedWord(rawText) {
    if (!rawText) return '';
    const trimmed = rawText.trim();
    if (!trimmed) return '';
    const firstToken = trimmed.split(/\s+/)[0];
    return firstToken.replace(/^[^a-zA-Z]+|[^a-zA-Z'-]+$/g, '');
}

// Context menu IDs
const CONTEXT_MENU_IDS = {
    ADD_WORD: 'add-word-to-vocabulary',
     LOOKUP_WORD: 'lookup-word-definition',
     CHECK_AUTH: 'check-authentication-status'
};

// Initialize extension
chrome.runtime.onInstalled.addListener(( ) => {
    //console.log('🚀 WordMaster extension installed');
    createContextMenus();
});

// Create context menus
function createContextMenus() {
    // Remove existing menus
    chrome.contextMenus.removeAll(() => {
        // Add word to vocabulary
        chrome.contextMenus.create({
            id: CONTEXT_MENU_IDS.ADD_WORD,
            title: "Add '%s' to WordMaster",
            contexts: ["selection"],
            documentUrlPatterns: ["http://*/*", "https://*/*"]
        } );

        // Look up word definition
        chrome.contextMenus.create({
            id: CONTEXT_MENU_IDS.LOOKUP_WORD,
            title: "Look up '%s' definition",
            contexts: ["selection"],
            documentUrlPatterns: ["http://*/*", "https://*/*"]
        } );

        chrome.contextMenus.create({
            id: CONTEXT_MENU_IDS.CHECK_AUTH,
            title: "Check authentication status",
            contexts: ["action"]
        } );

        //console.log('✅ Context menus created');
    });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const selectedText = info.selectionText?.trim();
    const normalizedWord = normalizeSelectedWord(selectedText);
    
    if (info.menuItemId !== CONTEXT_MENU_IDS.CHECK_AUTH && !normalizedWord) {
        console.error('❌ No text selected');
        await showNotification(tab?.id, 'Please select a single word first', 'warning');
        return;
    }

    //console.log(`🔤 Context menu clicked: ${info.menuItemId} for word: "${selectedText}"`);

    try {
        switch (info.menuItemId) {
            case CONTEXT_MENU_IDS.ADD_WORD:
                await handleAddWord(normalizedWord, tab);
                break;
            case CONTEXT_MENU_IDS.LOOKUP_WORD:
                await handleLookupWord(normalizedWord, tab);
                break;
            case CONTEXT_MENU_IDS.CHECK_AUTH:
                await checkAuthenticationStatus();
                break;
            default:
                console.error('❌ Unknown menu item:', info.menuItemId);
        }
    } catch (error) {
        console.error('❌ Context menu error:', error);
        await showNotification(tab?.id, `Error: ${error.message}`, 'error');
    }
});

// Handle adding word to vocabulary
async function handleAddWord(word, tab) {
    console.log(`📝 Adding word: "${word}"`);
    if (!word) {
        await showNotification(tab?.id, 'Please select a valid word first', 'warning');
        return { success: false, error: 'Invalid word' };
    }
    
    // Check authentication
    const authToken = await getAuthToken();
    if (!authToken) {
        await showNotification(tab?.id, 'Please login first by clicking the WordMaster icon', 'warning');
        return { success: false, error: 'Not authenticated' };
    }

    // Show loading notification
    await showNotification(tab?.id, `Adding "${word}" to your vocabulary...`, 'loading');

    try {
        // Call API to add word
        const response = await fetch(`${API_BASE_URL}/api/words/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                word: word.toLowerCase(),
                source: 'extension',
                source_url: tab?.url
            })
        });

        const result = await parseJsonSafe(response);

        if (response.ok && result.success) {
            // Success
            const wordData = result.data;
            const definitionCount = wordData.definitions?.length || 0;
            
            await showNotification(
                tab?.id, 
                `✅ "${wordData.word}" added! Found ${definitionCount} definitions.`, 
                'success'
            );

            // Update badge to show word count
            await updateBadge();

            console.log('✅ Word added successfully:', wordData);
            return { success: true, word: wordData.word };
        } else {
            // API error
            const errorMsg = result.detail || result.message || 'Failed to add word';
            await showNotification(tab?.id, `❌ ${errorMsg}`, 'error');
            console.error('❌ API error:', result);
            return { success: false, error: errorMsg };
        }
    } catch (error) {
        console.error('❌ Error adding word:', error);
        await showNotification(tab?.id, `❌ Network error: ${error.message}`, 'error');
        return { success: false, error: error.message };
    }
}

// Check authentication status
async function checkAuthenticationStatus() {
    try {
        const authToken = await getAuthToken();
        if (!authToken) {
            return { success: false, authenticated: false };
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const user = await parseJsonSafe(response);
            return { success: true, authenticated: true, user };
        } else {
            // Token might be expired
            await clearAuthToken();
            return { success: false, authenticated: false };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Handle looking up word definition
async function handleLookupWord(word, tab) {
    console.log(`🔍 Looking up word: "${word}"`);
    if (!word) {
        await showNotification(tab?.id, 'Please select a valid word first', 'warning');
        return;
    }
    
    // Show loading notification
    await showNotification(tab?.id, `Looking up "${word}"...`, 'loading');
    const authToken = await getAuthToken();
    const headers = {
        'Content-Type': 'application/json'
    };
    if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
    }

    try {
        // Call dictionary API directly (no auth needed for lookup)
        const response = await fetch(`${API_BASE_URL}/api/dictionary/lookup/${encodeURIComponent(word)}`,{
            method: 'GET',
            headers
        });
        const result = await parseJsonSafe(response);

        if (response.ok && result.success) {
            const definitions = result.data.definitions || [];
            if (definitions.length > 0) {
                const firstDef = definitions[0];
                const message = `📖 ${word} (${firstDef.partOfSpeech}): ${firstDef.definition}`;
                await showNotification(tab?.id, message, 'info', 8000); // Show longer for reading
            } else {
                await showNotification(tab?.id, result.message || `📖 "${word}" - No definition found`, 'warning');
            }
        } else if (response.ok) {
            await showNotification(tab?.id, result.message || `📖 "${word}" - No definition found`, 'warning');
        } else {
            const errorMsg = result.detail || result.message || `Could not find definition for "${word}"`;
            await showNotification(tab?.id, `❌ ${errorMsg}`, 'error');
        }
    } catch (error) {
        await showNotification(tab?.id, `❌ Lookup error: ${error.message}`, 'error');
        console.error('❌ Lookup error:', error);
    }
}

// Get authentication token from storage
async function getAuthToken() {
    try {
        const result = await chrome.storage.local.get(['authToken']);
        return result.authToken || null;
    } catch (error) {
        console.error('❌ Error getting auth token:', error);
        return null;
    }
}

// Save authentication token to storage
async function saveAuthToken(token) {
    try {
        await chrome.storage.local.set({ authToken: token });
        console.log('✅ Auth token saved');
    } catch (error) {
        console.error('❌ Error saving auth token:', error);
    }
}

// Clear authentication token
async function clearAuthToken() {
    try {
        await chrome.storage.local.remove(['authToken']);
        //console.log('✅ Auth token cleared');
    } catch (error) {
        //console.error('❌ Error clearing auth token:', error);
    }
}

// Show notification to user on the page
async function showNotification(tabId, message, type = 'info', duration = 3000) {
    if (!tabId) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'WordMaster',
            message: message
        });
        return;
    }
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: displayNotification,
            args: [message, type, duration]
        });
    } catch (error) {
        console.error('❌ Error showing notification:', error);
        // Fallback to browser notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'WordMaster',
            message: message
        });
    }
}

// Function to inject into page for showing notifications
function displayNotification(message, type, duration) {
    // Remove existing notification
    const existing = document.getElementById('wordmaster-notification');
    if (existing) {
        existing.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'wordmaster-notification';
    notification.className = `wordmaster-notification wordmaster-${type}`;
    const fallbackColors = {
        success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        loading: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
    };
    // Keep notification visible even if extension CSS is unavailable.
    notification.style.cssText = `position:fixed;top:20px;right:20px;z-index:2147483647;max-width:420px;min-width:280px;border-radius:8px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,.25);background:${fallbackColors[type] || fallbackColors.info};color:#fff;`;
    
    // Add icon based on type
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        loading: '⏳'
    };
    
    notification.innerHTML = `
        <div class="wordmaster-notification-content" style="display:flex;align-items:flex-start;padding:14px;gap:10px;">
            <span class="wordmaster-notification-icon" style="font-size:18px;line-height:1;">${icons[type] || 'ℹ️'}</span>
            <span class="wordmaster-notification-message" style="flex:1;line-height:1.35;word-break:break-word;">${message}</span>
            <button class="wordmaster-notification-close" style="background:none;border:none;color:inherit;font-size:18px;cursor:pointer;padding:0 2px;opacity:.9;" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto-remove after duration (except for loading)
    if (type !== 'loading') {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
    }
}

// Update extension badge with word count
async function updateBadge() {
    try {
        const authToken = await getAuthToken();
        if (!authToken) return;

        const response = await fetch(`${API_BASE_URL}/api/progress/stats`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const stats = await parseJsonSafe(response);
            const wordCount = stats.total_words_added || 0;
            
            // Show badge with word count
            chrome.action.setBadgeText({
                text: wordCount > 99 ? '99+' : wordCount.toString()
            });
            chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
        }
    } catch (error) {
        console.error('❌ Error updating badge:', error);
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Background received message:', request);

    switch (request.action) {
        case 'login':
            handleLogin(request.credentials)
                .then(result => sendResponse(result))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true; // Keep message channel open for async response

        case 'logout':
            handleLogout()
                .then(result => sendResponse(result))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;

        case 'getStats':
            getStats()
                .then(result => sendResponse(result))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;

        case 'checkAuth':
            checkAuth()
                .then(result => sendResponse(result))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;

        case 'addWordFromKeyboard':
            handleAddWord(normalizeSelectedWord(request.word), {
                id: sender?.tab?.id,
                url: request.url || sender?.tab?.url
            })
                .then((result) => sendResponse(result))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;

        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }
});


// Handle login from popup
async function handleLogin(credentials) {
    try {
        console.log('🔐 Attempting login with:', credentials);
        
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: credentials.email,
                password: credentials.password
            })
        });

        const result = await parseJsonSafe(response);
        console.log('Response.ok', response.ok)
        console.log('🔐 Login response:', result);

        if (response.ok && result.access_token) {
            await saveAuthToken(result.access_token);
            await updateBadge();
            const authStatus = await checkAuth();
            return { success: true, user: authStatus.user };
        } else {
            console.error('❌ Login failed:', result);
            return { success: false, error: result.detail || 'Login failed' };
        }
    } catch (error) {
        console.error('❌ Login network error:', error);
        return { success: false, error: error.message };
    }
}

// Handle logout
async function handleLogout() {
    try {
        await clearAuthToken();
        chrome.action.setBadgeText({ text: '' });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get user stats
async function getStats() {
    try {
        const authToken = await getAuthToken();
        if (!authToken) {
            return { success: false, error: 'Not authenticated' };
        }

        const response = await fetch(`${API_BASE_URL}/api/progress/stats`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const stats = await parseJsonSafe(response);
            return { success: true, stats };
        } else {
            const errorData = await parseJsonSafe(response);
            return { success: false, error: errorData.detail || `Failed to get stats (HTTP ${response.status})` };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Check authentication status
async function checkAuth() {
    try {
        const authToken = await getAuthToken();
        if (!authToken) {
            return { success: false, authenticated: false };
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const user = await parseJsonSafe(response);
            return { success: true, authenticated: true, user };
        } else {
            // Token might be expired
            await clearAuthToken();
            return { success: false, authenticated: false };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Initialize badge on startup
chrome.runtime.onStartup.addListener(() => {
    updateBadge();
});
