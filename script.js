document.addEventListener("DOMContentLoaded", () => {

    // ===== LOAD FACTS FROM TXT =====
    let facts = [];
    let currentFact = 0;
    let feedbackEntries = [];

    async function loadFacts() {
        try {
            const res = await fetch('facts.txt');
            const text = await res.text();

            facts = text.split('\n').map(line => {
                const [t, img] = line.split('|');
                return { text: t?.trim(), image: img?.trim() };
            }).filter(f => f.text && f.image);

        } catch {
            // fallback kalau fetch gagal
            facts = [
                { text: "Air adalah sumber kehidupan 🌍", image: "fallback.jpg" }
            ];
        }

        showFact();
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

    async function loadFeedbackEntries() {
        const feedbackList = document.getElementById('feedback-list');
        if (!feedbackList) return;

        let localEntries = [];
        const localJson = localStorage.getItem('adiwiyataFeedbackEntries');
        if (localJson) {
            try {
                localEntries = JSON.parse(localJson);
            } catch (err) {
                console.warn('Gagal membaca feedback lokal:', err);
            }
        }

        let fileEntries = [];
        try {
            const res = await fetch('feedback.txt');
            if (res.ok) {
                const text = await res.text();
                fileEntries = text
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .map(line => {
                        const [name, rating, message] = line.split('|');
                        return {
                            name: name?.trim() || 'Anonim',
                            rating: rating?.trim() || '0',
                            message: message?.trim() || ''
                        };
                    })
                    .filter(entry => entry.name && entry.message);
            }
        } catch (err) {
            console.warn('Tidak dapat memuat feedback.txt:', err);
        }

        feedbackEntries = [...localEntries, ...fileEntries];
        renderFeedbackEntries();
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderFeedbackEntries() {
        const feedbackList = document.getElementById('feedback-list');
        if (!feedbackList) return;

        if (feedbackEntries.length === 0) {
            feedbackList.innerHTML = '<p class="feedback-empty">Belum ada feedback. Jadilah yang pertama mengirimkan.</p>';
            return;
        }

        feedbackList.innerHTML = feedbackEntries.map(entry => {
            return `
                <article class="feedback-item">
                    <div class="feedback-name">${escapeHtml(entry.name)}</div>
                    <div class="feedback-rating">Rating: ${escapeHtml(entry.rating)} / 5</div>
                    <p class="feedback-message">${escapeHtml(entry.message)}</p>
                </article>
            `;
        }).join('');
    }

    function saveFeedbackEntriesToLocal() {
        localStorage.setItem('adiwiyataFeedbackEntries', JSON.stringify(feedbackEntries));
    }

    function showFeedbackStatus(message, isSuccess = true) {
        const feedbackStatus = document.getElementById('feedback-status');
        if (!feedbackStatus) return;
        feedbackStatus.textContent = message;
        feedbackStatus.style.color = isSuccess ? '#B2FFCC' : '#FFB3B3';
    }

    function handleFeedbackFormSubmit(event) {
        event.preventDefault();
        const nameInput = document.getElementById('feedback-name');
        const messageInput = document.getElementById('feedback-message');
        const ratingSelect = document.getElementById('feedback-rating');

        if (!nameInput || !messageInput || !ratingSelect) return;

        const name = nameInput.value.trim();
        const message = messageInput.value.trim();
        const rating = ratingSelect.value;

        if (!name || !message) {
            showFeedbackStatus('Nama dan feedback wajib diisi.', false);
            return;
        }

        const entry = { name, rating, message };
        feedbackEntries.unshift(entry);
        saveFeedbackEntriesToLocal();
        renderFeedbackEntries();

        event.target.reset();
        showFeedbackStatus('Terima kasih! Feedback Anda berhasil ditambahkan.');
    }

    async function downloadFeedbackFile() {
        const content = feedbackEntries
            .map(entry => `${entry.name}|${entry.rating}|${entry.message}`)
            .join('\n') + '\n';

        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: 'feedback.txt',
                    types: [{ description: 'Text File', accept: { 'text/plain': ['.txt'] } }]
                });
                const writable = await handle.createWritable();
                await writable.write(content);
                await writable.close();
                showFeedbackStatus('Feedback berhasil disimpan ke feedback.txt.');
                return;
            } catch (err) {
                console.warn('Gagal menyimpan file via File System Access API:', err);
            }
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'feedback.txt';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);

        showFeedbackStatus('File feedback.txt siap diunduh. Simpan file tersebut di komputer Anda.');
    }

    loadFacts();
    loadUpdates();
    loadFeedbackEntries();

    const feedbackForm = document.getElementById('feedback-form');
    const saveFeedbackBtn = document.getElementById('save-feedback-file');

    if (feedbackForm) {
        feedbackForm.addEventListener('submit', handleFeedbackFormSubmit);
    }

    if (saveFeedbackBtn) {
        saveFeedbackBtn.addEventListener('click', downloadFeedbackFile);
    }

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
window.addEventListener("scroll", () => {
    const header = document.querySelector(".site-header");

    if (window.scrollY > 50) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
});

