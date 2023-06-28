const restoreOptions = () => {
    chrome.storage.sync.get(
        ["options"],
        (storageData) => {
            const options = storageData.options;
            document.getElementById('append-search').value = options.appendSearchText;
            document.getElementById('extension-status').checked = options.isEnabled;

            // allow slider to show transition after initial load
            setTimeout(() => {
                document.querySelector('.slider').classList.remove('slider-init');
            },500);
        }
    );
};

function saveOptions() {
    const appendSearchText = document.getElementById('append-search').value;
    const isEnabled = document.getElementById('extension-status').checked;

    const options = {
        isEnabled,
        appendSearchText
    };

    chrome.storage.sync.set({ options });
}

document.querySelector('#extension-options-form').addEventListener('input', saveOptions);

window.onload = () => {
    restoreOptions();
};