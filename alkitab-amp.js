'use strict';

/* ===== Branding log (aman di AMP) ===== */
(function () {
  if (!self.__THEO_BRAND_LOGGED__) {
    self.__THEO_BRAND_LOGGED__ = true;
    try {
      var brand = "Theoweb.Dev", site = "https://theo.my.id";
      console.log(
        "%c" + brand + " %c" + site,
        "background:#111;color:#0ff;padding:2px 6px;border-radius:3px;font-weight:700",
        "color:#06c;text-decoration:underline"
      );
    } catch (e) {}
  }
})();

/* ===== Konfigurasi ===== */
var TARGET = 'theo';   // 'theo' => theoweb, selain itu => alkitab.mobi
var ALC_TB = 'tb';

/* ===== Util ===== */
function normalizeDashes(s){ return s.replace(/[\u2012-\u2015\u2212]/g, '-'); }
function cleanSpaces(s){ return s.replace(/\s+/g, ' ').trim(); }

/* ===== URL builder ===== */
function buildUrl(raw) {
  var t = cleanSpaces(normalizeDashes(raw));
  if (TARGET === 'theo') {
    var q = encodeURIComponent(t);
    var ref = encodeURIComponent(self.location.href || '');
    return 'https://www.theo.my.id/p/pencarian-alkitab.html?proses=' + q + '&asal=' + ref;
  }
  return 'https://alkitab.mobi/' + ALC_TB + '/passage/' + encodeURIComponent(t);
}

/* ===== Traversal & skip rules ===== */
var SKIP_TAGS = { A:1, CODE:1, PRE:1, SCRIPT:1, STYLE:1, TEXTAREA:1, SELECT:1 };
function isAmpTag(tag){ return tag && tag.toLowerCase().indexOf('amp-') === 0; }
function shouldSkip(node){
  if (!node || node.nodeType !== 1) return true;
  var t = node.tagName;
  return !!SKIP_TAGS[t] || isAmpTag(t);
}
function forEachTextNode(root, fn) {
  var stack = [root];
  while (stack.length) {
    var el = stack.pop();
    if (el && el.nodeType === 1) {
      for (var i = 0; i < el.childNodes.length; i++) {
        var c = el.childNodes[i];
        if (c.nodeType === 3) fn(c);
        else if (c.nodeType === 1 && !shouldSkip(c)) stack.push(c);
      }
    }
  }
}