/* ===== QUIZ FUNCTIONALITY ===== */
const quizData = [
    {
        question: "70% permukaan Bumi ditutupi oleh air, benar atau salah?",
        answer: true,
        explanation: "Sekitar 71% permukaan Bumi adalah air, tetapi 97% adalah air asin dan hanya 3% air tawar."
    },
    {
        question: "Manusia bisa bertahan lebih lama tanpa air daripada tanpa makanan, benar atau salah?",
        answer: false,
        explanation: "Manusia hanya bisa bertahan 3-5 hari tanpa air, tetapi bisa bertahan 30 hari atau lebih tanpa makanan."
    },
    {
        question: "Mandi dengan air dingin lebih menghemat air daripada mandi dengan air hangat, benar atau salah?",
        answer: false,
        explanation: "Yang penting adalah durasi mandi, bukan suhu air. Mandi 5 menit hemat air baik pakai air dingin atau hangat."
    },
    {
        question: "Satu keran yang bocor bisa membuang 30 liter air per hari, benar atau salah?",
        answer: true,
        explanation: "Sebuah keran yang menetes bisa membuang 30 liter per hari atau 11.000 liter per tahun."
    },
    {
        question: "Air tanah tidak akan pernah habis karena terus-menerus diisi dari hujan, benar atau salah?",
        answer: false,
        explanation: "Air tanah butuh puluhan tahun untuk terisi ulang, dan penggunaan berlebihan bisa menguras cadangan air tanah."
    },
    {
        question: "Industri pertanian menggunakan 70% dari seluruh penggunaan air tawar dunia, benar atau salah?",
        answer: true,
        explanation: "Pertanian adalah pengguna air terbesar, mencakup 70% penggunaan air tawar global."
    },
    {
        question: "Hanya 1% air tawar dunia yang bisa diminum setelah diproses, benar atau salah?",
        answer: true,
        explanation: "2% air tawar tersimpan dalam es, jadi hanya 1% yang tersedia untuk diminum dan digunakan."
    },
    {
        question: "Cara tercepat menghemat air di rumah adalah dengan mandi lebih sebentar, benar atau salah?",
        answer: true,
        explanation: "Mandi adalah aktivitas yang menggunakan banyak air. Mengurangi durasi mandi sangat efektif menghemat air."
    },
    {
        question: "Limbah plastik di laut tidak berbahaya karena akan terurai dengan sendirinya, benar atau salah?",
        answer: false,
        explanation: "Plastik butuh ratusan tahun untuk terurai dan meracuni ekosistem air serta hewan laut."
    },
    {
        question: "Pohon di hutan hujan bisa menyerap dan melepaskan jutaan liter air ke atmosfer setiap hari, benar atau salah?",
        answer: true,
        explanation: "Hutan hujan adalah 'paru-paru' planet kita dan memiliki peran krusial dalam siklus air global."
    }
];

let currentQuestionIndex = 0;
let score = 0;
let answered = false;

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    answered = false;
    
    document.querySelector('.facts-section').style.display = 'none';
    document.getElementById('quizSection').style.display = 'flex';
    document.getElementById('quizView').style.display = 'block';
    document.getElementById('resultView').style.display = 'none';
    
    document.getElementById('totalQuestions').innerText = quizData.length;
    
    showQuestion();
}

