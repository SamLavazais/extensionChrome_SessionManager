const sessionDisplay = document.querySelector("#sessionsList");

printSessions();

// sauvegarder une nouvelle session
document
    .querySelector("#sessionSave")
    .addEventListener("click", handleNewSession);

sessionDisplay.addEventListener("click", function (event) {
    // console.log(event.target);
    // console.log(event.target.className);
    if (event.target.parentNode.className === "deleteSession") {
        deleteSession(event);
    } else if (event.target.className === "sessionName") {
        openSession(event.target.textContent);
    } else if (event.target.className === "showHideBtn") {
        showHideTabs(
            event.target.parentNode.parentNode.querySelector(".tabsList")
        );
    } else if (event.target.parentNode.className === "deleteTab") {
        deleteTab(event);
    }
});

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
    element.querySelector(".tabsList").innerHTML = storage[session]
        .map(
            (
                tab // possibilité : ajouter l'URL dans le html ci-dessous : <div class="tabURL">${tab.URL}</div>
            ) =>
                `<div class="sessionTab">
                <div class="tabTitle">${tab.tab}</div>
                <button class="deleteTab"><img src="deleteBtn.svg" alt=""></button>
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
                    <button class="deleteTab"><img src="deleteBtn.svg" alt=""></button>
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
        await saveCurrentSession(newSessionTitle);
        await printSessions();
        inputBox.value = "";
    }
}

async function saveCurrentSession(name) {
    // obtenir la liste des tabs
    let formattedTabsList = await chrome.tabs
        .query({ currentWindow: true })
        .then((tabsList) =>
            tabsList.map((tab) => {
                return { tab: tab.title, URL: tab.url };
            })
        );
    // sauvegarder dans le storage
    await chrome.storage.local.set({ [name]: formattedTabsList });
}

async function openSession(sessionTitle) {
    // obtenir le storage pour la session désirée
    const tabsArray = await chrome.storage.local
        .get()
        .then((storage) => storage[sessionTitle]);
    // obtenir la liste des urls à ouvrir
    const urls = tabsArray.map((tab) => tab.URL);

    // ouvrir la fenêtre avec les onglets de la session
    chrome.windows.create({ focused: true, state: "maximized", url: urls });
    // CHECK : si un seul onglet est ouvert et qu'il s'agit d'un onglet newTab ou d'un onglet de recherche Google
    await chrome.windows.getCurrent({ populate: true }).then((window) => {
        const closingWindowConditions =
            window.tabs.length === 1 &&
            (window.tabs[0].url === "chrome://extensions/" ||
                window.tabs[0].url === "chrome://newtab/");
        if (closingWindowConditions) chrome.windows.remove(window.id);
    });
}

async function deleteSession(event) {
    const sessionName =
        event.target.parentNode.parentNode.querySelector(
            ".sessionName"
        ).textContent;
    // supprimer la session de la base de données
    await chrome.storage.local.remove(sessionName);
    // actualiser l'affichage de la liste
    printSessions();
}

function showHideTabs(sessionTabsListHTML) {
    console.log(sessionTabsListHTML.className);
    sessionTabsListHTML.className =
        sessionTabsListHTML.className === "tabsList visible"
            ? "tabsList hidden"
            : "tabsList visible";
    console.log(sessionTabsListHTML);
}

async function deleteTab(event) {
    const sessionHTML =
        event.target.parentNode.parentNode.parentNode.parentNode;

    // récupérer l'URL du tab
    console.log(event.target.parentNode.parentNode);

    let urlToDelete = event.target.parentNode.parentNode.dataset.url;
    // obtenir le nom de la session concernée
    let targetSessionName =
        event.target.parentNode.parentNode.parentNode.parentNode.querySelector(
            ".sessionName"
        ).textContent;

    // aller chercher dans le storage la session concernée
    await chrome.storage.local
        .get([targetSessionName])
        // supprimer le tab de la liste des tabs
        .then(async (storage) => {
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
