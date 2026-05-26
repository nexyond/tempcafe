let menuData = [];

function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('theme-icon');
    if (body.classList.contains('light-theme')) {
        body.classList.replace('light-theme', 'dark-theme');
        icon.classList.replace('fa-moon', 'fa-sun');
    } else {
        body.classList.replace('dark-theme', 'light-theme');
        icon.classList.replace('fa-sun', 'fa-moon');
    }
}

function scrollNav(amt) {
    document.getElementById('navWrapper').scrollBy({
        left: amt,
        behavior: 'smooth'
    });
}

function updateArrows() {
    const nw = document.getElementById('navWrapper');
    if (!nw) return;
    document.getElementById('cL').style.display = nw.scrollLeft > 10 ? 'flex' : 'none';
    document.getElementById('cR').style.display = (nw.scrollWidth - nw.clientWidth - nw.scrollLeft) > 10 ? 'flex' : 'none';
}

function parseCSV(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    if (!lines.length) return [];
    
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    
    return lines.slice(1).map(line => {
        let values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            let char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        
        const obj = {};
        headers.forEach((header, index) => {
            let val = values[index] || '';
            let cleanedVal = val.replace(/^"|"$/g, '').trim();
            
            if (header === 'kategori' && cleanedVal) {
                cleanedVal = cleanedVal.toLocaleUpperCase('tr-TR');
            }
            
            obj[header] = cleanedVal;
        });
        return obj;
    });
}

async function init() {
    try {
        const sheetId = '1aAS3GiWnpN4teH5tvucjQI-eYeomPXl4UL4h0lmrbhI';
        const response = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`);
        const text = await response.text();
        menuData = parseCSV(text);

        const cats = [...new Set(menuData.map(i => i.kategori).filter(Boolean))];
        const nav = document.getElementById('navWrapper');
        nav.innerHTML = cats.map(c => `<div class="cat-link" onclick="scrollToCategory('${c}', this)">${c}</div>`).join('');
        nav.addEventListener('scroll', updateArrows);

        window.addEventListener('resize', updateArrows);
        updateArrows();
        render(menuData, cats);
        observeCategories();

        const loader = document.getElementById('loading-screen');
        if(loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 400);
        }

        const badge = document.getElementById('gallery-badge');
        if(badge) {
            badge.style.display = 'block';
            setTimeout(() => {
                badge.style.opacity = '0';
                badge.style.transition = 'opacity 0.5s ease';
                setTimeout(() => badge.style.display = 'none', 500);
            }, 3000);
        }
    } catch (error) {
        console.error("Menü yüklenirken hata oluştu:", error);
    }
}

function render(data, categoryOrder) {
    const container = document.getElementById('menu-container');
    if (!data.length) {
        container.innerHTML = '<div class="no-results">Ürün bulunamadı.</div>';
        return;
    }
    
    const grouped = data.reduce((acc, item) => {
        if (!item.kategori) return acc;
        if (!acc[item.kategori]) acc[item.kategori] = [];
        acc[item.kategori].push(item);
        return acc;
    }, {});
    
    let html = '';
    categoryOrder.forEach(cat => {
        if (!grouped[cat]) return;
        html += `<div class="category-section">
            <h2 class="category-title">${cat}</h2>
            <div class="items-grid">`;
        grouped[cat].forEach(i => {
            html += `<div class="menu-item">
                <div class="item-header">
                    <h3 class="item-name">${i.urun_adi}</h3>
                    <div class="item-price-box">
                        <span class="current-price">${i.fiyat} TL</span>
                    </div>
                </div>
                ${i.aciklama ? `<p class="item-desc">${i.aciklama}</p>` : ''}
            </div>`;
        });
        html += `</div></div>`;
    });
    container.innerHTML = html;
}

function search(term) {
    term = term.toLocaleLowerCase('tr-TR').trim();
    if (!term) {
        const orderedCats = [];
        menuData.forEach(item => {
            if (item.kategori && !orderedCats.includes(item.kategori)) {
                orderedCats.push(item.kategori);
            }
        });
        render(menuData, orderedCats);
        return;
    }
    const filtered = menuData.filter(i =>
        (i.urun_adi && i.urun_adi.toLocaleLowerCase('tr-TR').includes(term)) ||
        (i.kategori && i.kategori.toLocaleLowerCase('tr-TR').includes(term)) ||
        (i.aciklama && i.aciklama.toLocaleLowerCase('tr-TR').includes(term))
    );
    
    const orderedCats = [];
    filtered.forEach(item => {
        if (item.kategori && !orderedCats.includes(item.kategori)) {
            orderedCats.push(item.kategori);
        }
    });
    render(filtered, orderedCats);
}

function scrollToCategory(catName, el) {
    document.querySelectorAll('.cat-link').forEach(l => l.classList.remove('active'));
    el.classList.add('active');
    const titles = document.querySelectorAll('.category-title');
    for (let title of titles) {
        if (title.innerText === catName) {
            window.scrollTo({
                top: title.getBoundingClientRect().top + window.pageYOffset - 120,
                behavior: 'smooth'
            });
            break;
        }
    }
}

function observeCategories() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const navLinks = document.querySelectorAll('.cat-link');
                navLinks.forEach(link => {
                    if (link.innerText === entry.target.innerText) {
                        link.classList.add('active');
                        link.scrollIntoView({
                            behavior: 'smooth',
                            inline: 'center',
                            block: 'nearest'
                        });
                    } else link.classList.remove('active');
                });
            }
        });
    }, {
        rootMargin: '-150px 0px -70% 0px'
    });
    document.querySelectorAll('.category-title').forEach(title => observer.observe(title));
}

function toggleGalleryModal(show) {
    const modal = document.getElementById("galleryModal");
    if(modal) {
        modal.style.display = show ? "flex" : "none";
    }
    const badge = document.getElementById('gallery-badge');
    if(badge) badge.style.display = 'none';
}

function closeGalleryOutside(event) {
    if (event.target.id === "galleryModal") {
        toggleGalleryModal(false);
    }
}

init();