function showQuestion() {
    const question = quizData[currentQuestionIndex];
    document.getElementById('questionText').innerText = question.question;
    document.getElementById('currentQuestion').innerText = currentQuestionIndex + 1;
    document.getElementById('feedbackBox').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('finishBtn').style.display = 'none';
    
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('correct', 'incorrect');
    });
    
    answered = false;
}

function checkAnswer(userAnswer) {
    if (answered) return;
    answered = true;
    
    const question = quizData[currentQuestionIndex];
    const isCorrect = userAnswer === question.answer;
    
    const buttons = document.querySelectorAll('.answer-btn');
    
    if (isCorrect) {
        score++;
        // Highlight the correct button (the one that was clicked, since it's correct)
        if (userAnswer === true) {
            buttons[0].classList.add('correct'); // benar button
        } else {
            buttons[1].classList.add('correct'); // salah button
        }
    } else {
        // Show correct answer and mark wrong choice
        if (question.answer === true) {
            buttons[0].classList.add('correct'); // benar is correct
            buttons[1].classList.add('incorrect'); // salah is wrong (user clicked this)
        } else {
            buttons[1].classList.add('correct'); // salah is correct
            buttons[0].classList.add('incorrect'); // benar is wrong (user clicked this)
        }
    }
    
    buttons[0].disabled = true;
    buttons[1].disabled = true;
    
    showFeedback(isCorrect, question.explanation);
    showNextButton();
}

function showFeedback(isCorrect, explanation) {
    const feedbackBox = document.getElementById('feedbackBox');
    const feedbackText = document.getElementById('feedbackText');
    
    feedbackBox.style.display = 'block';
    feedbackText.innerText = (isCorrect ? '✓ Benar! ' : '✗ Salah! ') + explanation;
}

function showNextButton() {
    if (currentQuestionIndex < quizData.length - 1) {
        document.getElementById('nextBtn').style.display = 'block';
    } else {
        document.getElementById('finishBtn').style.display = 'block';
    }
}

window.nextQuestion = function () {
    currentQuestionIndex++;
    showQuestion();
};

function finishQuiz() {
    document.getElementById('quizView').style.display = 'none';
    showResults();
}

function showResults() {
    const resultView = document.getElementById('resultView');
    const scoreText = document.getElementById('scoreText');
    const scoreMessage = document.getElementById('scoreMessage');
    const scorePercentage = document.getElementById('scorePercentage');
    
    resultView.style.display = 'block';
    scoreText.innerText = `${score}/${quizData.length}`;
    
    const percentage = Math.round((score / quizData.length) * 100);
    scorePercentage.innerText = `${percentage}%`;
    
    let message = '';
    let emoji = '';
    
    if (percentage === 100) {
        message = 'Sempurna! Kamu adalah ahli konservasi air!';
        emoji = '🏆';
    } else if (percentage >= 80) {
        message = 'Luar biasa! Pengetahuan air kamu sangat bagus!';
        emoji = '🌟';
    } else if (percentage >= 60) {
        message = 'Bagus! Kamu mulai memahami pentingnya air.';
        emoji = '💧';
    } else if (percentage >= 40) {
        message = 'Cukup! Terus belajar tentang konservasi air.';
        emoji = '📚';
    } else {
        message = 'Yuk belajar lebih dalam tentang air dan lingkungan!';
        emoji = '🌍';
    }
    
    scoreMessage.innerText = `${emoji} ${message}`;
}

window.backToMenu = function () {
    document.getElementById('quizSection').style.display = 'none';
    document.getElementById('storySection').style.display = 'none';
    document.getElementById('simulationSection').style.display = 'none';
    document.getElementById('levelSelectView').style.display = 'block';
    document.getElementById('storyView').style.display = 'none';
    document.getElementById('storyEndView').style.display = 'none';
    document.getElementById('simulationView').style.display = 'block';
    document.getElementById('simulationEndView').style.display = 'none';
    document.querySelector('.facts-section').style.display = 'block';
    window.scrollTo(0, 0);
};

