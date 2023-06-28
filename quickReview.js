const HIGHLIGHT_CLASS = 'ext-highlighted';
let isExtensionEnabled;

function createRatingTooltip(selectedText, searchQuery, { rating, user_ratings_total, editorial_summary, url, price_level }) {
    const externalLinkImg = chrome.runtime.getURL('icons/map-link.svg');
    const priceLevelDisplay = '$'.repeat(price_level);
    return `
        <div>
            <div>
                <a 
                    href="https://google.com/search?q=${searchQuery}"
                    class="query-link"
                    target="_blank" rel="noopener noreferrer"
                >
                    ${selectedText}
                </a>
                ${priceLevelDisplay}
                ${url && `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;">
                            <img style="color:white; width:25px; height:25px" src="${externalLinkImg}" alt="external-link-image"/>
                        </a>`}
            </div>
            <div class="description">${editorial_summary?.overview ?? ''}</div>
            <div class="rating">
                ${rating} 
                <div class="stars" style="--rating: ${rating};"></div> (${user_ratings_total})
            </div>
        </div>
    `;
}

function createErrorTooltip(name) {
    return `
        <div>
            <div>${name}</div>
            <div>No Results Found</div>
        </div>
    `;
}

async function fetchPlaceDetails(query) {
    const url = `https://quickview.tobychow.repl.co/api/`;//todo
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Content-type": "application/json",
            'Access-Control-Allow-Origin':'*',
        },
        body: JSON.stringify({
            query
        })
    });
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    const { result, status, error_message } = await response.json();

    // Only allow restaurant / food locations
    if (status !== 'OK' || !result.types.includes('restaurant') || !result.types.includes('food')) {
        throw new Error(error_message);
    }

    return result;
}

async function getOptions() {
    const { options } = await chrome.storage.sync.get(["options"]);
    return options;
};

async function init() {
    rangy.init();
    const hltr = rangy.createHighlighter();
    const applier = rangy.createClassApplier(HIGHLIGHT_CLASS, {
        elementAttributes: {
            'aria-expanded':'false', // need to add attribute applied by tippy, or removeAllHighlights() will not clear highlights properly
        }
    });
    hltr.addClassApplier(applier);

    tippy.delegate('body', {
        content: 'Loading',
        interactive: true,
        target: `.${HIGHLIGHT_CLASS}`,
        allowHTML: true,
        appendTo: document.body, // prevent tooltip from cutting off by parent container
        async onShow(instance) {
            if (instance._isFetching || instance._src || instance._error) {
                return;
            }

            instance._isFetching = true;

            const extensionOptions = await getOptions();

            // add text to append from extension config to highlighted text
            const selectedText = document.querySelector(`.${HIGHLIGHT_CLASS}`).innerText.trim();
            const appendSearchText = extensionOptions.appendSearchText ?? '';
            const searchQuery = `${selectedText} ${appendSearchText}`;

            try {
                // get ratings
                const placeDetails = await fetchPlaceDetails(searchQuery);
                instance.setContent(createRatingTooltip(selectedText, searchQuery, placeDetails));
            } catch(err) {
                console.log(err);
                instance.setContent(createErrorTooltip(selectedText));
            } finally {
                instance._isFetching = false;
            }
        },
        onHidden(instance) {
            instance.setContent('Loading');
            // Unset these properties so new network requests can be initiated
            instance._src = null;
            instance._error = null;
        },
        onCreate(instance) {
            // Setup our own custom state properties
            instance._isFetching = false;
            instance._src = null;
            instance._error = null;
        },
    });

    document.addEventListener('mouseup', async e => {
        const tagElement = e.target.tagName;
        const disabledElements = ['INPUT', 'TEXTAREA']; // disable highlighting for these elements
        if (!disabledElements.includes(tagElement) && isExtensionEnabled) {
            hltr.highlightSelection(HIGHLIGHT_CLASS);
        }
    });
    document.addEventListener('mousedown', e => {
        // setTimeout to prevent highlighting entire element when left clicking on selection
        setTimeout(() => {
            if (e.button !== 2) { // allow context menu to work by not removing selection on right click
                hltr.removeAllHighlights();
            }
        },0);
    });
    chrome.storage.onChanged.addListener(async(changes) => {
        const newValues = changes?.options?.newValue;
        isExtensionEnabled = newValues.isEnabled;
    });
}

window.onload = () => init();




