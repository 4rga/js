(function () {
  'use strict';

  // ====== CONFIG: tujuan link ======
  function buildUrl(refText) {
    var q = encodeURIComponent(refText.trim());
    return 'https://alkitab.mobi/passage.php?passage=' + q;
  }

  // ====== Traversal (tanpa NodeFilter) ======
  var SKIP_TAGS = { A:1, CODE:1, PRE:1, SCRIPT:1, STYLE:1, TEXTAREA:1, SELECT:1 };
  function isAmpTag(tag){ return tag && tag.toLowerCase().indexOf('amp-') === 0; }
  function shouldSkipElement(el){
    if (!el || el.nodeType !== 1) return true;
    var tn = el.tagName;
    if (SKIP_TAGS[tn]) return true;
    if (isAmpTag(tn)) return true;
    return false;
  }
  function forEachTextNode(rootEl, cb){
    var stack = [rootEl];
    while (stack.length){
      var el = stack.pop();
      if (!el || el.nodeType !== 1) continue;
      if (shouldSkipElement(el) && el !== rootEl) continue;

      // iterasi child
      for (var i=0;i<el.childNodes.length;i++){
        var n = el.childNodes[i];
        if (n.nodeType === 3){            // TEXT_NODE
          cb(n);
        } else if (n.nodeType === 1){     // ELEMENT_NODE
          if (!shouldSkipElement(n)) stack.push(n);
        }
      }
    }
  }

  // ====== Daftar kitab (ID lengkap + singkatan umum) ======
  // dukung: angka romawi/arab di depan, titik opsional setelah singkatan, spasi opsional
  var books =
    // PL
    'Kej(?:adian)?|Kel(?:uaran)?|Im(?:amat)?|Bil(?:angan)?|Ul(?:angan)?|' +
    'Yos(?:ua)?|Hak(?:im-?hakim)?|Rut|' +
    '(?:1|I)\\s*Sam(?:uel)?|(?:2|II)\\s*Sam(?:uel)?|' +
    '(?:1|I)\\s*Raj(?:a-?raja)?|(?:2|II)\\s*Raj(?:a-?raja)?|' +
    '(?:1|I)\\s*Taw(?:arikh)?|(?:2|II)\\s*Taw(?:arikh)?|' +
    'Ezr(?:a)?|Neh(?:emia)?|Est(?:er)?|Ayb|Ayub|Mzm|Mazmur|Ams|Amsal|Pkh|Pengkhotbah|Kid|Kidung\\s*Agung|' +
    'Yes(?:aya)?|Yer(?:emia)?|Rat(?:ap)?|Yeh(?:ez(?:k)?iel)?|Dan(?:iel)?|Hos(?:ea)?|Yoel|Am(?:os)?|Ob(?:adya)?|Yun(?:us)?|Mi(?:kha)?|Nah(?:um)?|Hab(?:akuk)?|Zef(?:anya)?|Hag(?:ai)?|Za(?:karia)?|Mal(?:akhi)?|' +
    // PB
    'Mat(?:eus)?|Mrk\\.?|Mr(?:kus)?|Markus|Luk(?:as)?|Yoh(?:anes)?|' +
    'Kis(?:ah(?:\\s*Para\\s*Rasul)?)?|' +
    'Rm|Rom(?:a)?|Roma|' +
    '(?:1|I)\\s*Kor(?:intus)?|(?:2|II)\\s*Kor(?:intus)?|' +
    'Gal(?:atia)?|Ef(?:esus)?|Flp|Fil(?:ipi)?|Kol(?:ose)?|' +
    '(?:1|I)\\s*Tes(?:alonika)?|(?:2|II)\\s*Tes(?:alonika)?|' +
    '(?:1|I)\\s*Tim(?:otius)?|(?:2|II)\\s*Tim(?:otius)?|Tit(?:us)?|Flm|Filemon|' +
    'Ibr(?:ani)?|Yak(?:obus)?|' +
    '(?:1|I)\\s*Ptr|(?:2|II)\\s*Ptr|(?:1|I)\\s*Petrus|(?:2|II)\\s*Petrus|' +
    '(?:1|I)\\s*Yoh(?:anes)?|(?:2|II)\\s*Yoh(?:anes)?|(?:3|III)\\s*Yoh(?:anes)?|' +
    'Yud(?:as)?|Why|Wahyu';

  // ====== Regex referensi ======
  // Contoh yang terdeteksi:
  // 1Kor 13:4-7, 1 Kor 13:4–7, Ef 2:8-9, Mrk. 1:1, Roma 8, Yoh 3:16
  var verseRe = new RegExp(
    '(?:^|[^\\w])' +                 // batas kiri longgar (bukan huruf/angka) agar match di tengah kalimat
    '(' +
      '(?:(?:1|I|2|II|3|III)\\s*)?' + // ordinal opsional
      '(?:' + books + ')' +          // nama kitab
      '\\.?' +                       // titik opsional setelah singkatan
    ')' +
    '\\s*' +                         // spasi opsional
    '(\\d{1,3})' +                   // pasal
    '(?:' +
      '\\s*:\\s*' +                  // : ayat
      '(\\d{1,3})' +                 // ayat awal
      '(?:\\s*[-–]\\s*(\\d{1,3}))?' +// rentang ayat opsional
    ')?' +
    '(?![\\w])'                      // batas kanan longgar
  , 'gim');

  function makeLink(refText) {
    var a = document.createElement('a');
    a.setAttribute('href', buildUrl(refText));
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'nofollow noopener');
    a.appendChild(document.createTextNode(refText));
    return a;
  }

  // bersihkan karakter bukan huruf/angka di awal/akhir match, contoh: "(Ef 2:8-9)" -> "Ef 2:8-9"
  function cleanBoundary(s){
    if (!s) return s;
    // hapus spasi dulu
    s = s.trim();
    // hapus pembuka non-alfanumerik di depan
    s = s.replace(/^[^A-Za-z0-9]+/, '');
    // hapus penutup non-alfanumerik di belakang (kecuali tanda hubung dalam rentang sudah di-handle regex)
    s = s.replace(/[^A-Za-z0-9)]+$/, function(tail){
      // kalau tail cuma tanda tutup kurung/kutip/titik koma/komma/kolon titik dsb., hilangkan
      return '';
    });
    return s.trim();
  }

  function linkifyTextNode(tn) {
    var txt = tn.nodeValue;
    if (!txt) return 0;

    var outFrag = document.createDocumentFragment();
    var last = 0, made = 0, m;

    verseRe.lastIndex = 0;
    while ((m = verseRe.exec(txt)) !== null) {
      var matchStart = m.index;
      var matchEnd   = verseRe.lastIndex;

      // potongan sebelum match
      if (matchStart > last) {
        outFrag.appendChild(document.createTextNode(txt.slice(last, matchStart)));
      }

      // potongan yang cocok
      var matchedText = txt.slice(matchStart, matchEnd);
      matchedText = cleanBoundary(matchedText);

      if (matchedText) {
        outFrag.appendChild(makeLink(matchedText));
        made++;
      } else {
        // kalau entah kenapa kosong setelah dibersihkan, kembalikan teks aslinya saja
        outFrag.appendChild(document.createTextNode(txt.slice(matchStart, matchEnd)));
      }

      last = matchEnd;
    }

    // sisa setelah match terakhir
    if (last < txt.length) {
      outFrag.appendChild(document.createTextNode(txt.slice(last)));
    }

    if (made > 0) {
      tn.parentNode.replaceChild(outFrag, tn);
    }
    return made;
  }

  function runLinkifier() {
    var root = document.getElementById('amp-post-body');
    if (!root) return 0;
    var total = 0;
    forEachTextNode(root, function(n){ total += linkifyTextNode(n) || 0; });
    try { console.log('[alkitab-amp] total link dibuat:', total); } catch(e){}
    return total;
  }

  function init() {
    // otomatis (fixed-height) — langsung jalankan
    runLinkifier();

    // opsional: tombol manual kalau kamu sediakan
    var btn = document.getElementById('linkifyBtn');
    if (btn) btn.addEventListener('click', runLinkifier);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
