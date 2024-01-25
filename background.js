// SIDEPANEL : ouvrir le sidePanel au clic sur l'icône
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(console.error);

// le raccourci permet de déclencher la sauvegarde de la session
chrome.commands.onCommand.addListener(handleCurrentSession);

async function handleCurrentSession(newName) {
    await getTabs().then((currentSession) =>
        saveCurrentSession(currentSession, newName)
    );
}

async function getTabs() {
    // obtenir la liste des tabs
    let tabsList = await chrome.tabs.query({ currentWindow: true });
    return tabsList.map((tab) => {
        return { tab: tab.title, URL: tab.url };
    });
}

async function saveCurrentSession(session, name) {
    await chrome.storage.local.set({ [name]: session });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === "toSave") {
        // save the currentSession
        handleCurrentSession(request.newTitle);
        console.log(chrome.storage.local.get([request.newTitle]));
    }
});

function openSession(session) {}

function clearStorage() {}

function deleteSession(session) {}