/* ===== Regex kitab & ayat ===== */
var booksRaw = "ch|chr|chron|chronicles|co|cor|corinthians|jhn|jn|jo|joh|john|kgs|ki|kin|kings|kor|korintus|pe|pet|peter|petrus|ptr|raj|raja|raja-raja|sa|sam|samuel|taw|tawarikh|tes|tesalonika|th|the|thes|thess|thessalonians|ti|tim|timothy|timotius|yoh|yohanes|genesis|gen|ge|exodus|exod|exo|ex|leviticus|lev|lv|le|numbers|num|nmb|nu|deuteronomy|deut|deu|dt|de|joshua|josh|jos|judges|judg|jdg|ruth|rut|rth|ru|1 samuel|1samuel|1 sam|1sam|1 sa|1sa|i samuel|i sam|i sa|2 samuel|2samuel|2 sam|2sam|2 sa|2sa|ii samuel|ii sam|ii sa|1 kings|1kings|1 kin|1kin|1 kgs|1kgs|1 ki|1ki|i kings|i kin|i kgs|i ki|2 kings|2kings|2 kin|2kin|2 kgs|2kgs|2 ki|2ki|ii kings|ii kin|ii kgs|ii ki|1 chronicles|1chronicles|1 chron|1chron|1 chr|1chr|1 ch|1ch|i chronicles|i chron|i chr|i ch|2 chronicles|2chronicles|2 chron|2chron|2 chr|2chr|2 ch|2ch|ii chronicles|ii chron|ii chr|ii ch|ezra|ezr|nehemiah|neh|nh|ne|nehemia|esther|esth|est|es|ester|job|jb|psalms|psalm|psa|pss|ps|proverbs|proverb|prov|pro|pr|ecclesiastes|eccl|ecc|ec|songs of solomon|songsofsolomon|song of solomon|songofsolomon|song of songs|songofsongs|songs|song|son|sos|so|isaiah|isa|is|jeremiah|jer|je|lamentations|lam|la|ezekiel|ezek|eze|daniel|dan|dn|da|hosea|hos|ho|joel|joe|yl|amos|amo|am|obadiah|oba|ob|jonah|jon|micah|mikha|mic|mi|nahum|nah|na|habakkuk|habakuk|hab|zephaniah|zeph|zep|haggai|hagai|hag|zechariah|zech|zec|za|malachi|mal|matthew|mathew|matt|mat|mt|markus|mark|mar|mrk|mr|mk|luke|luk|lu|lk|john|joh|jhn|jn|acts of the apostles|actsoftheapostles|acts|act|ac|romans|rom|rm|ro|1 corinthians|1corinthians|1 cor|1cor|1 co|1co|i corinthians|i cor|i co|2 corinthians|2corinthians|2 cor|2cor|2 co|2co|ii corinthians|ii cor|ii co|galatians|galatia|gal|ga|ephesians|eph|ep|phillippians|philippians|phill|phil|phi|php|ph|colossians|col|co|1 thessalonians|1thessalonians|1 thess|1thess|1 thes|1thes|1 the|1the|1 th|1th|i thessalonians|i thess|i thes|i the|i th|2 thessalonians|2thessalonians|2 thess|2thess|2 thes|2thes|2 the|2the|2 th|2th|ii thessalonians|ii thess|ii thes|ii the|ii th|1 timothy|1timothy|1 tim|1tim|1 ti|1ti|i timothy|i tim|i ti|2 timothy|2timothy|2 tim|2tim|2 ti|2ti|ii timothy|ii tim|ii ti|titus|tit|philemon|phile|phm|hebrews|heb|he|james|jam|jas|jms|ja|jm|1 peter|1peter|1 pet|1pet|1 pe|1pe|i peter|i pet|i pe|1 ptr|1ptr|2 peter|2peter|2 pet|2pet|2 pe|2pe|ii peter|ii pet|ii pe|2 ptr|2ptr|1 john|1john|1 joh|1joh|1 jhn|1jhn|1 jo|1jo|1 jn|1jn|i john|i joh|i jhn|i jo|i jn|2 john|2john|2 joh|2joh|2 jhn|2jhn|2 jo|2jo|2 jn|2jn|ii john|ii joh|ii jhn|ii jo|ii jn|3 john|3john|3 joh|3joh|3 jhn|3jhn|3 jo|3jo|3 jn|3jn|iii john|iii joh|iii jhn|iii jo|iii jn|jude|jud|ju|revelations|revelation|rev|re|rv|kejadian|kej|kel|keluaran|im|imamat|bil|bilangan|ul|ulangan|yos|yosua|hak|hakim-hakim|rut|ru|1 samuel|1samuel|1 sam|1sam|1 sa|1sa|i samuel|i sam|i sa|2 samuel|2samuel|2 sam|2sam|2 sa|2sa|ii samuel|ii sam|ii sa|1 raj|1 raja|1raj|1raja|1 raja-raja|1raja-raja|2 raj|2 raja|2raj|2raja|2 raja-raja|2raja-raja|i raj|i raja|iraj|iraja|i raja-raja|iraja-raja|ii raj|ii raja|iiraj|iiraja|ii raja-raja|iiraja-raja|1 tawarikh|1tawarikh|1 taw|1taw|i tawarikh|i taw|2 tawarikh|2tawarikh|2 taw|2taw|ii tawarikh|ii taw|ezra|ezr|neh|nh|ne|nehemia|est|es|ester|ayub|ayb|ay|mazmur|maz|mzm|amsal|ams|pengkhotbah|pkh|kidung agung|kidungagung|kid|yesaya|yes|yeremia|yer|ratapan|rat|yehezkiel|yeh|hosea|hos|ho|yoel|yl|amos|amo|am|obaja|oba|ob|yunus|yun|mikha|mik|mi|nahum|nah|na|habakkuk|habakuk|hab|zefanya|zef|haggai|hagai|hag|zakharia|za|maleakhi|mal|matius|mat|mt|markus|mark|mar|mrk|mr|mk|lukas|luk|lu|lk|yohanes|yoh|kisah para rasul|kisah rasul|kis|roma|rom|rm|ro|1 korintus|1korintus|1 kor|1kor|2 korintus|2korintus|2 kor|2kor|i korintus|ikorintus|i kor|ikor|ii korintus|iikorintus|ii kor|iikor|galatia|gal|ga|efesus|ef|filipi|flp|fil|kolose|kol|1 tesalonika|1tesalonika|1 tes|1tes|i tesalonika|i tes|2 tesalonika|2tesalonika|2 tes|2tes|ii tesalonika|ii tes|1timotius|1 timotius|1 tim|1tim|1 ti|1ti|i tim|i ti|i timotius|i tim|i ti|2timotius|2 timotius|2 tim|2tim|2 ti|2ti|ii timotius|ii tim|ii ti|titus|tit|filemon|flm|ibrani|ibr|yakobus|yak|1 pet|1pet|1 pe|1pe|1 petrus|1petrus|1 ptr|1ptr|2 pet|2pet|2 pe|2pe|ii peter|ii pet|ii pe|2 petrus|2petrus|2 ptr|2ptr|1 yohanes|1yohanes|1yoh|1 yoh|i yohanes|i yoh|2 yohanes|2yohanes|ii yohanes|ii yoh|2yoh|2 yoh|3 yohanes|3yohanes|3yoh|3 yoh|iii yohanes|iii yoh|yudas|yud|wahyu|why";
var books = "(?:" + booksRaw.replace(/-/g, "[-\\s]?").replace(/\s+/g, "\\s*") + ")";
var verseRe = new RegExp(
  '(?:^|[^\\w])(' + (books) + '(?:\\.)?)\\s*(\\d{1,3})(?:\\s*:\\s*(\\d{1,3})(?:\\s*[-\\u2013\\u2014\\u2212]\\s*(\\d{1,3}))?)?(?![\\w])',
  'gim'
);

