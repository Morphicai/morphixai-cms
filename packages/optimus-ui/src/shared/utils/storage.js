export default function storage(key, value) {
    if (!key) {
        return;
    }
    if (typeof value === "undefined") {
        return localStorage.getItem(key);
    }
    var setItemEvent = new Event("setItemEvent");
    setItemEvent.value = value;
    localStorage.setItem(key, value);
    window.dispatchEvent(setItemEvent);
}
