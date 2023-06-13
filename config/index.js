const restoreOptions = () => {
    chrome.storage.sync.get(
        ["options"],
        (storageData) => {
            const options = storageData.options;
            document.getElementById('color').value = options.color;
            document.getElementById('append-search').value = options.appendSearchText;
        }
    );
};

function saveOptions() {
    const color = document.getElementById('color').value;
    const appendSearchText = document.getElementById('append-search').value;

    const options = {
        color,
        appendSearchText
    };

    chrome.storage.sync.set({ options });
}

document.querySelector('#optionsForm').addEventListener('change', saveOptions);
document.querySelector('#optionsForm').addEventListener('input', saveOptions);

document.addEventListener('DOMContentLoaded', restoreOptions);