/* ===== STORY GAME FUNCTIONALITY ===== */
const storyData = {
    factory: {
        start: {
            image: "https://via.placeholder.com/400x300/87CEEB/000000?text=Sungai+Bersih",
            text: "Kamu tinggal di sebuah desa indah dengan sungai yang jernih. Suatu hari, kamu melihat sungai mulai berubah warna menjadi hitam dan ikan-ikan mati mengapung. Ternyata ada pabrik di hulu yang membuang limbah ke sungai!",
            choices: [
                { text: "Laporkan ke pemerintah dan organisasi lingkungan", next: "report" },
                { text: "Bersihkan sungai bersama warga desa", next: "clean" },
                { text: "Abaikan saja, biarkan saja", next: "ignore" }
            ]
        },
        report: {
            image: "https://via.placeholder.com/400x300/228B22/FFFFFF?text=Pemerintah+Turun+Tangan",
            text: "Kamu melaporkan masalah ini ke pemerintah dan LSM lingkungan. Mereka melakukan investigasi dan memaksa pabrik untuk berhenti membuang limbah. Pabrik dipaksa membangun sistem pengolahan limbah yang proper.",
            choices: [],
            end: true,
            title: "Ending Baik: Kolaborasi untuk Lingkungan",
            endText: "Dengan kerja sama antara masyarakat, pemerintah, dan perusahaan, sungai kembali bersih. Ini menunjukkan bahwa masalah lingkungan bisa diselesaikan dengan aksi bersama!"
        },
        clean: {
            image: "https://via.placeholder.com/400x300/FFD700/000000?text=Warga+Bersihkan+Sungai",
            text: "Kamu mengajak warga desa untuk membersihkan sungai. Kalian mengumpulkan sampah, menanam pohon di tepi sungai, dan mengedukasi masyarakat tentang pentingnya menjaga lingkungan.",
            choices: [],
            end: true,
            title: "Ending Inspiratif: Aksi Warga",
            endText: "Meskipun pabrik masih beroperasi, sungai menjadi lebih bersih berkat usaha warga. Ini menginspirasi desa-desa lain untuk melakukan hal serupa!"
        },
        ignore: {
            image: "https://via.placeholder.com/400x300/8B0000/FFFFFF?text=Sungai+Tercemar",
            text: "Kamu memutuskan untuk tidak melakukan apa-apa. Limbah pabrik terus membuang ke sungai, dan kondisi semakin buruk. Ikan punah, tanaman layu, dan kesehatan warga terancam.",
            choices: [],
            end: true,
            title: "Ending Buruk: Pengabaian Bencana",
            endText: "Karena tidak ada yang bertindak, sungai menjadi mati. Ini menunjukkan bahwa pengabaian masalah lingkungan dapat menyebabkan kerusakan yang permanen."
        }
    },
    home: {
        start: {
            image: "https://via.placeholder.com/400x300/FFE4B5/000000?text=Rumah+Bersih",
            text: "Di rumahmu, kamu melihat tumpukan sampah plastik yang semakin banyak. Sampah ini sering dibuang sembarangan ke sungai atau dibakar, yang mencemari udara dan lingkungan sekitar!",
            choices: [
                { text: "Mulai program daur ulang di rumah", next: "recycle" },
                { text: "Kurangi penggunaan plastik sekali pakai", next: "reduce" },
                { text: "Biarkan saja, sampah kan bisa dibuang", next: "waste" }
            ]
        },
        recycle: {
            image: "https://via.placeholder.com/400x300/32CD32/FFFFFF?text=Daur+Ulang",
            text: "Kamu mulai memisahkan sampah organik dan anorganik, serta membawa sampah plastik ke bank sampah. Keluargamu ikut serta, dan rumah menjadi lebih bersih.",
            choices: [],
            end: true,
            title: "Ending Baik: Rumah Ramah Lingkungan",
            endText: "Dengan daur ulang, sampah berkurang drastis. Ini menginspirasi tetangga untuk melakukan hal serupa dan mengurangi polusi!"
        },
        reduce: {
            image: "https://via.placeholder.com/400x300/87CEEB/000000?text=Tas+Bekas",
            text: "Kamu beralih menggunakan tas kain, botol minum reusable, dan menghindari plastik sekali pakai. Penggunaan plastik di rumah berkurang 80%.",
            choices: [],
            end: true,
            title: "Ending Inspiratif: Konsumsi Bijak",
            endText: "Dengan mengurangi plastik, rumahmu berkontribusi pada lingkungan yang lebih bersih. Aksi kecil bisa berdampak besar!"
        },
        waste: {
            image: "https://via.placeholder.com/400x300/8B4513/FFFFFF?text=Sampah+Menumpuk",
            text: "Sampah terus menumpuk dan dibuang sembarangan. Sungai tercemar, udara berbau, dan kesehatan keluarga terancam oleh polusi.",
            choices: [],
            end: true,
            title: "Ending Buruk: Rumah Penuh Sampah",
            endText: "Pengabaian sampah menyebabkan masalah kesehatan dan lingkungan. Ini menunjukkan pentingnya pengelolaan sampah yang baik."
        }
    },
    public: {
        start: {
            image: "https://via.placeholder.com/400x300/98FB98/000000?text=Taman+Bersih",
            text: "Di taman kota, kamu melihat sampah plastik, botol, dan bungkus makanan berserakan. Orang-orang membuang sampah sembarangan, membuat tempat umum menjadi kotor!",
            choices: [
                { text: "Organisir kegiatan bersih-bersih taman", next: "cleanup" },
                { text: "Pasang poster kampanye anti-littering", next: "campaign" },
                { text: "Abaikan, bukan urusan saya", next: "litter" }
            ]
        },
        cleanup: {
            image: "https://via.placeholder.com/400x300/FFD700/000000?text=Bersih-Bersih",
            text: "Kamu mengajak teman-teman untuk membersihkan taman setiap minggu. Tempat umum menjadi lebih bersih dan nyaman.",
            choices: [],
            end: true,
            title: "Ending Baik: Taman Bersih Bersama",
            endText: "Aksi gotong royong membuat taman kota indah kembali. Ini menunjukkan kekuatan komunitas dalam menjaga lingkungan!"
        },
        campaign: {
            image: "https://via.placeholder.com/400x300/FF6347/FFFFFF?text=Poster+Kampanye",
            text: "Kamu membuat poster dan menyebarkannya di media sosial. Kesadaran masyarakat tentang anti-littering meningkat, dan sampah berkurang.",
            choices: [],
            end: true,
            title: "Ending Inspiratif: Edukasi untuk Perubahan",
            endText: "Kampanye berhasil mengubah perilaku masyarakat. Edukasi adalah kunci untuk lingkungan yang lebih baik!"
        },
        litter: {
            image: "https://via.placeholder.com/400x300/696969/FFFFFF?text=Taman+Kotor",
            text: "Sampah terus menumpuk, taman menjadi kumuh, dan hewan liar mati karena makan sampah. Lingkungan kota semakin rusak.",
            choices: [],
            end: true,
            title: "Ending Buruk: Tempat Umum Terlantar",
            endText: "Pengabaian sampah di tempat umum menyebabkan kerusakan ekosistem. Setiap orang bertanggung jawab atas lingkungan."
        }
    },
    school: {
        start: {
            image: "https://via.placeholder.com/400x300/E0FFFF/000000?text=Sekolah+Bersih",
            text: "Di sekolahmu, sampah plastik dan kertas menumpuk di halaman. Murid-murid sering membuang sampah sembarangan, dan tidak ada program daur ulang yang baik!",
            choices: [
                { text: "Buat program bank sampah sekolah", next: "banksampah" },
                { text: "Organisir workshop tentang lingkungan", next: "workshop" },
                { text: "Biarkan guru yang urus", next: "teacher" }
            ]
        },
        banksampah: {
            image: "https://via.placeholder.com/400x300/228B22/FFFFFF?text=Bank+Sampah+Sekolah",
            text: "Kamu mendirikan bank sampah sekolah. Murid-murid antusias, dan sampah berkurang. Sekolah mendapat penghargaan Adiwiyata.",
            choices: [],
            end: true,
            title: "Ending Baik: Sekolah Adiwiyata",
            endText: "Program bank sampah sukses! Sekolah menjadi contoh bagi sekolah lain dalam pengelolaan sampah."
        },
        workshop: {
            image: "https://via.placeholder.com/400x300/FF69B4/FFFFFF?text=Workshop+Lingkungan",
            text: "Workshop tentang daur ulang dan hemat energi diadakan. Kesadaran murid meningkat, dan sekolah mulai menghemat listrik dan air.",
            choices: [],
            end: true,
            title: "Ending Inspiratif: Generasi Sadar Lingkungan",
            endText: "Workshop membentuk generasi muda yang peduli lingkungan. Pendidikan adalah investasi untuk masa depan!"
        },
        teacher: {
            image: "https://via.placeholder.com/400x300/8B0000/FFFFFF?text=Sekolah+Kotor",
            text: "Sampah terus menumpuk, halaman sekolah kotor, dan tidak ada perubahan. Murid-murid tidak belajar tentang lingkungan.",
            choices: [],
            end: true,
            title: "Ending Buruk: Sekolah Terabaikan",
            endText: "Pengabaian masalah lingkungan di sekolah menghambat pembelajaran. Siswa perlu dilibatkan dalam menjaga lingkungan."
        }
    }
};

