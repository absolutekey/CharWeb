// router.js
let LOOKUP = {};      // id -> object chứa versions/dates gốc
let ITEM_OF = {};      // id (kể cả version) -> item cha chứa "dates"

fetch('Json/characters.json')
    .then(res => res.json())
    .then(data => {
        data.forEach(item => {
            LOOKUP[item.id] = item;
            ITEM_OF[item.id] = item;

            item.versions.forEach(v => {
                ITEM_OF[v.id] = item;
            });
        });
        render();
    });

function applyCharacterData(container, item, key) {
    // =========================
    // EVENT / DATE
    // =========================
    const event = eventStatus(item);

    const active = container.querySelector('.banner-active');
    const upcoming = container.querySelector('.banner-upcoming');

    if (active) {
        active.style.display = event.status === 'active' ? 'block' : 'none';

        const span = active.querySelector('.event-date');
        if (span && event.date) {
            span.textContent =
                `(${event.date.date}${event.date.note ? ' - ' + event.date.note : ''})`;
        }
    }

    if (upcoming) {
        upcoming.style.display = event.status === 'upcoming' ? 'block' : 'none';

        const span = upcoming.querySelector('.event-date');
        if (span && event.date) {
            span.textContent =
                `(${event.date.date}${event.date.note ? ' - ' + event.date.note : ''})`;
        }
    }


     // =========================
    // OPEN GAME
    // =========================
    const opengamebtn = container.querySelector('.opengame');

    console.log('OpenGame:', opengamebtn);
    console.log('Scheme:', item.game?.scheme);

    if (opengamebtn) {
        if (item.game && item.game.scheme) {
            opengamebtn.addEventListener('click', () => {
                const scheme = item.game.scheme.trim();

                console.log('scheme:', JSON.stringify(scheme));

                location.href = scheme;
            });
        }
    }


    // =========================
    // BASIC DATA
    // =========================
    const name = container.querySelector('.CharacterName');

    if (name) {
        name.textContent = item.basic.name;
    }


    // =========================
    // CURRENT VERSION
    // =========================
    const version = container.querySelector('.CharacterVersion');

    if (version) {
        version.textContent = key;
    }
}

function resolveCharacterAssets(html, key) {
    const assetsPath =
        `JS/Character/${key.basic.name}/${key.assets}/`;

    return html.replaceAll("{{A}}", assetsPath);
}

function eventStatus(item) {
    const nearest = nearestEvent(item);
    if (!nearest) return { status: 'none', date: null };
    return { status: nearest.isToday ? 'active' : 'upcoming', date: nearest.date };
}

//nearestEvent
function toDayOfYear(mmdd) {
    const [m, d] = mmdd.split('-').map(Number);
    const date = new Date(2001, m - 1, d); // năm tham chiếu cố định, không nhuận
    const start = new Date(2001, 0, 1);
    return Math.round((date - start) / 86400000);
}

function circularDistance(from, to, total = 365) {
    return (to - from + total) % total;
}

function nearestEvent(item) {
    if (!item.dates || item.dates.length === 0) return null;

    const today = new Date();
    const todayMD = String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    const todayDOY = toDayOfYear(todayMD);

    let closest = null;
    let minDist = Infinity;

    item.dates.forEach(d => {
        const dist = circularDistance(todayDOY, toDayOfYear(d.date));
        if (dist < minDist) {
            minDist = dist;
            closest = d;
        }
    });

    return { date: closest, isToday: minDist === 0 };
}

function executeScripts(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => 
            newScript.setAttribute(attr.name, attr.value)
        );
        newScript.textContent = oldScript.textContent;
        oldScript.replaceWith(newScript);
    });
}

function render() {
    const key = location.hash.slice(1);
    const content = document.getElementById('content');
    const item = ITEM_OF[key];

    console.log('Rendering key:', key);

    if (!item) {
        fetch('404.html')
            .then(res => res.text())
            .then(html => {
                content.innerHTML = html;
                executeScripts(content);
            });
        return;
    }

    fetch(`JS/Character/${item.basic.name}/${key}.html`)
    .then(res => res.text())
    .then(html => {
        // Resolve đường dẫn assets trước khi đưa HTML vào DOM
        html = resolveCharacterAssets(html, item);
        content.innerHTML = html;
        executeScripts(content);
        applyCharacterData(content, item, key);
    });
}



window.addEventListener('hashchange', render);