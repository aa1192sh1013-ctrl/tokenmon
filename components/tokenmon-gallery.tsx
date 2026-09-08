"use client";
import { useState } from "react";
import { COMMON_SPECIES_IDS, DINO_SPECIES_IDS, MYTHIC_SPECIES_IDS, type TokenmonLang } from "@/lib/tokenmon";
import { getSpeciesInfo } from "./tokenmon-species";
import { PetSprite } from "./tokenmon-sprite";
import { LanguageToggle } from "./language-toggle";

const IDS = [...COMMON_SPECIES_IDS, ...DINO_SPECIES_IDS, ...MYTHIC_SPECIES_IDS];
export function TokenmonGallery({ lang = "en" }: { lang?: TokenmonLang }) {
  const [selected, setSelected] = useState("wolf");
  const [query, setQuery] = useState("");
  const [previewLevel, setPreviewLevel] = useState(12);
  const ko = lang === "ko";
  const info = getSpeciesInfo(selected, lang);
  const visible = IDS.filter(id => `${id} ${getSpeciesInfo(id, "en").label} ${getSpeciesInfo(id, "ko").label}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="content-panel tokenmon-panel">
    <div className="panel-heading"><h2>{ko ? "동물봇 도감" : "AnimalBot Dex"}<span className="tm-sub">60 {ko ? "종 · 알부터 최종 진화까지" : "species · egg to final form"}</span></h2><LanguageToggle lang={lang} /></div>
    <div className="tm-dex-controls">
      <label>{ko ? "캐릭터 찾기" : "Find a companion"}<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={ko ? "늑대, 고양이, dragon…" : "Wolf, cat, dragon…"} /></label>
      <label>{ko ? "목록 미리보기 단계" : "Preview level"}<select value={previewLevel} onChange={e => setPreviewLevel(Number(e.target.value))}>{Array.from({ length: 21 }, (_, level) => <option key={level} value={level}>{level === 0 ? (ko ? "알 · Lv.0" : "Egg · Lv.0") : `Lv.${level}`}</option>)}</select></label>
    </div>
    <div className="tm-species-picker" aria-label={ko ? "종 선택" : "Choose species"}>
      {visible.map(id => <button key={id} className={`tm-species-button ${id === selected ? "selected" : ""}`} aria-pressed={id === selected} onClick={() => setSelected(id)}>
        <PetSprite species={id} color="silver" level={previewLevel} size={90} label={getSpeciesInfo(id, lang).label} lang={lang} />
        <span>{getSpeciesInfo(id, lang).label}</span>{getSpeciesInfo(id, lang).rare && <small>RARE</small>}
      </button>)}
    </div>
    {!visible.length && <p>{ko ? "검색 결과가 없습니다." : "No matches."}</p>}
    <div className="tm-evolution-heading"><h3>{info.label} · {ko ? "전체 진화" : "All evolutions"}</h3><p>{ko ? "Lv.0은 알 미리보기입니다. 실제 성장은 Lv.1부터 시작합니다." : "Lv.0 previews the egg. Project companions start at Lv.1."}</p></div>
    <div className="tm-evolution-grid">
      {Array.from({ length: 21 }, (_, level) => <figure key={`${selected}-${level}`}>
        <PetSprite species={selected} color="silver" level={level} size={220} label={`${info.label} Lv.${level}`} lang={lang} />
        <figcaption>{level === 0 ? (ko ? "알 · Lv.0" : "Egg · Lv.0") : `Lv.${level}`}{level === 20 ? " ✦ MAX" : ""}</figcaption>
      </figure>)}
    </div>
  </section>;
}