let currentLevel = 'factory';
let currentScene = 'start';

function startStoryGame() {
    document.querySelector('.facts-section').style.display = 'none';
    document.getElementById('storySection').style.display = 'flex';
    document.getElementById('levelSelectView').style.display = 'block';
    document.getElementById('storyView').style.display = 'none';
    document.getElementById('storyEndView').style.display = 'none';
}

function selectLevel(level) {
    currentLevel = level;
    currentScene = 'start';
    document.getElementById('levelSelectView').style.display = 'none';
    document.getElementById('storyView').style.display = 'block';
    showScene();
}

function showScene() {
    const scene = storyData[currentLevel][currentScene];
    document.getElementById('storyImage').src = scene.image;
    document.getElementById('storyText').innerText = scene.text;
    
    const choicesContainer = document.getElementById('storyChoices');
    choicesContainer.innerHTML = '';
    
    if (scene.choices.length > 0) {
        scene.choices.forEach(choice => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.innerText = choice.text;
            button.onclick = () => makeChoice(choice.next);
            choicesContainer.appendChild(button);
        });
    } else if (scene.end) {
        showEnding(scene);
    }
}

function makeChoice(nextScene) {
    currentScene = nextScene;
    showScene();
}

function showEnding(scene) {
    document.getElementById('storyView').style.display = 'none';
    document.getElementById('storyEndView').style.display = 'block';
    
    document.getElementById('storyEndTitle').innerText = scene.title;
    document.getElementById('storyEndImage').src = scene.image;
    document.getElementById('storyEndText').innerText = scene.endText;
}

