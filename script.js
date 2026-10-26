const pageLanguage = location.pathname.endsWith("_english.html") ? "en" : "id";
const isEnglish = pageLanguage === "en";

// Deteksi kelas lebar layar agar CSS dan perilaku interaktif mengikuti ukuran desktop aktif.
const getViewportMode = () => {
    if (window.matchMedia("(max-width: 720px)").matches) return "compact";
    if (window.matchMedia("(max-width: 1100px)").matches) return "tablet";
    if (window.matchMedia("(max-width: 1600px)").matches) return "desktop";
    return "wide";
};

let viewportMode = "";
const updateViewportMode = () => {
    const nextMode = getViewportMode();
    if (nextMode === viewportMode) return;
    viewportMode = nextMode;
    document.documentElement.dataset.viewportMode = viewportMode;
};

updateViewportMode();
window.addEventListener("resize", updateViewportMode, { passive: true });

// Tandai menu halaman yang sedang dibuka agar pengguna tahu posisinya.
document.querySelectorAll("header nav a").forEach((link) => {
    const target = link.getAttribute("href");
    if (target && location.pathname.endsWith(target)) {
        link.setAttribute("aria-current", "page");
    }
});

// Tampilkan bahasa aktif dan buka versi halaman yang sama saat bahasa diganti.
const languageSelector = document.querySelector("header select");
if (languageSelector) {
    const currentPage = location.pathname.split("/").pop() || "index.html";
    const englishPage = currentPage.endsWith("_english.html");
    const basePage = currentPage.replace("_english.html", ".html");
    languageSelector.value = englishPage ? "en" : "ko";

    languageSelector.addEventListener("change", () => {
        const targetPage = languageSelector.value === "en"
            ? basePage.replace(".html", "_english.html")
            : basePage;
        window.location.href = targetPage;
    });
}

// Buat tombol kembali ke atas tanpa perlu menambah markup di setiap halaman.
const backToTop = document.createElement("button");
backToTop.className = "back-to-top";
backToTop.type = "button";
backToTop.setAttribute("aria-label", isEnglish ? "Back to top" : "Kembali ke atas");
backToTop.innerHTML = '<span aria-hidden="true">&#8593;</span>';
document.body.append(backToTop);

// Tampilkan tombol setelah halaman digulir, lalu gulir halus saat tombol ditekan.
const updateBackToTop = () => {
    const compactScreen = viewportMode === "compact";
    const threshold = compactScreen
        ? Math.min(320, Math.max(160, window.innerHeight * 0.35))
        : Math.min(520, Math.max(300, window.innerHeight * 0.45));

    backToTop.classList.toggle("is-visible", window.scrollY > threshold);
};

window.addEventListener("scroll", updateBackToTop, { passive: true });
window.addEventListener("resize", updateBackToTop, { passive: true });
updateBackToTop();

backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

// Munculkan konten bertahap ketika masuk ke layar; hormati pilihan reduced motion.
const revealItems = document.querySelectorAll(
    "main > article, main > section article, main > center > table, main figure"
);

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-revealed");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    revealItems.forEach((item) => {
        item.classList.add("reveal-item");
        revealObserver.observe(item);
    });
}

// Validasi formulir pendaftaran dan jelaskan bahwa demo ini tidak mengirim data.
document.querySelectorAll("main form").forEach((form) => {
    const nameField = form.querySelector('[name="nama"]');
    const emailField = form.querySelector('[name="email"]');
    const schoolField = form.querySelector('[name="sekolah"]');
    const majorField = form.querySelector('[name="jurusan"]');

    [nameField, emailField, schoolField, majorField].forEach((field) => {
        if (!field) return;
        field.required = true;

        // Gunakan teks label yang sudah ada agar kolom lebih mudah dikenali pembaca layar.
        const label = field.closest("tr")?.querySelector("td")?.textContent.trim();
        if (label) field.setAttribute("aria-label", label);
    });

    const status = document.createElement("p");
    status.className = "form-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.hidden = true;
    form.append(status);

    // Cegah reload halaman dan tampilkan konfirmasi hanya setelah semua kolom valid.
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (majorField && majorField.selectedIndex === 0) {
            majorField.setCustomValidity(
                isEnglish ? "Please select a major." : "Silakan pilih jurusan."
            );
        } else if (majorField) {
            majorField.setCustomValidity("");
        }

        if (!form.reportValidity()) return;

        status.textContent = isEnglish
            ? "Your form is valid. This demo does not send or store your information."
            : "Formulir valid. Ini hanya demo; data tidak dikirim atau disimpan.";
        status.hidden = false;
    });

    majorField?.addEventListener("change", () => majorField.setCustomValidity(""));

    // Bersihkan pesan dan validasi jurusan saat formulir direset.
    form.addEventListener("reset", () => {
        window.setTimeout(() => {
            status.hidden = true;
            status.textContent = "";
            majorField?.setCustomValidity("");
        });
    });
});