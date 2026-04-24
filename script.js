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

    // ===== SCROLL EFFECT =====
    const sections = document.querySelectorAll('.expand-section');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {

            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            } else {
                entry.target.classList.remove('active');
            }

        });
    }, {
        threshold: 0.3,
        rootMargin: "0px 0px -120px 0px"
    });

    sections.forEach(section => observer.observe(section));

});
