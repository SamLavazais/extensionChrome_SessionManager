// récupérer la div pour afficher la listes des sessions disponibles
const sessionDisplay = document.querySelector("#sessionsList");
// récupérer la div pour afficher la session actuelle
const currentSessionDisplay = document.body.querySelector("#currentSession");

async function main() {
    // si aucune paire n'est encore sauvegardée, créer une clé dans le storage
    await chrome.storage.local.get(async (storage) => {
        if (!storage["currentSessions"])
            await chrome.storage.local.set({ ["currentSessions"]: [] });
    });

    // afficher les sessions sauvegardées
    await printSessions();

    // afficher/updater le nom de la session actuelle (s'il y en a une)
    updateCurrentSessionNameDisplay();

    // permettre de sauvegarder une nouvelle session
    document
        .querySelector("#sessionSave")
        .addEventListener("click", handleNewSession);

    // écouter les clicks de l'utilisateur sur mon sidepanel
    sessionDisplay.addEventListener("click", (event) => {
        // console.log(event.target.className);
        if (event.target.className === "deleteSession") {
            deleteSession(event);
        } else if (event.target.className === "sessionName") {
            openSession(event.target.textContent);
        } else if (event.target.className === "showHideBtn") {
            console.log(event.target);
            showHideTabs(event);
        } else if (event.target.className === "deleteTab") {
            console.log(event.target);
            deleteTab(event);
        }
    });
}

main();

async function saveCurrentSession(windowId, sessionTitle) {
    // quand j'ouvre une session : enregistrer la windowId dans [currentSessions]
    // quand je crée une session : idem
    let storage = await chrome.storage.local.get();
    storage["currentSessions"].push({ name: sessionTitle, windowId: windowId });
    console.log("nouvelle session active", windowId, sessionTitle);
    await chrome.storage.local.set({
        currentSessions: storage["currentSessions"],
    });
    // await chrome.storage.local.get((data) => console.log(data));
    // quand j'enregistre une session : updater la session actuelle affichée
    await updateCurrentSessionNameDisplay();
}

async function updateCurrentSessionNameDisplay() {
    // obtenir l'id de la fenêtre active
    let thisWindow = await chrome.windows.getCurrent();
    // console.log(thisWindow.id);
    // obtenir la liste des sessions ouvertes actuellement
    await chrome.storage.local.get((storage) => {
        // console.log("currentsessions:", storage['currentSessions'])
        // console.log("thisWindow id:", thisWindow.id)
        const currentSession = storage["currentSessions"].find(
            (pair) => pair.windowId === thisWindow.id
        );
        // console.log("session de cette fenêtre", currentSession)
        if (currentSession) {
            // si le windowId de l'une d'entre elles correspond à la fenêtre active : afficher le nom
            currentSessionDisplay.innerHTML = `Session ouverte dans cette fenêtre : <div id="currentSessionName">${currentSession.name} </div>`;
        } else {
            // si non (à la fin de la boucle) : afficher "pas de session active" (ou rien ?)
            currentSessionDisplay.innerHTML = `Pas de session ouverte dans cette fenêtre.`;
        }
    });
}

async function printSessions() {
    sessionDisplay.innerHTML = "";
    await chrome.storage.local.get().then((storage) => {
        for (let session in storage) printSession(storage, session);
    });
}

function printSession(storage, session) {
    const template = document.getElementById("sessionTemplate");
    let element = template.content.cloneNode(true);
    element.querySelector(".sessionName").textContent = session;
    element.querySelector(
        ".tabsCount"
    ).textContent = `${storage[session].length} tabs`;
    element.querySelector(".deleteSession").dataset.name = session;
    element.querySelector(".tabsList").innerHTML = storage[session]
        .map(
            (
                tab // possibilité : ajouter l'URL dans le html ci-dessous : <div class="tabURL">${tab.URL}</div>
            ) =>
                `<div class="sessionTab" data-url=${tab.URL}>
                <div class="tabTitle">${tab.tab}</div>
                <img class="deleteTab" src="deleteBtn.svg" alt="">
            </div>`
        )
        .join("");
    sessionDisplay.appendChild(element);
}

function printTabsList(sessionName, tabsArray) {
    for (let session of [...document.querySelectorAll(".session")]) {
        // récupérer la div concernée dans le DOM grâce au nom
        if (session.querySelector(".sessionName").textContent === sessionName) {
            // récupérer sa tabslistDiv
            session.querySelector(
                ".tabsCount"
            ).textContent = `${tabsArray.length} tabs`;
            session.querySelector(".tabsList").innerHTML = tabsArray
                .map(
                    (
                        tab // possibilité : ajouter l'URL dans le html ci-dessous : <div class="tabURL">${tab.URL}</div>
                    ) =>
                        `<div class="sessionTab" data-url=${tab.URL}>
                    <div class="tabTitle">${tab.tab}</div>
                    <img class="deleteTab" src="deleteBtn.svg" alt="">
                </div>`
                )
                .join("");
            // return session;
        }
    }

    // print sa liste de tabs grâce à tabsArray
}