/* ===== WATER SIMULATION FUNCTIONALITY ===== */
let currentDay = 1;
let totalWaterUsed = 0;
let activities = [];
let currentActivityIndex = 0;

const simulationActivities = [
    {
        name: "Mandi Pagi",
        item: "shower",
        description: "Waktunya mandi pagi sebelum berangkat sekolah.",
        options: [
            { text: "Mandi 15 menit", water: 60, feedback: "Bagus! Mandi singkat menghemat air.", type: "good" },
            { text: "Mandi 30 menit", water: 120, feedback: "Lumayan, tapi bisa lebih hemat.", type: "neutral" },
            { text: "Mandi 45 menit", water: 180, feedback: "Terlalu lama! Boros air.", type: "bad" }
        ]
    },
    {
        name: "Gosok Gigi",
        item: "sink",
        description: "Gosok gigi sebelum sarapan.",
        options: [
            { text: "Tutup keran saat gosok gigi", water: 2, feedback: "Sempurna! Hemat air maksimal.", type: "good" },
            { text: "Biarkan keran mengalir agar lebih bersih", water: 12, feedback: "Boros! Keran mengalir sia-sia.", type: "bad" }
        ]
    },
    {
        name: "Sarapan",
        item: "faucet",
        description: "Cuci piring setelah sarapan.",
        options: [
            { text: "Kumpulkan piring, cuci sekaligus", water: 15, feedback: "Efisien! Menghemat air.", type: "good" },
            { text: "Cuci satu per satu dengan keran terbuka", water: 30, feedback: "Boros! Cuci berkelompok lebih hemat.", type: "bad" }
        ]
    },
    {
        name: "Buang Air",
        item: "toilet",
        description: "Pergi ke toilet sebelum berangkat sekolah.",
        options: [
            { text: "Flush sekali", water: 6, feedback: "Normal, tapi perhatikan penggunaan.", type: "neutral" },
            { text: "Flush dua kali untuk memastikan toilet bersih", water: 12, feedback: "Boros! Flush sekali saja cukup.", type: "bad" }
        ]
    },
    {
        name: "Mandi Sore",
        item: "shower",
        description: "Mandi sore setelah pulang sekolah.",
        options: [
            { text: "Mandi 10 menit", water: 40, feedback: "Excellent! Sangat hemat.", type: "good" },
            { text: "Mandi 25 menit", water: 100, feedback: "Standar, tapi bisa lebih baik.", type: "neutral" },
            { text: "Mandi 40 menit)", water: 160, feedback: "Terlalu lama! Boros sekali.", type: "bad" }
        ]
    },
    {
        name: "Mencuci Tangan",
        item: "sink",
        description: "Cuci tangan sebelum makan malam.",
        options: [
            { text: "Tutup keran saat sabun", water: 1, feedback: "Bagus! Kebiasaan hemat air.", type: "good" },
            { text: "Biarkan keran terbuka", water: 8, feedback: "Boros! Tutup keran saat sabun.", type: "bad" }
        ]
    },
    {
        name: "Memasak",
        item: "faucet",
        description: "Memasak makan malam.",
        options: [
            { text: "Gunakan air secukupnya", water: 20, feedback: "Baik! Kontrol penggunaan air.", type: "good" },
            { text: "Biarkan keran mengalir", water: 40, feedback: "Boros! Gunakan baskom untuk mencuci.", type: "bad" }
        ]
    }
];

