const sessionDisplay = document.querySelector("#sessionsList");

const template = document.getElementById("sessionTemplate");

document
    .querySelector("#sessionPrint")
    .addEventListener("click", printSessions);

async function printSessions() {
    sessionDisplay.innerHTML = "";
    await chrome.storage.local.get().then((storage) => {
        console.log("sessions stockées : ", storage);
        for (let session in storage) {
            let element = template.content.cloneNode(true);
            element.querySelector(".sessionName").textContent = session;
            sessionDisplay.appendChild(element);
        }
    });
}

// sauvegarder une nouvelle session
document
    .querySelector("#sessionSave")
    .addEventListener("click", handleNewSession);

async function handleNewSession() {
    // get newSession name
    const inputBox = document.getElementById("newSessionTitle")
    const newSessionTitle = inputBox.value;
    inputBox.value = ""
    // send message with this name to background => so it get current tabs & saves  it as a new session
    if (newSessionTitle) {
        await chrome.runtime.sendMessage({
            type: "toSave",
            newTitle: newSessionTitle,
        });

        // get currentSession newly stored in chrome.storage and print it
        printSessions();
    }

}

sessionDisplay.addEventListener("click", function (event) {
    console.log(event.target.className);
    if (event.target.parentNode.className === "deleteSession") {
        deleteSession(event);
    } else if (event.target.className === "sessionName") {
        openSession(event.target.textContent);
    }
});

async function openSession(sessionTitle) {
    // obtenir le storage pour la session désirée
    const tabsArray = await chrome.storage.local
        .get()
        .then((storage) => storage[sessionTitle]);
    // obtenir la liste des urls à ouvrir
    const urls = tabsArray.map((tab) => tab.URL);

    // ouvrir la fenêtre avec les onglets de la session
    chrome.windows.create({ focused: true, state:"maximized", url: urls });
    // CHECK : si un seul onglet est ouvert et qu'il s'agit d'un onglet newTab ou d'un onglet de recherche Google
    await chrome.windows.getCurrent({populate:true}).then(window => {
        if (window.tabs.length === 1 && (window.tabs[0].url === "chrome://extensions/" || window.tabs[0].url === "chrome://newtab/")) {
            console.log("à supprimer");
            chrome.windows.remove(window.id)
        }
    })
    
}

async function deleteSession(event) {
    const sessionName = event.target.parentNode.parentNode.querySelector(".sessionName").textContent
    // supprimer la session de la base de données
    await chrome.storage.local.remove(sessionName)
    // actualiser l'affichage de la liste
    printSessions()
}


function deleteList(event) {

}



