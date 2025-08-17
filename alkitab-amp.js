(function () {
  'use strict';

  // ====== CONFIG ======
  // Tujuan link (bisa diganti bible.com dsb)
  function buildUrl(refText) {
    var q = encodeURIComponent(refText.trim());
    return 'https://alkitab.sabda.org/passage.php?passage=' + q;
  }

  // ====== UTIL: NodeFilter fallback (AMP worker DOM) ======
  var SHOW_TEXT = (self.NodeFilter && self.NodeFilter.SHOW_TEXT) ? self.NodeFilter.SHOW_TEXT : 4;

  // ====== Traversal: kumpulkan semua text node yang boleh dimodif ======
  var SKIP_TAGS = {
    'A': 1, 'CODE': 1, 'PRE': 1, 'SCRIPT': 1, 'STYLE': 1, 'TEXTAREA': 1, 'SELECT': 1
  };
  function isAmpTag(tagName) {
    return tagName && tagName.toLowerCase().indexOf('amp-') === 0;
  }
  function shouldSkipElement(el) {
    if (!el || el.nodeType !== 1) return true; // bukan element
    var tn = el.tagName;
    if (SKIP_TAGS[tn]) return true;
    if (isAmpTag(tn)) return true;
    return false;
  }
  function forEachTextNode(rootEl, cb) {
    var stack = [rootEl];
    while (stack.length) {
      var el = stack.pop();
      if (!el || el.nodeType !== 1) continue;
      // lewati subtree yang tidak boleh
      if (shouldSkipElement(el) && el !== rootEl) continue;

      for (var i = 0; i < el.childNodes.length; i++) {
        var node = el.childNodes[i];
        if (node.nodeType === 3) {
          cb(node);
        } else if (node.nodeType === 1) {
          // hindari masuk ke <a>, <code>, <pre>, amp-*
          if (!shouldSkipElement(node)) stack.push(node);
        }
      }
    }
  }

  // ====== Regex Pola Ayat (ID) ======
  // Daftar singkatan yang umum dipakai (boleh ditambah sesuai kebutuhan)
  var books =
    'Kej(?:adian)?|Kel(?:uaran)?|Im(?:amat)?|Bil(?:angan)?|Ul(?:angan)?|' +
    'Yos(?:ua)?|Hak(?:im-hakim)?|Rut|' +
    '(?:1|I)\\s*Sam|(?:2|II)\\s*Sam|' +
    '(?:1|I)\\s*Raj|(?:2|II)\\s*Raj|' +
    '(?:1|I)\\s*Taw|(?:2|II)\\s*Taw|' +
    'Ezr(?:a)?|Neh(?:emia)?|Est(?:er)?|Ayb|Mzm|Ams|Pkh|Kid|' +
    'Yes(?:aya)?|Yer(?:emia)?|Rat|Yeh(?:eziel)?|Dan(?:iel)?|Hos(?:ea)?|Yoel|Am(?:os)?|Obd|Yun(?:us)?|Mi(?:kha)?|Nah(?:um)?|Hab(?:akuk)?|Zef(?:anya)?|Hag(?:ai)?|Za(?:karia)?|Mal(?:akhi)?|' +
    'Mat(?:eus)?|Mrk|Mr(?:kus)?|Markus|Luk(?:as)?|Yoh(?:anes)?|Kis(?:ah Para Rasul)?|' +
    'Rm|Rom(?:a)?|' +
    '(?:1|I)\\s*Kor|(?:2|II)\\s*Kor|Gal|Ef|Flp|Filipi|Kol|' +
    '(?:1|I)\\s*Tes|(?:2|II)\\s*Tes|' +
    '(?:1|I)\\s*Tim|(?:2|II)\\s*Tim|Tit|Flm|Filemon|Ibr|Ibrani|Yak|Yakobus|' +
    '(?:1|I)\\s*Ptr|(?:2|II)\\s*Ptr|Petrus|' +
    '(?:1|I)\\s*Yoh|(?:2|II)\\s*Yoh|(?:3|III)\\s*Yoh|' +
    'Yud(?:as)?|Why|Wahyu';

  // Bentuk yang didukung (contoh): "Yoh 3:16", "Matius 5", "1 Kor 13:4-7"
  // Grup:
  // 1 = nama kitab, 2 = pasal, 3 = ayat awal (opsional), 4 = ayat akhir (opsional)
  var verseRe = new RegExp(
    '\\b(' + books + ')\\s+(\\d{1,3})(?::(\\d{1,3})(?:[-–](\\d{1,3}))?)?\\b',
    'gi'
  );

  function makeLink(refText) {
    var a = document.createElement('a');
    a.setAttribute('href', buildUrl(refText));
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'nofollow noopener');
    a.appendChild(document.createTextNode(refText));
    return a;
  }

  function linkifyTextNode(tn) {
    var txt = tn.nodeValue;
    if (!txt || !verseRe.test(txt)) {
      // reset lastIndex (karena pakai /g)
      verseRe.lastIndex = 0;
      return;
    }
    verseRe.lastIndex = 0;

    var frag = document.createDocumentFragment();
    var lastIdx = 0;
    var m;
    while ((m = verseRe.exec(txt)) !== null) {
      var start = m.index;
      var end = verseRe.lastIndex;

      // teks sebelum match
      if (start > lastIdx) {
        frag.appendChild(document.createTextNode(txt.slice(lastIdx, start)));
      }

      // teks yang di-link
      var matchedText = txt.slice(start, end); // tampilkan sama persis
      frag.appendChild(makeLink(matchedText));

      lastIdx = end;
    }
    // sisa teks
    if (lastIdx < txt.length) {
      frag.appendChild(document.createTextNode(txt.slice(lastIdx)));
    }

    // ganti node
    tn.parentNode.replaceChild(frag, tn);
  }

  function runLinkifier() {
    var root = document.getElementById('amp-post-body');
    if (!root) return;
    forEachTextNode(root, linkifyTextNode);
  }

  // ====== MODE: otomatis atau perlu klik (untuk layout="container") ======
  function init() {
    var btn = document.getElementById('linkifyBtn');
    if (btn) {
      btn.addEventListener('click', function () {
        runLinkifier();
      });
    } else {
      // Tanpa tombol: jalan otomatis (cocok untuk layout="fixed-height")
      runLinkifier();
    }
  }

  // Jalankan setelah DOM siap di scope amp-script
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
