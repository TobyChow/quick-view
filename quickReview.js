//todo rm - for testing purposes
const delay = async (delay = 1000, callback = () => {}) => {
    const delayPromise = ms => new Promise(res => setTimeout(res, ms));
    await delayPromise(delay);
    callback();
};
let EXTENSION_CONFIG = {}; // defined on initialization

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
                ${url && `<a href="${url}" target="_blank" rel="noopener noreferrer">
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

async function fetchRating(query) {
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

async function getStorage() {
    return await chrome.storage.sync.get(["options"]);
};

(async function init() {
    const storage = await getStorage();
    EXTENSION_CONFIG = storage.options;

    const hltr = new TextHighlighter(document.body, {
        color: EXTENSION_CONFIG?.options?.color,
    });

    tippy.delegate('body', {
        content: 'Loading',
        delay: 500, // ms
        interactive: true,
        target: '.highlighted',
        allowHTML: true,
        inlinePositioning: true,
        appendTo: document.body, // prevent tooltip from cutting off by parent container
        async onShow(instance) {
            if (instance._isFetching || instance._src || instance._error) {
                return;
            }

            instance._isFetching = true;

            // build search query
            const selectedText = hltr.getHighlights()[0].innerText.trim();
            const appendSearchText = EXTENSION_CONFIG.appendSearchText ?? '';
            const searchQuery = `${selectedText} ${appendSearchText}`;
            console.log(searchQuery); // todo remove

            try {
                // get ratings
                const placeDetails = await fetchRating(searchQuery);
                instance.setContent(createRatingTooltip(selectedText, searchQuery, placeDetails));
            } catch(err) {
                console.log(err); // todo remove
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

    (function initEvents() {
        document.addEventListener('mousedown', e => {
            hltr.removeHighlights();
        });

        chrome.storage.onChanged.addListener(changes => {
            console.log(changes); // todo remove
            console.log(EXTENSION_CONFIG); // todo remove
            const newValues = changes?.options?.newValue;
            EXTENSION_CONFIG = newValues;

            const newHighlightColor = newValues?.color;
            if (newHighlightColor) {
                hltr.setColor(newHighlightColor);
            }
        });
    })();
})();


