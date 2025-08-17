(function(){
  // 1) Cari kontainer yang hanya ada di dalam amp-script
  const root = document.getElementById('amp-post-body');
  if (!root) return;

  // 2) Penanda untuk debug cepat
  root.setAttribute('data-alkitab-ready','1');

  // 3) Daftar singkatan & nama kitab umum (Indonesia)
  //   Tambah/kurangi sesuai kebutuhanmu
  const books = [
    // Pentateukh
    'Kej(?:adian)?','Kel(?:uaran)?','Im(?:amat)?','Bil(?:angan)?','Ul(?:angan)?',
    // Sejarah
    'Yos(?:ua)?','Hak(?:im-hakim|im)?','Rut','1\\s*Sam(?:uel)?','2\\s*Sam(?:uel)?',
    '1\\s*Raj(?:a-raja|a)?','2\\s*Raj(?:a-raja|a)?','1\\s*Taw(?:arikh)?','2\\s*Taw(?:arikh)?',
    'Ezr(?:a)?','Neh(?:emia)?','Est(?:er)?',
    // Puisi
    'Ayb(?:ub)?','Mzm|Maz(?:mur)?','Ams(?:al)?','Pkh|Peng(?:khotbah)?','Kid(?:ung)?',
    // Nabi
    'Yes(?:aya)?','Yer(?:emia)?','Rat(?:apan)?','Yeh(?:ezekiel)?','Dan(?:iel)?',
    'Hos(?:ea)?','Yoel','Am(?:os)?','Ob(?:aja)?','Yun(?:us)?','Mi(?:kha)?','Nah(?:um)?',
    'Hab(?:akuk)?','Zef(?:anya)?','Hag(?:ai)?','Zak(?:h?aria)?','Mal(?:akhi)?',
    // Injil & Kisah
    'Mat(?:eus)?','Mrk|Mar(?:kus)?','Luk(?:as)?','Yoh(?:anes)?','Kis(?:ah Para Rasul)?',
    // Surat Paulus
    'Rm|Rom(?:a)?','1\\s*Kor(?:intus)?','2\\s*Kor(?:intus)?','Gal(?:atia)?','Ef(?:esus)?',
    'Flp|Fil(?:ipi)?','Kol(?:ose)?','1\\s*Tes(?:alonika)?','2\\s*Tes(?:alonika)?',
    '1\\s*Tim(?:otius)?','2\\s*Tim(?:otius)?','Tit(?:us)?','File(?:mon)?',
    // Surat umum
    'Ibr(?:ani)?','Yak(?:obus)?','1\\s*Ptr|1\\s*Pet(?:rus)?','2\\s*Ptr|2\\s*Pet(?:rus)?',
    '1\\s*Yoh(?:anes)?','2\\s*Yoh(?:anes)?','3\\s*Yoh(?:anes)?','Yud(?:as)?',
    // Wahyu
    'Why|Wah(?:yu)?'
  ];

  // 4) Regex ayat: KITAB [spasi opsional]PASAL:AYAT(-AYAT)? (support en dash/em dash/hyphen)
  const dash = '[\\-–—]';
  const sp = '[\\s\\u00A0]*'; // include non-breaking space
  const refRe = new RegExp(
    '(' + books.join('|') + ')' + sp +    // nama kitab
    '(\\d+)' +                            // pasal
    sp + ':' + sp +
    '(\\d+)' +                            // ayat awal
    '(?:' + sp + dash + sp + '(\\d+))?',  // ayat akhir (opsional)
    'gi'
  );

  // 5) Util: buat URL tujuan (ganti sesuai layanan ayat favoritmu)
  function makeHref(book, chap, v1, v2){
    // Contoh pakai Alkitab.mobi; boleh kamu ganti ke endpoint kamu sendiri
    let b = book.replace(/\s+/g,' ').trim();
    return 'https://alkitab.mobi/' +
           '?q=' + encodeURIComponent(`${b} ${chap}:${v1}${v2?'-'+v2:''}`);
  }

  // 6) Jalan di semua text node (skip yang di dalam <a>)
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node){
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const p = node.parentNode;
      if (!p) return NodeFilter.FILTER_REJECT;
      // Jangan re-proses jika sudah link
      if (p.nodeName === 'A') return NodeFilter.FILTER_REJECT;
      // Hindari kode/pre
      const tag = p.closest ? p.closest('code,pre,script,style,amp-script') : null;
      if (tag) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  let total = 0;
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach(textNode=>{
    const text = textNode.nodeValue;
    if (!refRe.test(text)) return; // cepat
    refRe.lastIndex = 0;

    // Buat wrapper fragment
    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match;
    while ((match = refRe.exec(text)) !== null){
      const [full, book, chap, v1, v2] = match;

      // teks sebelum match
      if (match.index > lastIndex){
        frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      // buat link
      const a = document.createElement('a');
      a.setAttribute('href', makeHref(book, chap, v1, v2));
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
      a.textContent = full;
      frag.appendChild(a);
      total++;
      lastIndex = match.index + full.length;
    }

    // sisa teks
    if (lastIndex < text.length){
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    // Ganti node
    textNode.parentNode.replaceChild(frag, textNode);
  });

  root.setAttribute('data-alkitab-matches', String(total));
})();
