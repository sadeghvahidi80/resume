/* Demo image shim: next/image optimizer URLs -> direct local assets. */
(function () {
  var segs = location.pathname.split('/').filter(Boolean);
  if (segs.length && /\.[a-z0-9]+$/i.test(segs[segs.length - 1])) segs.pop();
  var i = segs.lastIndexOf('karabi');
  var PREFIX = i === -1 ? '/' : '/' + segs.slice(0, i + 1).join('/') + '/';

  function map(u) {
    if (typeof u !== 'string' || u.indexOf('_next/image') === -1) return u;
    var q = u.indexOf('?');
    if (q === -1) return u;
    var parts = u.slice(q + 1).split('&');
    var inner = null;
    for (var k = 0; k < parts.length; k++) {
      if (parts[k].indexOf('url=') === 0) { inner = parts[k].slice(4); break; }
    }
    if (!inner) return u;
    try { inner = decodeURIComponent(inner.replace(/\+/g, ' ')); } catch (e) { return u; }
    if (!inner) return u;
    return PREFIX + inner.replace(/^\/+/, '');
  }

  function mapSet(v) {
    if (typeof v !== 'string' || v.indexOf('_next/image') === -1) return v;
    return v.split(',').map(function (part) {
      var bits = part.trim().split(/\s+/);
      if (bits[0]) bits[0] = map(bits[0]);
      return bits.join(' ');
    }).join(', ');
  }

  try {
    var d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    if (d && d.set && d.get) {
      Object.defineProperty(HTMLImageElement.prototype, 'src', {
        configurable: true, enumerable: d.enumerable, get: d.get,
        set: function (v) { d.set.call(this, map(v)); }
      });
    }
  } catch (e) { /* keep native behaviour */ }

  try {
    var s = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'srcset');
    if (s && s.set && s.get) {
      Object.defineProperty(HTMLImageElement.prototype, 'srcset', {
        configurable: true, enumerable: s.enumerable, get: s.get,
        set: function (v) { s.set.call(this, mapSet(v)); }
      });
    }
  } catch (e) { /* keep native behaviour */ }

  var nativeSet = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    if (this instanceof HTMLImageElement && typeof value === 'string') {
      var n = String(name).toLowerCase();
      if (n === 'src') value = map(value);
      else if (n === 'srcset') value = mapSet(value);
    }
    return nativeSet.call(this, name, value);
  };
})();
