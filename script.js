document.addEventListener("DOMContentLoaded", () => {

let facts = [];
let currentFact = 0;

function showFact() {
    const factText = document.getElementById("fact-text");
    const factImage = document.getElementById("fact-image");

    if (!factText || !factImage || facts.length === 0) return;

    factText.innerText = facts[currentFact].text;
    factImage.src = facts[currentFact].image;
}

async function loadFacts() {
    const res = await fetch('facts.txt');
    const text = await res.text();

    facts = text.split('\n').map(line => {
        const [t, img] = line.split('|');
        return {
            text: t.trim(),
            image: img.trim()
        };
    });

    showFact();
}

async function loadFacts() {
    const res = await fetch('facts.txt');
    const text = await res.text();

    facts = text.split('\n').map(line => {
        const [t, img] = line.split('|');
        return { text: t, image: img };
    });

    showFact();
}

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
                entry.target.classList.remove('active'); // blur balik saat keluar
            }
        });
    }, {
        threshold: 0.2
    });

    sections.forEach((section) => {
        observer.observe(section);
    });

});
function showFact() {
    const factText = document.getElementById("fact-text");
    const factImage = document.getElementById("fact-image");

    if (!factText || !factImage) return;

    factImage.style.opacity = 0;
    factImage.style.transform = "scale(0.95)";

    setTimeout(() => {
        factText.innerText = facts[currentFact].text;
        factImage.src = facts[currentFact].image;

        factImage.style.opacity = 1;
        factImage.style.transform = "scale(1)";
    }, 200);
}