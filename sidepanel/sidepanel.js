const sessionDisplay = document.querySelector("#sessionsList");

document
    .querySelector("#sessionPrint")
    .addEventListener("click", printSessions);

async function printSessions() {
    sessionDisplay.innerHTML = "";
    await chrome.storage.local.get().then((storage) => {
        console.log("sessions stockées : ", storage);
        for (let session in storage) {
            console.log(session);
            sessionDisplay.innerHTML += `<div class="session">${session}</div>`;
        }
    });
}

// sauvegarder une nouvelle session
document
    .querySelector("#sessionSave")
    .addEventListener("click", handleNewSession);

async function handleNewSession() {
    // get newSession name
    const newSessionTitle = document.getElementById("newSessionTitle").value;
    // send message with this name to background => so it get current tabs & saves  it as a new session
    await chrome.runtime.sendMessage({
        type: "toSave",
        newTitle: newSessionTitle,
    });

    // get currentSession newly stored in chrome.storage and print it
    printSessions();
}

sessionDisplay.addEventListener("click", function (event) {
    openSession(event.target.textContent);

    // if (event.target.parentNode.className === "delete") {
    //     console.log("on va supprimer un truc");
    //     deleteWord(event);
    // } else if (event.target.parentNode.className === "saveTranslation") {
    //     saveTranslation(event); // TODO
    // } else if (event.target.parentNode.className === "launchSearch") {
    //     lookupWord(event.target.dataset.word);
    // }
});

async function openSession(sessionTitle) {
    // obtenir le storage pour la session désirée
    const tabsArray = await chrome.storage.local.get()
        .then((storage) => storage[sessionTitle]);
    // obtenir la liste des urls à ouvrir
        const urls = tabsArray.map((tab) => tab.URL);
    // 
    chrome.windows.create({ focused:false, url: urls})
}
