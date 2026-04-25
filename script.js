document.addEventListener("DOMContentLoaded", () => {

    // ===== LOAD FACTS FROM TXT =====
    let facts = [];
    let currentFact = 0;

    async function loadFacts() {
        try {
            const res = await fetch('facts.txt');
            const text = await res.text();

            facts = text.split('\n').map(line => {
                const [t, img] = line.split('|');
                return {
                    text: t?.trim(),
                    image: img?.trim()
                };
            }).filter(f => f.text && f.image); // buang baris kosong

            showFact();
        } catch (err) {
            console.error("Gagal load facts:", err);
        }
    }

    function showFact() {
        const factText = document.getElementById("fact-text");
        const factImage = document.getElementById("fact-image");

        if (!factText || !factImage || facts.length === 0) return;

        factText.innerText = facts[currentFact].text;
        factImage.src = facts[currentFact].image;
    }

    async function loadUpdates() {
        const updatesContainer = document.getElementById("updates-list");
        if (!updatesContainer) return;

        try {
            const res = await fetch('updates.txt');
            const text = await res.text();

            const lines = text
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            if (lines.length === 0) {
                updatesContainer.innerHTML = '<li>Tidak ada update terbaru.</li>';
                return;
            }

            updatesContainer.innerHTML = lines.map(line => {
                const parts = line.split('|').map(part => part.trim());
                const title = parts[0] || 'Update';
                const date = parts[1] || 'Tanggal tidak tersedia';
                const description = parts[2] || 'Deskripsi update tidak tersedia.';

                return `<li><div><strong>${title}</strong><span class="update-date">${date}</span></div><div>${description}</div></li>`;
            }).join('');
        } catch (err) {
            console.error('Gagal load updates:', err);
            updatesContainer.innerHTML = '<li>Gagal memuat data update.</li>';
        }
    }

    // tombol global (biar bisa dipanggil dari HTML)
    window.nextFact = function () {
        currentFact = (currentFact + 1) % facts.length;
        showFact();
    };

    window.prevFact = function () {
        currentFact = (currentFact - 1 + facts.length) % facts.length;
        showFact();
    };

    loadFacts();
    loadUpdates();

    // ===== SCROLL EFFECT =====
    const sections = document.querySelectorAll('.expand-section');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
    
            console.log("VISIBLE:", entry.isIntersecting); // ✅ di sini
    
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            } else {
                entry.target.classList.remove('active');
            }
    
        });
    }, {
        threshold: 0.4
    });

    sections.forEach(section => observer.observe(section));

});