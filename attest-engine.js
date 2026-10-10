/* VET Heat – invul-engine voor de officiële Vlaamse attesten.
 * Het officiële model blijft ongewijzigd: de gegevens worden er enkel bovenop geschreven.
 * Werkt in de browser (window.PDFLib) en in Node (require('pdf-lib')).
 */
(function (root) {
  const PDFLib = root.PDFLib || (typeof require !== 'undefined' ? require('pdf-lib') : null);
  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const H = 841.89;                 // A4-hoogte in pt
  let INK = rgb(0.05, 0.16, 0.48); // donkerblauw "balpen"-inkt (zwart via opts.ink)
  const FS = 8.2;                   // standaard lettergrootte

  // ---- hulpfuncties (top = afstand vanaf bovenrand, zoals gemeten in het model) ----
  const X = (x0, top) => ({ x0, top });               // aankruisvakje □
  const T = (x, top, max) => ({ x, top, max });        // tekst op één regel
  const D = (segs, top) => ({ segs, top });           // datum dd - mm - jjjj op streepjes

  const MAP = {
    rein: {
      file: 'reinigingsattest.pdf',
      soortOnderhoud: X(170.1, 16.4),
      volgnummer: T(398, 16.6, 575),
      firma: { naam: T(54, 38, 280), straat: T(94, 52, 280), postcode: T(122, 66, 280), tel: T(44, 81, 280), email: T(54, 95, 280), kbo: T(108, 109, 280) },
      tech: { naam: T(387, 38, 575), erkend: X(298.1, 52.0), gv: T(386, 52, 436), tv: T(455, 52, 520), schoorsteenveger: X(298.1, 66.2) },
      datum: D([[355.4, 375.4], [377.8, 397.7], [400.2, 432.1]], 94.8),
      van: T(358, 108.8, 392), tot: T(407, 108.8, 445),
      klant: { naam: T(118, 137, 285), straat: T(92, 151, 285), postcode: T(120, 165, 285), tel: T(42, 179, 285), email: T(54, 194, 285) },
      adresToestel: [T(293, 140, 575), T(293, 154, 575), T(293, 168, 575)],
      kenmerken: {
        centraal: X(28.5, 220.8), typeB: X(134.7, 220.8), typeBcode: T(218, 220.6, 236), typeC: X(276.3, 220.8), typeCcode: T(359.5, 220.6, 377),
        gas: X(28.5, 230.6), aardgas: X(134.7, 230.6), lpg: X(205.5, 230.6), gasAndere: X(276.3, 230.6), gasAndereTxt: T(341, 230.6, 575),
        nietPremix: X(134.7, 240.3), premix: X(205.5, 240.3), ventilator: X(276.3, 240.3),
        vloeibaar: X(28.5, 250.1),
        vast: X(28.5, 259.8), pellets: X(99.3, 259.8), blokken: X(170.1, 259.8), vastAndere: X(240.9, 259.8), vastAndereTxt: T(306, 259.8, 575)
      },
      toestel: { merk: T(50, 280, 285), type: T(48, 294, 285), bouwjaar: T(64, 308, 285), serie: T(92, 322, 285), vermogen: T(116, 336, 285) },
      brander: { merk: T(312, 280, 575), type: T(309, 294, 575), bouwjaar: T(326, 308, 575), serie: T(354, 322, 575), debiet: T(421, 336, 575) },
      reiniging: {
        vegen: X(28.5, 360.8), nazicht: X(28.5, 374.8), terugslag: X(28.5, 389.0),
        andere: X(127.8, 413.7), andereTxt: T(194, 414, 575), verluchting: X(127.8, 427.7), dichtheid: X(127.8, 441.9),
        gasOntstoffing: X(127.8, 456.3), gasBranderbedden: X(127.8, 470.5), gasVentilator: X(127.8, 484.7),
        olFilters: X(127.8, 498.9), olKetel: X(127.8, 513.1), olBrander: X(127.8, 527.3),
        vastNazicht: X(127.8, 541.5), vastReiniging: X(127.8, 555.7)
      },
      vrij: {
        gebreken: { x: 31, top: 590, max: 572, lines: 3, lh: 9.5 },
        maatregelen: { x: 31, top: 629.5, max: 572, lines: 2, lh: 9 },
        opmerkingen: { x: 31, top: 656, max: 572, lines: 2, lh: 9.5 }
      },
      volgendeToestel: D([[347.1, 390.9], [393.4, 437.2], [439.6, 507.4]], 682.0),
      volgendeKanaal: D([[347.1, 396.4], [399.1, 448.4], [451.2, 527.4]], 692.0),
      sigTech: { x: 32, top: 703, w: 240, h: 31 },
      sigKlant: { x: 352, top: 704, w: 200, h: 30 }
    },

    verb: {
      file: 'verbrandingsattest.pdf',
      onderhoud: X(134.8, 15.4), keuring: X(205.6, 15.4),
      volgnummer: T(444, 15.6, 575),
      firma: { naam: T(52, 37, 280), straat: T(92, 48, 280), postcode: T(121, 61, 280), tel: T(42, 73, 280), email: T(54, 84, 280), kbo: T(108, 95, 280) },
      tech: { naam: T(387, 37, 575), gv: T(380, 61.4, 456), tv: T(476, 61.4, 553) },
      datum: D([[363.4, 391.3], [393.7, 425.6], [428.1, 471.9]], 84.4),
      van: T(359, 95.5, 404), tot: T(420, 95.5, 473),
      klant: { naam: T(118, 119, 285), straat: T(92, 130, 285), postcode: T(121, 141, 285), tel: T(42, 152, 285), email: T(54, 164, 285) },
      adresToestel: [T(293, 121, 575), T(293, 133, 575), T(293, 145, 575)],
      kenmerken: {
        centraal: X(28.6, 186.7), typeB: X(134.8, 186.7), typeBcode: T(218, 186.5, 236), typeC: X(276.4, 186.7), typeCcode: T(359.5, 186.5, 377),
        gas: X(28.6, 196.5), aardgas: X(134.8, 196.5), lpg: X(205.6, 196.5), gasAndere: X(276.4, 196.5), gasAndereTxt: T(341, 196.5, 575),
        nietPremix: X(134.8, 206.2), premix: X(205.6, 206.2), ventilator: X(276.4, 206.2),
        vloeibaar: X(28.6, 216.0),
        vast: X(28.6, 225.7), pellets: X(134.8, 225.7), blokken: X(205.6, 225.7), vastAndere: X(276.4, 225.7), vastAndereTxt: T(341, 225.7, 575)
      },
      toestel: { merk: T(50, 246, 278), type: T(48, 257, 278), bouwjaar: T(64, 268, 278), serie: T(92, 280, 278), vermogen: T(116, 291, 278) },
      brander: { merk: T(305, 246, 575), type: T(303, 257, 575), bouwjaar: T(319, 268, 575), serie: T(347, 280, 575), debiet: T(415, 291, 575) },
      laaglast: X(458.6, 323.4), hooglast: X(497.6, 323.4),
      cols: { p1: [375, 457], low: [457, 496], high: [496, 535] },
      rijen: {
        ketelT: 339, sproeierMerk: 353, sproeierDebiet: 367, sproeierHoek: 381, pompdruk: 396,
        gasTeller: 410, gasBlok: 424, gasBranderbed: 438, rookindex: 452, o2: 467, co2: 481, co: 495,
        tg: 509, ta: 523, tnet: 538, hi: 552, hs: 566
      },
      okNok: { rookindex: [X(543.4, 452.3), X(564.7, 452.3)], co: [X(543.4, 494.9), X(564.7, 494.9)], hi: [X(543.4, 551.7), X(564.7, 551.7)] },
      checks: {
        olie: [X(415.2, 575.9), X(508.7, 575.9)], condens: [X(415.2, 585.9), X(508.7, 585.9)], rook: [X(415.2, 595.9), X(508.7, 595.9)],
        drukRga: [X(415.2, 620.1), X(508.7, 620.1)], verluchting: [X(415.2, 630.1), X(508.7, 630.1)],
        dichtheidRga: [X(415.2, 640.1), X(508.7, 640.1)], dichtheidGas: [X(415.2, 650.1), X(508.7, 650.1)]
      },
      drukPa: { segs: [[281.4, 325.2]], top: 619.6 },
      goed: X(135.1, 677.7), nietGoed: X(135.1, 687.4), veilig: X(205.8, 677.7), nietVeilig: X(205.8, 687.4),
      volgende: D([[427.7, 467.5], [470.0, 509.8], [512.3, 572.0]], 680.9),
      vrij: {
        gebreken: { x: 275, top: 709.3, max: 572, lines: 2, lh: 9, firstX: 275, nextX: 31 },
        opmerkingen: { x: 104, top: 728.3, max: 572, lines: 3, lh: 9, firstX: 104, nextX: 31 }
      },
      sigTech: { x: 33, top: 756, w: 290, h: 27 },
      sigKlant: { x: 402, top: 754, w: 170, h: 29 }
    }
  };

  // WinAnsi-veilig maken (Helvetica kan geen subscript-tekens enz.)
  const clean = (s) => String(s == null ? '' : s)
    .replace(/[₀-₉]/g, (c) => String(c.charCodeAt(0) - 0x2080))
    .replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, '-')
    .replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ€…•]/g, '');

  function splitDate(iso) {
    if (!iso) return null;
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? [m[3], m[2], m[1]] : null;
  }

  async function fillAttest(kind, data, templateBytes, opts = {}) {
    const M = MAP[kind];
    INK = opts.ink === 'zwart' ? rgb(0.05, 0.05, 0.05) : rgb(0.05, 0.16, 0.48);
    const pdf = await PDFDocument.load(templateBytes);
    const page = pdf.getPages()[0];
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const fit = (txt, size, maxW, f = font) => {
      let s = size;
      while (s > 5.5 && f.widthOfTextAtSize(txt, s) > maxW) s -= 0.3;
      if (f.widthOfTextAtSize(txt, s) > maxW) {
        while (txt.length > 1 && f.widthOfTextAtSize(txt + '…', s) > maxW) txt = txt.slice(0, -1);
        txt += '…';
      }
      return { txt, s };
    };
    const text = (pos, value, size = FS, f = font) => {
      const v = clean(value).trim();
      if (!pos || !v) return;
      const r = fit(v, size, (pos.max || 575) - pos.x, f);
      page.drawText(r.txt, { x: pos.x, y: H - pos.top - 7.0, size: r.s, font: f, color: INK });
    };
    const centered = (x0, x1, top, value, size = FS) => {
      const v = clean(value).trim();
      if (!v) return;
      const r = fit(v, size, x1 - x0 - 2);
      const w = font.widthOfTextAtSize(r.txt, r.s);
      page.drawText(r.txt, { x: (x0 + x1) / 2 - w / 2, y: H - top - 6.0, size: r.s, font, color: INK });
    };
    const cross = (box, on) => {
      if (!box || !on) return;
      const x0 = box.x0 + 0.1, x1 = box.x0 + 4.7, t = H - box.top - 1.5, b = H - box.top - 6.1;
      page.drawLine({ start: { x: x0, y: t }, end: { x: x1, y: b }, thickness: 1.1, color: INK });
      page.drawLine({ start: { x: x0, y: b }, end: { x: x1, y: t }, thickness: 1.1, color: INK });
    };
    const date = (D_, iso) => {
      const p = splitDate(iso);
      if (!D_ || !p) return;
      p.forEach((v, i) => centered(D_.segs[i][0], D_.segs[i][1], D_.top - 1.2, v));
    };
    const area = (A, value) => {
      const v = clean(value).trim();
      if (!A || !v) return true;
      const size = 7.6;
      const out = [];
      v.split(/\n/).forEach((para) => {
        let line = '';
        para.split(/\s+/).forEach((w) => {
          const idx = out.length;
          const maxW = A.max - (idx === 0 && A.firstX ? A.firstX : (A.nextX || A.x));
          const test = line ? line + ' ' + w : w;
          if (font.widthOfTextAtSize(test, size) > maxW && line) { out.push(line); line = w; } else line = test;
        });
        out.push(line);
      });
      const fits = out.length <= A.lines;
      const lines = out.slice(0, A.lines);
      if (!fits) lines[A.lines - 1] = lines[A.lines - 1].replace(/\s*\S*$/, '') + ' (vervolg zie bijlage)';
      lines.forEach((l, i) => {
        const x = i === 0 && A.firstX ? A.firstX : (i > 0 && A.nextX ? A.nextX : A.x);
        page.drawText(l, { x, y: H - A.top - 7.2 - i * A.lh, size, font, color: INK });
      });
      return fits;
    };
    const image = async (box, dataUrl) => {
      if (!box || !dataUrl) return;
      const bytes = typeof dataUrl === 'string' ? b64ToBytes(dataUrl.split(',')[1]) : dataUrl;
      const img = /^data:image\/jpe?g/.test(dataUrl) ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);
      const sc = Math.min(box.w / img.width, box.h / img.height);
      const w = img.width * sc, h = img.height * sc;
      page.drawImage(img, { x: box.x + (box.w - w) / 2, y: H - box.top - box.h + (box.h - h) / 2, width: w, height: h });
    };

    const d = data;
    const f = d.firma || {}, t = d.tech || {}, k = d.klant || {}, km = d.kenmerken || {};
    // kop
    text(M.volgnummer, d.volgnummer, 9, bold);
    if (kind === 'rein') cross(M.soortOnderhoud, true);
    else { cross(M.onderhoud, d.soort !== 'keuring'); cross(M.keuring, d.soort === 'keuring'); }
    // firma
    Object.keys(M.firma).forEach((key) => text(M.firma[key], f[key]));
    // technicus
    text(M.tech.naam, t.naam);
    if (kind === 'rein') { cross(M.tech.erkend, t.rol !== 'schoorsteenveger'); cross(M.tech.schoorsteenveger, t.rol === 'schoorsteenveger'); }
    const nr = (v, p) => clean(v).trim().replace(new RegExp('^' + p + '\\s*[-:]?\\s*', 'i'), '');
    centered(M.tech.gv.x - 2, M.tech.gv.max, M.tech.gv.top - 1.2, nr(t.gv, 'GV'));
    centered(M.tech.tv.x - 2, M.tech.tv.max, M.tech.tv.top - 1.2, nr(t.tv, 'TV'));
    date(M.datum, d.datum);
    centered(M.van.x - 2, M.van.max, M.van.top - 1.2, d.van);
    centered(M.tot.x - 2, M.tot.max, M.tot.top - 1.2, d.tot);
    // klant
    Object.keys(M.klant).forEach((key) => text(M.klant[key], k[key]));
    const at = d.adresToestel || {};
    if (at.anders) [at.naam, at.straat, at.postcode].filter(Boolean).forEach((l, i) => text(M.adresToestel[i], l));
    // kenmerken
    const KM = M.kenmerken;
    ['centraal', 'typeB', 'typeC', 'gas', 'aardgas', 'lpg', 'gasAndere', 'nietPremix', 'premix', 'ventilator', 'vloeibaar', 'vast', 'pellets', 'blokken', 'vastAndere']
      .forEach((key) => cross(KM[key], km[key]));
    if (km.typeB) centered(KM.typeBcode.x - 1, KM.typeBcode.max, KM.typeBcode.top - 1.4, km.typeBcode, 7.5);
    if (km.typeC) centered(KM.typeCcode.x - 1, KM.typeCcode.max, KM.typeCcode.top - 1.4, km.typeCcode, 7.5);
    if (km.gasAndere) text(KM.gasAndereTxt, km.gasAndereTxt, 7.8);
    if (km.vastAndere) text(KM.vastAndereTxt, km.vastAndereTxt, 7.8);
    // toestel / brander
    Object.keys(M.toestel).forEach((key) => text(M.toestel[key], (d.toestel || {})[key]));
    Object.keys(M.brander).forEach((key) => text(M.brander[key], (d.brander || {})[key]));

    const warnings = [];
    if (kind === 'rein') {
      const r = d.reiniging || {};
      Object.keys(M.reiniging).forEach((key) => { if (key !== 'andereTxt') cross(M.reiniging[key], r[key]); });
      if (r.andere) text(M.reiniging.andereTxt, r.andereTxt, 7.8);
      if (!area(M.vrij.gebreken, d.gebreken)) warnings.push('gebreken');
      if (!area(M.vrij.maatregelen, d.maatregelen)) warnings.push('maatregelen');
      if (!area(M.vrij.opmerkingen, d.opmerkingen)) warnings.push('opmerkingen');
      date(M.volgendeToestel, d.volgendeToestel);
      date(M.volgendeKanaal, d.volgendeKanaal);
    } else {
      const v = d.verbranding || {};
      cross(M.laaglast, v.laaglast); cross(M.hooglast, v.hooglast);
      const meet = v.meet || {};
      Object.keys(M.rijen).forEach((row) => {
        const vals = meet[row] || {};
        ['p1', 'low', 'high'].forEach((c) => {
          if (vals[c] !== undefined && vals[c] !== '') centered(M.cols[c][0], M.cols[c][1], M.rijen[row] - 0.4, String(vals[c]).replace('.', ','));
        });
      });
      Object.keys(M.okNok).forEach((key) => {
        const val = (v.okNok || {})[key];
        cross(M.okNok[key][0], val === 'ok'); cross(M.okNok[key][1], val === 'nok');
      });
      Object.keys(M.checks).forEach((key) => {
        const val = (v.checks || {})[key];
        cross(M.checks[key][0], val === 'ok'); cross(M.checks[key][1], val === 'nok');
      });
      if (v.drukPa !== undefined && v.drukPa !== '') centered(M.drukPa.segs[0][0], M.drukPa.segs[0][1], M.drukPa.top, String(v.drukPa).replace('.', ','));
      cross(M.goed, v.werkt === 'goed'); cross(M.nietGoed, v.werkt === 'nietgoed');
      cross(M.veilig, v.veilig === 'veilig'); cross(M.nietVeilig, v.veilig === 'nietveilig');
      date(M.volgende, d.volgende);
      if (!area(M.vrij.gebreken, d.gebreken)) warnings.push('gebreken');
      if (!area(M.vrij.opmerkingen, d.opmerkingen)) warnings.push('opmerkingen');
    }
    // handtekeningen
    await image(M.sigTech, (d.handtekening || {}).tech);
    await image(M.sigKlant, (d.handtekening || {}).klant);

    // bijlagen: vervolg van lange teksten + afdruk(ken) meettoestel / foto's
    const longTxt = warnings.map((w) => ({ titel: w.charAt(0).toUpperCase() + w.slice(1), tekst: d[w] }));
    const bijlagen = d.bijlagen || [];
    if (longTxt.length || bijlagen.length) {
      const titel = (kind === 'rein' ? 'Reinigingsattest' : 'Verbrandingsattest') + ' ' + clean(d.volgnummer || '') + ' – bijlage';
      let pg = pdf.addPage([595.28, 841.89]);
      let y = 800;
      const head = () => {
        pg.drawText(clean(titel), { x: 40, y: 810, size: 11, font: bold, color: rgb(0, 0, 0) });
        pg.drawLine({ start: { x: 40, y: 804 }, end: { x: 555, y: 804 }, thickness: 0.6, color: rgb(0.4, 0.4, 0.4) });
        y = 785;
      };
      head();
      for (const lt of longTxt) {
        pg.drawText(clean(lt.titel) + ' (volledige tekst)', { x: 40, y, size: 9.5, font: bold }); y -= 14;
        const words = clean(lt.tekst).split(/\s+/); let line = '';
        const flush = () => { pg.drawText(line, { x: 40, y, size: 9, font, color: INK }); y -= 12; line = ''; };
        words.forEach((w) => { const tl = line ? line + ' ' + w : w; if (font.widthOfTextAtSize(tl, 9) > 515) { flush(); line = w; } else line = tl; });
        if (line) flush();
        y -= 10;
      }
      for (const b of bijlagen) {
        const bytes = b64ToBytes(b.data.split(',')[1]);
        const img = /^data:image\/jpe?g/.test(b.data) ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);
        const maxW = 515, maxH = 700;
        const sc = Math.min(maxW / img.width, maxH / img.height, 1.5);
        const w = img.width * sc, h = img.height * sc;
        if (y - h - 20 < 40) { pg = pdf.addPage([595.28, 841.89]); head(); }
        pg.drawText(clean(b.titel || 'Afdruk meettoestel'), { x: 40, y, size: 9.5, font: bold }); y -= 8;
        pg.drawImage(img, { x: 40, y: y - h, width: w, height: h });
        y -= h + 20;
      }
    }
    pdf.setTitle((kind === 'rein' ? 'Reinigingsattest ' : 'Verbrandingsattest ') + clean(d.volgnummer || ''));
    pdf.setProducer('VET Heat'); pdf.setCreator('VET Heat – Van Eyen Technics');
    return { bytes: await pdf.save(), warnings };
  }

  function b64ToBytes(b64) {
    if (typeof atob === 'function') { const s = atob(b64); const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
    return Uint8Array.from(Buffer.from(b64, 'base64'));
  }

  const api = { fillAttest, MAP };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.VETAttest = api;
})(typeof window !== 'undefined' ? window : globalThis);
