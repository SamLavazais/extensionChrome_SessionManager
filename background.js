chrome.commands.onCommand.addListener(async () => {
    let currentSession = await getTabs();
    await saveSession(currentSession, "newSession1");
});



async function getTabs() {
    // obtenir la liste des tabs
    const tabFilters = {
        currentWindow: true,
        // highlighted: true, // à supprimer ou à indiquer en option pour l'utilisateur ?
    };
    let tabsList = await chrome.tabs.query(tabFilters);
    return tabsList.map((tab) => {
        return { tab: tab.title, URL: tab.url };
    });
}

async function saveSession(session, name) {
    // sauvegarder les tabs dans le storage
    await chrome.storage.local.get()
        .then((storage) => [
            ...storage.sessionsList,
            { title: name, tabs: session },
        ])
        .then((updatedList) => {
            console.log(updatedList)
            chrome.storage.local.set({ sessionsList: updatedList });
        });
}



function openSession(session){

}

function clearStorage(){

}

function deleteSession(session){

}