<script>
/* === Alkitab Linkifier – tanpa dependency === */
(() => {
  // --- Konfigurasi ---
  const CONFIG = {
    baseUrl: 'https://www.theo.my.id/p/pencarian-alkitab.html',
    linkClass: 'alkitab-link',
    openInNewTab: true,
    // Elemen yang di-skip
    skipIn: new Set(['A','SCRIPT','STYLE','CODE','PRE','TEXTAREA','INPUT','SELECT','SVG','NOSCRIPT'])
  };

  // --- Daftar nama kitab & singkatan umum (ID + EN) ---
  // (Bisa ditambah sesuai kebutuhan. Case-insensitive & mendukung angka romawi/arab di depan)
  const books = [
    // Pentateukh (ID/EN)
    'kejadian|kej|genesis|gen|ge',
    'keluaran|kel|exodus|exod|exo|ex',
    'imamat|im|leviticus|lev|lv|le',
    'bilangan|bil|numbers|num|nu',
    'ulangan|ul|deuteronomy|deut|deu|dt',

    // Sejarah
    'yosua|yos|joshua|josh|jos',
    'hakim[-\\s]?hakim|hak|judges|judg|jdg',
    'rut|ru|ruth|rth',
    '(?:1|i)\\s*samuel|1\\s*sam|1sa|i\\s*sam',
    '(?:2|ii)\\s*samuel|2\\s*sam|2sa|ii\\s*sam',
    '(?:1|i)\\s*raja(?:-raja)?|1\\s*raj|1\\s*raja|1\\s*kings|1\\s*kin|1\\s*kgs|i\\s*kings',
    '(?:2|ii)\\s*raja(?:-raja)?|2\\s*raj|2\\s*raja|2\\s*kings|2\\s*kin|2\\s*kgs|ii\\s*kings',
    '(?:1|i)\\s*tawarikh|1\\s*taw|1\\s*chronicles|1\\s*chron|1\\s*chr|i\\s*chronicles',
    '(?:2|ii)\\s*tawarikh|2\\s*taw|2\\s*chronicles|2\\s*chron|2\\s*chr|ii\\s*chronicles',
    'ezra|ezr',
    'nehemia|neh|nehemiah',
    'ester|est|esther|es',

    // Hikmat
    'ayub|job|jb',
    'mazmur|mzm|maz|psalms?|psa|ps',
    'amsal|ams|proverbs?|prov|pr',
    'pengkhotbah|pkh|ecclesiastes|eccl|ecc',
    'kidung\\s*agung|kid|songs?\\s*of\\s*solomon|song\\s*of\\s*songs|sos|song',

    // Nabi
    'yesaya|yes|isaiah|isa|is',
    'yeremia|yer|jeremiah|jer|je',
    'ratapan|rat|lamentations|lam|la',
    'yehezkiel|yeh|ezekiel|ezek|eze',
    'daniel|dan|da|dn',
    'hosea|hos|ho',
    'yoel|jl?|joel',
    'amos|amo|am',
    'obaja|oba|obadiah|oba|ob',
    'yunus|yun|jonah|jon',
    'mikha|mik|mi|micah',
    'nahum|nah|na',
    'habak(?:kuk)?|hab',
    'zefanya|zef|zephaniah|zeph|zep',
    'hagai|hag|haggai',
    'zakharia|za|zechariah|zech|zec',
    'maleakhi|mal|malachi',

    // Injil & Kisah
    'matius|mat|mt|matt?hew',
    'markus|mrk|mr|mk|mark',
    'lukas|luk|lk|luke',
    'yohanes|yoh|john|joh|jn|jhn',
    'kis(?:ah(?:\\s*para)?\\s*rasul)?|kisah\\s*rasul|acts?',

    // Surat Paulus
    'roma|rom|ro|rm|romans?',
    '(?:1|i)\\s*korintus|1\\s*kor|1co|1\\s*corinthians?',
    '(?:2|ii)\\s*korintus|2\\s*kor|2co|2\\s*corinthians?',
    'galatia|gal|ga|galatians?',
    'efesus|ef|ephesians?|eph',
    'filipi|flp|fil|phil(?:ippians?)?',
    'kolose|kol|colossians?|col',
    '(?:1|i)\\s*tesalonika|1\\s*tes|1\\s*thes(?:salonians?)?',
    '(?:2|ii)\\s*tesalonika|2\\s*tes|2\\s*thes(?:salonians?)?',
    '(?:1|i)\\s*timotius|1\\s*tim|1\\s*ti|1\\s*timothy',
    '(?:2|ii)\\s*timotius|2\\s*tim|2\\s*ti|2\\s*timothy',
    'titus|tit',
    'filemon|flm|philemon|phm',

    // Surat umum & Wahyu
    'ibrani|ibr|hebrews?|heb',
    'yakobus|yak|james|jas|jam',
    '(?:1|i)\\s*petrus|1\\s*ptr|1\\s*pet|1\\s*pe|1\\s*peter',
    '(?:2|ii)\\s*petrus|2\\s*ptr|2\\s*pet|2\\s*pe|2\\s*peter',
    '(?:1|i)\\s*yohanes|1\\s*yoh|1\\s*jo?hn',
    '(?:2|ii)\\s*yohanes|2\\s*yoh|2\\s*jo?hn',
    '(?:3|iii)\\s*yohanes|3\\s*yoh|3\\s*jo?hn',
    'yudas|jude',
    'wahyu|why|revelation|rev|rv'
  ];

  // Gabungkan semua nama kitab jadi satu pattern
  const bookPattern = `(?:${books.join('|')})`;

  // Pola referensi:
  // <book>[.]? <spasi> <chapter>[optional :verse[-verse][, next] ...]
  // Contoh cocok: "Yoh 3:16", "1 Kor 13:4-7", "Kej 1", "Mazmur 23", "1 Raj 8:1, 3; 9:2"
  const refPattern =
    String.raw`\b(${bookPattern})\.?\s+` +          // 1 = nama kitab
    String.raw`(\d+(?:\s*(?:[:\-–—,;]\s*|\s+)\d+(?:-\d+)*)*(?:\s*(?:,|;|\s+dan\s+)\s*\d+(?::\d+(?:-\d+)*)*)*)`; // 2 = cap/verses

  const REF_RE = new RegExp(refPattern, 'ig');

  // Normalisasi teks referensi (ganti dash aneh, rapikan spasi, "dan" → koma)
  function normalizeRef(book, rest) {
    let s = `${book} ${rest}`;
    s = s
      .replace(/[–—]/g, '-')          // en/em dash → hyphen
      .replace(/\s+/g, ' ')           // multi spasi → satu
      .replace(/\n+/g, ' ')
      .trim();

    // Ubah " dan " menjadi pemisah daftar (heuristik):
    // - jika ada "dan" di antara bagian numerik, ganti jadi koma
    s = s.replace(/(\d)\s*dan\s*(\d)/gi, '$1, $2');
    s = s.replace(/:\s*dan\s*(\d)/gi, ':$1'); // "3:dan 16" → "3:16" (kasus typo)
    return s;
  }

  function makeLink(text) {
    const url = `${CONFIG.baseUrl}?proses=${encodeURIComponent(text)}&asal=${encodeURIComponent(location.href)}`;
    const a = document.createElement('a');
    a.href = url;
    a.textContent = text;
    a.className = CONFIG.linkClass;
    a.setAttribute('data-alkitab-linked', '1');
    if (CONFIG.openInNewTab) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    return a;
  }

  function shouldSkip(node) {
    let el = node.parentNode;
    while (el && el.nodeType === 1) {
      if (CONFIG.skipIn.has(el.nodeName)) return true;
      if (el.hasAttribute && el.hasAttribute('data-alkitab-linked')) return true;
      el = el.parentNode;
    }
    return false;
  }

  function linkifyTextNode(node) {
    const text = node.nodeValue;
    if (!text || !REF_RE.test(text)) return; // quick check
    REF_RE.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    while ((match = REF_RE.exec(text)) !== null) {
      const [full, book, tail] = match;

      // Tambahkan teks sebelum match
      if (match.index > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      const normalized = normalizeRef(book, tail);
      frag.appendChild(makeLink(normalized));
      lastIndex = match.index + full.length;

      // Hindari infinite loop bila regex match kosong (harusnya tidak terjadi)
      if (REF_RE.lastIndex === match.index) REF_RE.lastIndex++;
    }

    // Sisa teks setelah match terakhir
    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    node.parentNode.replaceChild(frag, node);
  }

  function process(root = document.body) {
    if (!root) return;
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (n) => {
          if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          if (shouldSkip(n)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    const nodes = [];
    let cur;
    while ((cur = walker.nextNode())) nodes.push(cur);
    nodes.forEach(linkifyTextNode);
  }

  // Jalankan saat DOM siap
  document.addEventListener('DOMContentLoaded', () => process());

  // API opsional: expose untuk dipakai manual jika dibutuhkan
  window.AyoNgelinkAlkitabSafe = { process };
})();
</script>
