__mods["js/ui/screens.js"] = (() => {
const { renderHome, updateHomeSearchResults } = __mods["js/ui/screens/home.js"];
const { renderCapture } = __mods["js/ui/screens/capture.js"];
const { renderEncyclopedia, updateEncyclopediaResults } = __mods["js/ui/screens/encyclopedia.js"];
const { renderEvents, updateEventResults } = __mods["js/ui/screens/events.js"];
const { renderFlowerDetail, renderEventDetail } = __mods["js/ui/screens/details.js"];
const { renderAppHeader, renderBottomNav } = __mods["js/ui/screens/shell.js"];
return { "renderHome": renderHome, "updateHomeSearchResults": updateHomeSearchResults, "renderCapture": renderCapture, "renderEncyclopedia": renderEncyclopedia, "updateEncyclopediaResults": updateEncyclopediaResults, "renderEvents": renderEvents, "updateEventResults": updateEventResults, "renderFlowerDetail": renderFlowerDetail, "renderEventDetail": renderEventDetail, "renderAppHeader": renderAppHeader, "renderBottomNav": renderBottomNav };
})();
