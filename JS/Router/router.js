// router.js
let LOOKUP = {};      // code -> object chứa versions/dates gốc
let ITEM_OF = {};      // code (kể cả version) -> item cha chứa "dates"

fetch('Json/characters.json')
    .then(res => res.json())
    .then(data => {
        data.forEach(item => {
            LOOKUP[item.code] = item;
            ITEM_OF[item.code] = item;
            item.versions.forEach(v => ITEM_OF[v.code] = item);
        });
        render();
    });

function applyEventStatus(container, status, dateInfo) {
    const active = container.querySelector('.banner-active');
    const upcoming = container.querySelector('.banner-upcoming');

    if (active) {
        active.style.display = (status === 'active') ? 'block' : 'none';
        const span = active.querySelector('.event-date');
        if (span && dateInfo) span.textContent = `(${dateInfo.date}${dateInfo.note ? ' - ' + dateInfo.note : ''})`;
    }

    if (upcoming) {
        upcoming.style.display = (status === 'upcoming') ? 'block' : 'none';
        const span = upcoming.querySelector('.event-date');
        if (span && dateInfo) span.textContent = `(${dateInfo.date}${dateInfo.note ? ' - ' + dateInfo.note : ''})`;
    }
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

//render
function render() {
    const key = location.hash.slice(1);
    const content = document.getElementById('content');
    const item = ITEM_OF[key];

    if (!item) {
        fetch(`404.html`)
            .then(res => res.text())
            .then(html => {
                content.innerHTML = html;
                const result = eventStatus(item);
                applyEventStatus(content, result.status, result.date);
        });
        return;
    }

    fetch(`JS/Character/${key}.html`)
        .then(res => res.text())
        .then(html => {
            content.innerHTML = html;
            executeScripts(content); // thêm dòng này
            const result = eventStatus(item);
            applyEventStatus(content, result.status, result.date);
        });

}


window.addEventListener('hashchange', render);