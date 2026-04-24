const facts = [
    "Hanya 2.5% air di bumi adalah air tawar yang bisa digunakan manusia.",
    "Sekitar 70% tubuh manusia terdiri dari air.",
    "Lebih dari 2 miliar orang di dunia kekurangan akses air bersih."
];

let currentFact = 0;

window.onload = function() {
    showFact();
};

function showFact() {
    document.getElementById("fact-text").innerText = facts[currentFact];
}

function nextFact() {
    currentFact = (currentFact + 1) % facts.length;
    showFact();
}

function prevFact() {
    currentFact = (currentFact - 1 + facts.length) % facts.length;
    showFact();
}

// tampil pertama
showFact();