// SIDEPANEL : ouvrir le sidePanel au clic sur l'icône
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(console.error);

// A SUPPRIMER ? le raccourci permet de déclencher la sauvegarde de la session
// chrome.commands.onCommand.addListener(handleCurrentSession);