function resetActivitiesForNewDay() {
    // Create fresh copy of activities with reset properties
    activities = simulationActivities.map(activity => ({
        ...activity,
        completed: false,
        usedWater: 0,
        feedback: '',
        chosenType: null
    }));
}

function startWaterSimulation() {
    currentDay = 1;
    totalWaterUsed = 0;
    currentActivityIndex = 0;
    resetActivitiesForNewDay();
    
    document.querySelector('.facts-section').style.display = 'none';
    document.getElementById('simulationSection').style.display = 'flex';
    document.getElementById('simulationView').style.display = 'block';
    document.getElementById('simulationEndView').style.display = 'none';
    
    updateDayDisplay();
    updateWaterMeter();
    showActivities();
}

function updateWaterMeter() {
    document.getElementById('waterUsed').innerText = totalWaterUsed;
}

function updateDayDisplay() {
    document.getElementById('currentDay').innerText = currentDay;
    const progressPercent = ((currentDay - 1) / 3) * 100;
    document.getElementById('dayProgress').style.width = progressPercent + '%';
}

function showActivities() {
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';
    
    activities.forEach((activity, index) => {
        const activityDiv = document.createElement('div');
        activityDiv.className = `activity-item ${activity.completed ? 'completed' : ''} ${index === currentActivityIndex && !activity.completed ? 'active' : ''} ${activity.completed && activity.chosenType === 'good' ? 'choice-good' : ''} ${activity.completed && activity.chosenType === 'bad' ? 'choice-bad' : ''}`;
        activityDiv.innerHTML = `
            <div class="activity-name">
                ${index === currentActivityIndex && !activity.completed ? '<span class="active-indicator">▶</span>' : ''}
                ${activity.name}
            </div>
            <div class="activity-desc">${activity.description}</div>
            ${activity.completed ? `<div class="activity-result">Digunakan: ${activity.usedWater}L - ${activity.feedback}</div>` : ''}
        `;
        activityList.appendChild(activityDiv);
    });
    
    // Update interactive items
    updateInteractiveItems();
    
    // Hide next day button if not all activities completed
    document.getElementById('nextDayBtn').style.display = activities.every(a => a.completed) ? 'block' : 'none';
}

