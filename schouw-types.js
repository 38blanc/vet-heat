/* VET Heat – geheugensteun schouwaansluitingen (indeling volgens NBN CR / EN 1749)
 * Schematische tekeningen: blauw = verbrandingslucht, oranje = rookgassen. */
(function () {
  const AIR = '#2f7fd1', FLUE = '#e0662a', LINE = 'currentColor';
  const arrow = (id, c) => `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`;
  const defs = (k) => `<defs>${arrow('a' + k, AIR)}${arrow('f' + k, FLUE)}</defs>`;
  const A = (k, d) => `<path d="${d}" fill="none" stroke="${AIR}" stroke-width="2.4" marker-end="url(#a${k})"/>`;
  const Fl = (k, d) => `<path d="${d}" fill="none" stroke="${FLUE}" stroke-width="2.4" marker-end="url(#f${k})"/>`;
  const boiler = (x, y, fan) => `<rect x="${x}" y="${y}" width="34" height="46" rx="3" fill="none" stroke="${LINE}" stroke-width="1.6"/>` +
    `<path d="M${x + 9} ${y + 36} q4 -9 8 0 q4 -9 8 0" fill="none" stroke="${FLUE}" stroke-width="1.4"/>` +
    (fan === 'na' ? `<circle cx="${x + 17}" cy="${y + 10}" r="5" fill="none" stroke="${LINE}" stroke-width="1.2"/><path d="M${x + 13} ${y + 10}h8M${x + 17} ${y + 6}v8" stroke="${LINE}" stroke-width="1"/>` : '') +
    (fan === 'voor' ? `<circle cx="${x + 9}" cy="${y + 26}" r="5" fill="none" stroke="${LINE}" stroke-width="1.2"/><path d="M${x + 5} ${y + 26}h8M${x + 9} ${y + 22}v8" stroke="${LINE}" stroke-width="1"/>` : '');
  const house = (roof = true) => `<path d="M20 150 V60 ${roof ? 'L110 18 L200 60' : 'V40 H200 V60'} V150" fill="none" stroke="${LINE}" stroke-width="1.4" opacity=".55"/><path d="M10 150H210" stroke="${LINE}" stroke-width="1.4" opacity=".55"/>`;
  const lbl = (x, y, t, c = LINE, a = 'start') => `<text x="${x}" y="${y}" font-size="9" fill="${c}" text-anchor="${a}" font-family="system-ui,sans-serif">${t}</text>`;
  const svg = (k, body) => `<svg viewBox="0 0 220 160" width="100%" role="img" aria-label="schema ${k}" style="max-width:320px;display:block;margin:auto;color:inherit">${defs(k)}${body}</svg>`;

  const TYPES = [
    { code: 'B11BS', cat: 'B', naam: 'Open – trekonderbreker, natuurlijke trek, met terugstroombeveiliging (TTB)',
      uitleg: 'Lucht uit het stooklokaal, rookgassen via trekonderbreker naar de schouw. Geen ventilator. BS = thermische terugstroombeveiliging.',
      typisch: 'Oudere atmosferische ketels en geisers op een bestaande schouw.',
      tek: (k) => svg(k, house() + `<rect x="150" y="34" width="16" height="116" fill="none" stroke="${LINE}" stroke-width="1.2" opacity=".6"/>` + boiler(100, 95) +
        `<path d="M108 95 l9 -10 l9 10" fill="none" stroke="${LINE}" stroke-width="1.4"/>` + Fl(k, 'M117 85 V70 H158 V24') + A(k, 'M24 125 H92') + lbl(24, 118, 'lucht uit lokaal', AIR) + lbl(40, 82, 'trekonderbreker'))
    },
    { code: 'B22', cat: 'B', naam: 'Open – zonder trekonderbreker, ventilator ná de verbrandingskamer',
      uitleg: 'Lucht uit het stooklokaal, afzuigventilator duwt rookgassen naar buiten.',
      typisch: 'Open ketels/geisers met rookgasventilator.',
      tek: (k) => svg(k, house() + boiler(100, 95, 'na') + Fl(k, 'M117 95 V70 H158 V24') + A(k, 'M24 125 H92') + lbl(24, 118, 'lucht uit lokaal', AIR) + lbl(140, 108, 'ventilator ná'))
    },
    { code: 'B23', cat: 'B', naam: 'Open – zonder trekonderbreker, ventilator vóór de verbrandingskamer',
      uitleg: 'Lucht uit het stooklokaal, ventilator vóór de brander (premix). Rookgasafvoer in overdruk.',
      typisch: 'Condensatieketel in open opstelling (luchtaanvoer uit het lokaal).',
      tek: (k) => svg(k, house() + boiler(100, 95, 'voor') + Fl(k, 'M117 95 V70 H158 V24') + A(k, 'M24 140 H92') + lbl(24, 133, 'lucht uit lokaal', AIR) + lbl(140, 125, 'ventilator vóór'))
    },
    { code: 'B33', cat: 'B', naam: 'Open – zonder trekonderbreker, overdrukdeel omringd door verbrandingslucht',
      uitleg: 'Concentrische aansluiting: verbrandingslucht wordt uit het lokaal aangezogen rond de rookgasbuis, zodat de buis in overdruk omringd is door lucht. Ventilator vóór de brander.',
      typisch: 'Aansluiting op een (collectieve) schouw in open opstelling.',
      tek: (k) => svg(k, house() + boiler(70, 95, 'voor') + `<rect x="80" y="40" width="14" height="55" fill="none" stroke="${AIR}" stroke-width="1.2"/>` + Fl(k, 'M87 95 V14') + A(k, 'M60 72 H78') + lbl(14, 68, 'lucht uit lokaal', AIR) + lbl(100, 60, 'concentrisch'))
    },
    { code: 'C13', cat: 'C', naam: 'Gesloten – horizontale gevelaansluiting (concentrisch of dicht bij elkaar)',
      uitleg: 'Lucht en rookgassen via de gevel, uitmondingen in dezelfde drukzone. Ventilator vóór de brander.',
      typisch: 'Wandketel met concentrische doorvoer door de buitenmuur.',
      tek: (k) => svg(k, house(false) + `<path d="M150 40V150" stroke="${LINE}" stroke-width="5" opacity=".35"/>` + boiler(95, 80, 'voor') +
        `<rect x="129" y="70" width="40" height="12" fill="none" stroke="${AIR}" stroke-width="1.2"/>` + Fl(k, 'M112 80 V76 H182') + A(k, 'M185 81 H134') + lbl(156, 100, 'gevel') + lbl(205, 66, 'rookgas', FLUE, 'end'))
    },
    { code: 'C33', cat: 'C', naam: 'Gesloten – verticale dakdoorvoer',
      uitleg: 'Lucht en rookgassen via een (concentrische) dakdoorvoer, uitmondingen in dezelfde drukzone. Ventilator vóór de brander.',
      typisch: 'Condensatieketel op zolder of met concentrische dakdoorvoer.',
      tek: (k) => svg(k, house() + boiler(93, 100, 'voor') + `<rect x="104" y="12" width="14" height="88" fill="none" stroke="${AIR}" stroke-width="1.2"/>` + Fl(k, 'M111 100 V6') + A(k, 'M121 14 V60') + lbl(124, 50, 'lucht', AIR) + lbl(90, 10, 'rookgas', FLUE, 'end'))
    },
    { code: 'C43', cat: 'C', naam: 'Gesloten – aangesloten op een collectief kanaal voor lucht en rookgas (CLV)',
      uitleg: 'Meerdere toestellen op een gemeenschappelijk systeem (CLV, 3CE, LAS) met aparte kanalen voor luchttoevoer en rookgasafvoer.',
      typisch: 'Appartementsgebouwen met CLV-schacht.',
      tek: (k) => svg(k, `<path d="M20 150V20H200V150M10 150H210M20 85H200" stroke="${LINE}" stroke-width="1.2" opacity=".5" fill="none"/>` +
        `<rect x="150" y="8" width="14" height="142" fill="none" stroke="${AIR}" stroke-width="1.2"/><rect x="166" y="8" width="14" height="142" fill="none" stroke="${FLUE}" stroke-width="1.2"/>` +
        boiler(80, 35, 'voor') + boiler(80, 100, 'voor') + A(k, 'M157 70 H116') + Fl(k, 'M97 35 V28 H173 V4') + A(k, 'M157 135 H116') + Fl(k, 'M97 100 V93 H173') + lbl(146, 160, 'lucht', AIR, 'end') + lbl(184, 160, 'rook', FLUE))
    },
    { code: 'C53', cat: 'C', naam: 'Gesloten – gescheiden lucht- en rookgasleiding in verschillende drukzones',
      uitleg: 'Aparte (twin) leidingen: lucht bv. via de gevel, rookgassen via het dak. Ventilator vóór de brander.',
      typisch: 'Twin-aansluiting (2 x enkelwandig), bv. lucht door gevel en afvoer langs dak.',
      tek: (k) => svg(k, house() + boiler(90, 100, 'voor') + Fl(k, 'M112 100 V4') + A(k, 'M205 112 H124') + lbl(200, 106, 'lucht via gevel', AIR, 'end') + lbl(108, 10, 'rookgas via dak', FLUE, 'end'))
    },
    { code: 'C63', cat: 'C', naam: 'Gesloten – toestel verkocht zonder lucht/rookgassysteem',
      uitleg: 'Het toestel is goedgekeurd om aangesloten te worden op een apart gecertificeerd (los verkocht) lucht- en rookgassysteem. Ventilator vóór de brander.',
      typisch: 'Ketel met een afvoersysteem van een andere fabrikant (CE-gemarkeerde componenten).',
      tek: (k) => svg(k, house() + boiler(93, 100, 'voor') + `<rect x="104" y="12" width="14" height="88" fill="none" stroke="${AIR}" stroke-width="1.2" stroke-dasharray="4 3"/>` + Fl(k, 'M111 100 V6') + A(k, 'M121 14 V60') + lbl(126, 80, 'apart', LINE) + lbl(126, 90, 'gecertificeerd', LINE))
    },
    { code: 'C83', cat: 'C', naam: 'Gesloten – afvoer in collectieve schouw, lucht individueel van buiten',
      uitleg: 'Rookgassen naar een gemeenschappelijk (onderdruk)kanaal, verbrandingslucht via een eigen leiding van buiten.',
      typisch: 'Renovatie van appartementsgebouwen met bestaande collectieve schouw.',
      tek: (k) => svg(k, `<path d="M20 150V20H200V150M10 150H210M20 85H200" stroke="${LINE}" stroke-width="1.2" opacity=".5" fill="none"/>` +
        `<rect x="160" y="8" width="16" height="142" fill="none" stroke="${FLUE}" stroke-width="1.2"/>` + boiler(80, 35, 'voor') + boiler(80, 100, 'voor') +
        Fl(k, 'M97 35 V28 H168 V4') + Fl(k, 'M97 100 V93 H168') + A(k, 'M22 60 H78') + A(k, 'M22 125 H78') + lbl(24, 54, 'lucht van gevel', AIR))
    },
    { code: 'C93', cat: 'C', naam: 'Gesloten – rookgasbuis in bestaande schacht, lucht via de schacht',
      uitleg: 'Rookgasbuis in een bestaande schouw/schacht; de verbrandingslucht komt via de ruimte rond de buis (vroeger C3*S).',
      typisch: 'Renovatie: condensatieketel met flexibele buis in de oude schouw.',
      tek: (k) => svg(k, house() + `<rect x="120" y="18" width="26" height="132" fill="none" stroke="${LINE}" stroke-width="1.4" opacity=".7"/>` + boiler(70, 100, 'voor') +
        Fl(k, 'M87 100 V92 H133 V6') + A(k, 'M125 26 V118 H108') + A(k, 'M141 26 V60') + lbl(150, 60, 'lucht', AIR) + lbl(150, 70, 'rond buis', AIR) + lbl(127, 10, 'rookgas', FLUE, 'end'))
    }
  ];

  const css = `.sch-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:50;display:flex;justify-content:center;align-items:flex-start;overflow:auto;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}
.sch-in{background:var(--bg);max-width:760px;width:100%;min-height:100%;padding:14px}
.sch-c{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:12px;margin-bottom:10px}
.sch-c h3{margin:0 0 4px;font-size:17px}.sch-c p{margin:6px 0;font-size:14px}
.sch-leg{display:flex;gap:14px;font-size:13px;margin:4px 0 10px}.sch-leg i{display:inline-block;width:18px;height:3px;vertical-align:middle;margin-right:5px}`;

  function show(cat, onPick) {
    if (!document.getElementById('sch-css')) { const s = document.createElement('style'); s.id = 'sch-css'; s.textContent = css; document.head.appendChild(s); }
    const ov = document.createElement('div'); ov.className = 'sch-ov';
    const list = TYPES.filter((t) => !cat || t.cat === cat);
    ov.innerHTML = `<div class="sch-in"><div class="top"><h1 style="font-size:22px">Schouwaansluitingen${cat ? ' – type ' + cat : ''}</h1><button class="b2" data-x>Sluiten</button></div>
<p class="mu" style="margin-top:0">Indeling volgens NBN CR 1749 (EN 1749). Laatste cijfer: 1 = geen ventilator, 2 = ventilator ná de verbrandingskamer, 3 = ventilator vóór de verbrandingskamer. Controleer altijd het typeplaatje en de installatiehandleiding.</p>
<div class="sch-leg"><span><i style="background:${AIR}"></i>verbrandingslucht</span><span><i style="background:${FLUE}"></i>rookgassen</span></div>
${cat ? `<button class="b2" style="margin-bottom:10px" data-all>Toon ook type ${cat === 'B' ? 'C' : 'B'}</button>` : ''}
${list.map((t, i) => `<div class="sch-c"><div class="top"><h3>${t.code}</h3>${onPick ? `<button data-pick="${t.code}" style="padding:7px 12px">Kies ${t.code}</button>` : ''}</div><div class="mu" style="font-weight:600">${t.naam}</div>${t.tek(i + cat)}<p>${t.uitleg}</p><p class="mu">Typisch: ${t.typisch}</p></div>`).join('')}
<button class="b2" style="width:100%" data-x>Sluiten</button></div>`;
    const close = () => { ov.remove(); document.body.style.overflow = ''; };
    ov.addEventListener('click', (e) => {
      if (e.target === ov || e.target.closest('[data-x]')) close();
      const p = e.target.closest('[data-pick]'); if (p) { close(); onPick && onPick(p.dataset.pick); }
      if (e.target.closest('[data-all]')) { close(); show('', onPick); }
    });
    document.body.style.overflow = 'hidden'; document.body.appendChild(ov);
  }
  window.SCHOUW = { TYPES, show, codes: (cat) => TYPES.filter((t) => t.cat === cat).map((t) => t.code) };
})();