async function handleNewSession() {
    // get newSession name
    const inputBox = document.getElementById("newSessionTitle");
    const newSessionTitle = inputBox.value;
    // send message with this name to background => so it get current tabs & saves  it as a new session
    if (newSessionTitle) {
        await saveSession(newSessionTitle);
        await printSessions();
        inputBox.value = "";
    }
}

async function saveSession(name) {
    // obtenir la liste des tabs
    const [formattedTabsList, windowId] = await chrome.tabs
        .query({ currentWindow: true })
        .then((tabsList) => {
            return [
                tabsList.map((tab) => {
                    return { tab: tab.title, URL: tab.url };
                }),
                tabsList[0].windowId,
            ];
        });
    // console.log("windowId", windowId);
    // console.log(await chrome.tabs.query({ currentWindow: true }))
    // sauvegarder dans le storage
    await chrome.storage.local.set({ [name]: formattedTabsList });
    // updater
    await saveCurrentSession(windowId, name);
}

async function openSession(sessionTitle) {
    // obtenir le storage pour la session désirée
    const tabsArray = await chrome.storage.local
        .get()
        .then((storage) => storage[sessionTitle]);
    // obtenir la liste des urls à ouvrir
    const urls = tabsArray.map((tab) => tab.URL);

    // ouvrir la fenêtre avec les onglets de la session
    let newWindow = await chrome.windows.create({
        focused: true,
        state: "maximized",
        url: urls,
    });
    // CHECK : si un seul onglet est ouvert et qu'il s'agit d'un onglet newTab ou d'un onglet de recherche Google
    await chrome.windows.getCurrent({ populate: true }).then((window) => {
        const closingWindowConditions =
            window.tabs.length === 1 &&
            (window.tabs[0].url === "chrome://extensions/" ||
                window.tabs[0].url === "chrome://newtab/");
        if (closingWindowConditions) chrome.windows.remove(window.id);
    });
    console.log(newWindow.id);
    console.log(sessionTitle);
    await saveCurrentSession(newWindow.id, sessionTitle);
}

async function deleteSession(event) {
    const sessionName = event.target.dataset.name;
    await chrome.storage.local.remove(sessionName);
    // supprimer la paire dans le storage
    await deleteCurrentSessionPair(sessionName);
    // actualiser l'affichage
    updateCurrentSessionNameDisplay();
    printSessions();
}

// quand je supprime une session : supprimer la currentSession
async function deleteCurrentSessionPair(sessionName) {
    // récupérer la liste des paires
    const storage = await chrome.storage.local.get();
    // chercher celle dont le nom correspond à la session supprimée
    const updatedCurrentSessions = storage["currentSessions"].filter(
        (pair) => pair.name !== sessionName
    );
    // mettre à jour le storage
    await chrome.storage.local.set({
        ["currentSessions"]: updatedCurrentSessions,
    });
}

function showHideTabs(event) {
    let sessionTabsListHTML =
        event.target.parentNode.parentNode.querySelector(".tabsList");
    if (sessionTabsListHTML.className === "tabsList visible") {
        sessionTabsListHTML.className = "tabsList hidden";
        event.target.style.transform = "rotate(0deg)";
    } else {
        sessionTabsListHTML.className = "tabsList visible";
        event.target.style.transform = "rotate(90deg)";
    }
}

async function deleteTab(event) {
    // récupérer l'URL du tab
    let urlToDelete = event.target.parentNode.dataset.url;
    // obtenir le nom de la session concernée
    let targetSessionName =
        event.target.parentNode.parentNode.parentNode.querySelector(
            ".sessionName"
        ).textContent;

    // aller chercher dans le storage la session concernée
    await chrome.storage.local
        .get([targetSessionName])
        // supprimer le tab de la liste des tabs
        .then((storage) => {
            console.log(targetSessionName);
            console.log(storage[targetSessionName]);
            // pour chaque tab de la session
            console.log("urltodelete :", urlToDelete);
            for (let tab of storage[targetSessionName]) {
                console.log("tab :", tab);
                if (tab.URL === urlToDelete) {
                    // obtenir l'index du tab
                    const tabIndex = storage[targetSessionName].indexOf(tab);
                    console.log("index :", tabIndex);
                    // supprimer le tab de l'array avec splice
                    storage[targetSessionName].splice(tabIndex, 1);
                }
            }
            console.log(
                "session après suppression d'un url :",
                storage[targetSessionName]
            );
            return storage[targetSessionName];
        })
        .then(async (tabsList) => {
            // updater l'affichage
            printTabsList(targetSessionName, tabsList);
            // updater le storage
            await chrome.storage.local.set({ [targetSessionName]: tabsList });
        });
}

function deleteList(event) {}

// modifier la fonction de sauvegarde d'une paire
// ajouter la suppression d'une paire quand je supprime une session