/* ===== Linkify ===== */
function makeLink(text){
  var a = document.createElement('a');
  a.setAttribute('href', buildUrl(text));
  a.setAttribute('target','_blank');
  a.setAttribute('rel','nofollow noopener noreferrer');
  a.appendChild(document.createTextNode(text));
  return a;
}
function linkifyTextNode(node){
  var s = node.nodeValue; 
  if (!s) return 0;
  var frag = document.createDocumentFragment(), last = 0, count = 0, m;
  for (verseRe.lastIndex = 0; (m = verseRe.exec(s)) !== null; ) {
    var start = m.index, end = verseRe.lastIndex, slice = s.slice(start, end);
    if (start > last) frag.appendChild(document.createTextNode(s.slice(last, start)));
    var lead = (/^[^\w]/).test(slice) ? slice[0] : '';
    var core = lead ? slice.slice(1) : slice;
    if (lead) frag.appendChild(document.createTextNode(lead));
    frag.appendChild(makeLink(core.trim()));
    last = end; 
    count++;
  }
  if (count > 0) {
    if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }
  return count;
}
function linkifyAll(root){
  if (!root) return 0;
  var total = 0;
  forEachTextNode(root, function(n){ total += (linkifyTextNode(n) || 0); });
  return total;
}

/* ===== Posisikan tombol di bawah gambar pertama (SETELAH gesture yang sah) ===== */
(function(){
  var btn  = document.getElementById('linkifyBtn');
  var body = document.getElementById('amp-post-body');

  function insertAfter(el, ref){
    if (!el || !ref || !ref.parentNode) return;
    if (ref.nextSibling) ref.parentNode.insertBefore(el, ref.nextSibling);
    else ref.parentNode.appendChild(el);
  }
  function containsVisibleImage(el){
    if (!el || el.nodeType !== 1) return false;
    if (el.tagName === 'NOSCRIPT') return false;
    if (el.tagName === 'AMP-IMG' || el.tagName === 'IMG') return true;
    var q = el.querySelector('amp-img, img');
    if (!q) return false;
    // pastikan bukan di dalam <noscript>
    var p = q.parentNode;
    for (var hop = 0; p && hop < 8; hop++, p = p.parentNode){
      if (p && p.tagName === 'NOSCRIPT') return false;
      if (p === el) break;
    }
    return true;
  }
  function findFirstImageBlock(){
    if (!body) return null;
    var node = body.firstChild;
    while (node){
      if (node.nodeType === 1 && containsVisibleImage(node)) return node;
      node = node.nextSibling;
    }
    return null;
  }

  function revealBtn(){ try{ if(btn) btn.style.visibility = 'visible'; }catch(e){} }

  function moveBtnBelowFirstImage(){
    if (!btn || !body) { revealBtn(); return false; }
    var block = findFirstImageBlock();
    if (!block) { revealBtn(); return false; }
    insertAfter(btn, block);
    revealBtn();
    return true;
  }

  // ===== HANYA gesture yang diizinkan AMP =====
  var moved = false;
  function onUserGesture(){
    if (!moved) moved = moveBtnBelowFirstImage();
    removeGestureListeners();
  }

  function addGestureListeners(){
    document.addEventListener('click', onUserGesture, true);
    document.addEventListener('touchstart', onUserGesture, true);
    document.addEventListener('keydown', onUserGesture, true);
    document.addEventListener('pointerdown', onUserGesture, true);
  }
  function removeGestureListeners(){
    try{
      document.removeEventListener('click', onUserGesture, true);
      document.removeEventListener('touchstart', onUserGesture, true);
      document.removeEventListener('keydown', onUserGesture, true);
      document.removeEventListener('pointerdown', onUserGesture, true);
    }catch(e){}
  }
  addGestureListeners();

  // Klik tombol -> pastikan sudah dipindah, linkify, lalu UBAH jadi HIJAU & disable
  if (btn) {
    btn.addEventListener('click', function(){
      if (!moved) moved = moveBtnBelowFirstImage();
      var n = linkifyAll(body);
      try {
        btn.textContent = '✅ Tautan aktif (' + n + ')';
        btn.setAttribute('disabled','true');

        // warna disabled = HIJAU (bukan abu-abu)
        btn.style.background = '#22c55e';
        btn.style.opacity = '1';
        btn.style.color = '#fff';
        btn.style.cursor = 'default';
        btn.style.boxShadow = '0 4px 10px rgba(0,0,0,.1)';
      } catch(e){}
    });
  } else {
    // fallback: kalau tombol tidak ada, linkify pada klik pertama halaman
    document.addEventListener('click', function(){ linkifyAll(body); }, { once:true, capture:true });
  }
})();