function updateInteractiveItems() {
    // Reset all items
    document.querySelectorAll('.interactive-item').forEach(item => {
        item.classList.remove('active', 'inactive');
    });
    
    // Mark current activity item as active
    if (currentActivityIndex < activities.length) {
        const currentActivity = activities[currentActivityIndex];
        if (!currentActivity.completed) {
            const item = document.getElementById(currentActivity.item);
            if (item) {
                item.classList.add('active');
            }
        }
    }
    
    // Mark items based on completion status
    const itemStatus = {};
    
    activities.forEach(activity => {
        if (!itemStatus[activity.item]) {
            itemStatus[activity.item] = { completed: [], pending: false };
        }
        
        if (activity.completed) {
            itemStatus[activity.item].completed.push(activity);
        } else {
            itemStatus[activity.item].pending = true;
        }
    });
    
    // Apply status to items
    Object.keys(itemStatus).forEach(itemId => {
        const item = document.getElementById(itemId);
        if (!item) return;
        
        const status = itemStatus[itemId];
        
        if (status.pending) {
            // There's still a pending activity for this item - keep it active
        } else if (status.completed.length > 0) {
            // All activities for this item are completed
            item.classList.add('inactive');
        }
    });
}

function interactWithItem(itemId) {
    if (currentActivityIndex >= activities.length) return;
    
    const currentActivity = activities[currentActivityIndex];
    if (currentActivity.item !== itemId || currentActivity.completed) return;
    
    // Show options for the activity
    showActivityOptions(currentActivity);
}

function showActivityOptions(activity) {
    // Create modal or overlay for options
    const modal = document.createElement('div');
    modal.className = 'activity-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>${activity.name}</h3>
            <p>${activity.description}</p>
            <div class="options-list">
                ${activity.options.map((option, index) => 
                    `<button class="option-btn ${option.type}" onclick="chooseOption(${index})">

                        ${option.text}
                    </button>`
                ).join('')}
            </div>
            <button class="close-modal" onclick="closeModal()">Tutup</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function chooseOption(optionIndex) {
    const activity = activities[currentActivityIndex];
    const option = activity.options[optionIndex];
    
    activity.usedWater = option.water;
    activity.feedback = option.feedback;
    activity.chosenType = option.type; // Store the type of choice made
    activity.completed = true;
    totalWaterUsed += option.water;
    
    updateWaterMeter();
    closeModal();
    currentActivityIndex++;
    showActivities();
    
    // Check if all activities completed
    if (activities.every(a => a.completed)) {
        document.getElementById('nextDayBtn').style.display = 'block';
    }
}

function closeModal() {
    const modal = document.querySelector('.activity-modal');
    if (modal) modal.remove();
}

function nextDay() {
    if (currentDay >= 3) {
        // End simulation after 3 days
        showSimulationResults();
    } else {
        // Add visual transition effect
        const dayDisplay = document.getElementById('currentDay');
        const waterMeter = document.getElementById('waterUsed');
        
        dayDisplay.classList.add('day-transition');
        waterMeter.classList.add('water-reset');
        
        setTimeout(() => {
            currentDay++;
            currentActivityIndex = 0;
            resetActivitiesForNewDay(); // Reset activities for new day
            updateDayDisplay();
            updateWaterMeter(); // Reset water meter for new day
            showActivities();
            document.getElementById('nextDayBtn').style.display = 'none';
            
            // Remove transition classes after animation
            setTimeout(() => {
                dayDisplay.classList.remove('day-transition');
                waterMeter.classList.remove('water-reset');
            }, 500);
        }, 300);
    }
}

function showSimulationResults() {
    document.getElementById('simulationView').style.display = 'none';
    document.getElementById('simulationEndView').style.display = 'block';
    
    const avgWater = Math.round(totalWaterUsed / 3);
    document.getElementById('totalWater').innerText = totalWaterUsed + ' Liter';
    document.getElementById('avgWater').innerText = avgWater + ' Liter';
    
    let grade = 'C';
    let feedback = 'Lumayan, tapi bisa lebih hemat air!';
    
    if (avgWater < 200) {
        grade = 'A';
        feedback = 'Excellent! Kamu sangat hemat air. Teruskan kebiasaan baik ini!';
    } else if (avgWater < 300) {
        grade = 'B';
        feedback = 'Bagus! Kamu cukup hemat air, tapi masih bisa diperbaiki.';
    } else if (avgWater < 400) {
        grade = 'C';
        feedback = 'Lumayan, tapi ada banyak kesempatan untuk hemat air.';
    } else {
        grade = 'D';
        feedback = 'Perlu lebih perhatian! Banyak air terbuang sia-sia.';
    }
    
    document.getElementById('waterGrade').innerText = grade;
    document.getElementById('simulationFeedback').innerText = feedback;
}