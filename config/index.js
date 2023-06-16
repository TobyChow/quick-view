const restoreOptions = () => {
    chrome.storage.sync.get(
        ["options"],
        (storageData) => {
            const options = storageData.options;
            document.getElementById('append-search').value = options.appendSearchText;
        }
    );
};

function saveOptions() {
    const appendSearchText = document.getElementById('append-search').value;

    const options = {
        appendSearchText
    };

    chrome.storage.sync.set({ options });
}

document.querySelector('#optionsForm').addEventListener('input', saveOptions);

document.addEventListener('DOMContentLoaded', restoreOptions);
