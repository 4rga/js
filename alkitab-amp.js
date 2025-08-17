(function () {
  'use strict';

  // ====== CONFIG ======
  function buildUrl(refText, versi) {
    versi = versi || 'tb'; // default Terjemahan Baru
    var q = encodeURIComponent(refText.replace(/\s+/g, ' ').trim());
    return 'https://alkitab.mobi/' + versi + '/passage/' + q;
  }

  // ====== NodeFilter fallback (AMP worker) ======
  var SHOW_TEXT = (self.NodeFilter && self.NodeFilter.SHOW_TEXT) ? self.NodeFilter.SHOW_TEXT : 4;

  // ====== Traversal setup ======
  var SKIP_TAGS = { 'A':1, 'CODE':1, 'PRE':1, 'SCRIPT':1, 'STYLE':1, 'TEXTAREA':1, 'SELECT':1 };
  function isAmpTag(tn){ return tn && tn.toLowerCase().indexOf('amp-') === 0; }
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
      for (var i=0;i<el.childNodes.length;i++){
        var n = el.childNodes[i];
        if (n.nodeType === 3){
          cb(n);
        } else if (n.nodeType === 1){
          if (!shouldSkipElement(n)) stack.push(n);
        }
      }
    }
  }

  // ====== Daftar kitab ======
  var books =
    'Kej(?:adian)?|Kel(?:uaran)?|Im(?:amat)?|Bil(?:angan)?|Ul(?:angan)?|' +
    'Yos(?:ua)?|Hak(?:im-?hakim)?|Rut|' +
    '(?:1|I)\\s*Sam(?:uel)?|(?:2|II)\\s*Sam(?:uel)?|' +
    '(?:1|I)\\s*Raj(?:a-?raja)?|(?:2|II)\\s*Raj(?:a-?raja)?|' +
    '(?:1|I)\\s*Taw(?:arikh)?|(?:2|II)\\s*Taw(?:arikh)?|' +
    'Ezr(?:a)?|Neh(?:emia)?|Est(?:er)?|Ayb|Ayub|Mzm|Mazmur|Ams|Amsal|Pkh|Pengkhotbah|Kid|Kidung\\s*Agung|' +
    'Yes(?:aya)?|Yer(?:emia)?|Rat(?:ap)?|Yeh(?:ez(?:k)?iel)?|Dan(?:iel)?|Hos(?:ea)?|Yoel|Am(?:os)?|Ob(?:adya)?|Yun(?:us)?|Mi(?:kha)?|Nah(?:um)?|Hab(?:akuk)?|Zef(?:anya)?|Hag(?:ai)?|Za(?:karia)?|Mal(?:akhi)?|' +
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

  books = books.replace(/([A-Za-z]{2,3})(\\\?:)?/g, '$1$2');

  var verseRe = new RegExp(
    '(?:^|[^\\w])' +
    '(' +
      '(?:(?:1|I|2|II|3|III)\\s*)?' +
      '(?:' + books + ')' +
      '\\.?' +
    ')' +
    '\\s*' +
    '(\\d{1,3})' +
    '(?:' +
      '\\s*:\\s*' +
      '(\\d{1,3})' +
      '(?:\\s*[-–]\\s*(\\d{1,3}))?' +
    ')?' +
    '(?![\\w])'
  , 'gim');

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
    if (!txt) return 0;

    var outFrag = document.createDocumentFragment();
    var last = 0, made = 0, m;

    verseRe.lastIndex = 0;
    while ((m = verseRe.exec(txt)) !== null) {
      var matchStart = m.index;
      var matchEnd   = verseRe.lastIndex;

      if (matchStart > last) {
        outFrag.appendChild(document.createTextNode(txt.slice(last, matchStart)));
      }

      var matchedText = txt.slice(matchStart, matchEnd).trim().replace(/^[^A-Za-z0-9]+/, '');
      outFrag.appendChild(makeLink(matchedText));
      last = matchEnd;
      made++;
    }
    if (made > 0) {
      if (last < txt.length) outFrag.appendChild(document.createTextNode(txt.slice(last)));
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

  // ========== init ==========
  function init() {
    var btn = document.getElementById('linkifyBtn');
    if (btn) {
      btn.addEventListener('click', function(){
        var total = runLinkifier();
        btn.textContent = 'Tautan ayat aktif ('+total+')';
        btn.disabled = true;
      });
    }
    // ❌ jangan auto-run
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
