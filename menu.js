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
    document.getElementById('cL').style.display = nw.scrollLeft > 10 ? 'flex' : 'none';
    document.getElementById('cR').style.display = (nw.scrollWidth - nw.clientWidth - nw.scrollLeft) > 10 ? 'flex' : 'none';
}

async function init() {
    try {
        const response = await fetch('src/data/menu.json');
        const data = await response.json();
        menuData = data["creps-kafe"];

        const cats = [...new Set(menuData.map(i => i.kategori))];
        const nav = document.getElementById('navWrapper');
        nav.innerHTML = cats.map(c => `<div class="cat-link" onclick="scrollToCategory('${c}', this)">${c}</div>`).join('');
        nav.addEventListener('scroll', updateArrows);
        setTimeout(updateArrows, 300);

        render(menuData);
        observeCategories();
    } catch (err) {
        console.error("Menü yüklenemedi:", err);
    }
}

function render(data) {
    const cont = document.getElementById('menu-container');
    if (!data || data.length === 0) {
        cont.innerHTML = '<p style="text-align:center; opacity:0.5; margin-top:50px;">Ürün bulunamadı.</p>';
        return;
    }
    const groups = data.reduce((acc, i) => {
        (acc[i.kategori] = acc[i.kategori] || []).push(i);
        return acc;
    }, {});
    cont.innerHTML = Object.keys(groups).map(cat => `
            <div class="category-section">
                <div class="category-title">${cat}</div>
                ${groups[cat].map(i => `
                    <div class="menu-item ${i.stok === 'HAYIR' ? 'out-of-stock' : ''}">
                        ${i.populer === 'EVET' ? '<div class="pop-badge">POPÜLER</div>' : ''}
                        ${i.foto_link ? `<img src="${i.foto_link}" class="item-img">` : ''}
                        <div class="item-info">
                            <div class="item-header">
                                <span class="item-name">${i.urun_adi}</span>
                                <div class="item-price-box">
                                    ${i.indirim_var === 'EVET' ? `<span class="old-price">${i.fiyat}₺</span>` : ''}
                                    <span class="current-price">${i.indirim_var === 'EVET' ? i.indirimli_fiyat : i.fiyat}₺</span>
                                </div>
                            </div>
                            ${i.aciklama ? `<div class="item-desc">${i.aciklama}</div>` : ''}
                        </div>
                    </div>`).join('')}
            </div>`).join('');
}

function search(val) {
    const term = val.toLowerCase().trim();
    const filtered = menuData.filter(i => 
        i.urun_adi.toLowerCase().includes(term) || 
        i.kategori.toLowerCase().includes(term) ||
        (i.aciklama && i.aciklama.toLowerCase().includes(term))
    );
    render(filtered);
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

init();