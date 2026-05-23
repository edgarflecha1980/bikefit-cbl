import { useState, useEffect, useRef } from "react";

// ── Fonts ─────────────────────────────────────────────────────────
if (!document.getElementById('bf-fonts')) {
  const l = document.createElement('link');
  l.id = 'bf-fonts'; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap';
  document.head.appendChild(l);
}

// ── Global styles ─────────────────────────────────────────────────
if (!document.getElementById('bf-css')) {
  const s = document.createElement('style');
  s.id = 'bf-css';
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0}
    .bf{font-family:'DM Sans',sans-serif}
    .bf input,.bf select,.bf textarea{
      background:#223026;border:1px solid rgba(255,255,255,0.1);
      border-radius:10px;color:#f0f5f0;font-family:'DM Sans',sans-serif;
      font-size:13.5px;padding:9px 12px;outline:none;width:100%;
      transition:border-color 0.15s,box-shadow 0.15s;
    }
    .bf input:focus,.bf select:focus,.bf textarea:focus{
      border-color:#f07860;box-shadow:0 0 0 3px rgba(240,120,96,0.15);
    }
    .bf select{cursor:pointer;-webkit-appearance:none;appearance:none;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='rgba(240,245,240,0.4)' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
      background-repeat:no-repeat;background-position:right 10px center;padding-right:28px;
    }
    .bf select option{background:#1b2a1e;color:#f0f5f0}
    .bf input::placeholder,.bf textarea::placeholder{color:rgba(240,245,240,0.25);font-style:italic}
    .bf textarea{resize:vertical;line-height:1.65}
    .bf input[type=number]{font-family:'DM Sans',monospace}
    .bf input[type=checkbox]{width:auto;accent-color:#f07860;cursor:pointer}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
    @media print{
      .np{display:none!important}
      .bf{background:white!important;color:#111!important}
      .bf-card{background:white!important;border-color:#ddd!important}
      .bf input,.bf select,.bf textarea{background:white!important;border-color:#ddd!important;color:#111!important}
      .print-break{page-break-before:always;margin-top:0}
    }
  `;
  document.head.appendChild(s);
}

// ── Colors ────────────────────────────────────────────────────────
const C = {
  bg:     '#111a13',
  card:   '#1a2b1d',
  input:  '#223026',
  border: 'rgba(255,255,255,0.08)',
  coral:  '#f07860',
  coralB: 'rgba(240,120,96,0.18)',
  text:   '#f0f5f0',
  sec:    'rgba(240,245,240,0.55)',
  dim:    'rgba(240,245,240,0.28)',
  blue:   '#5b9bd5',
  green:  '#5ac57a',
  red:    '#f07070',
};

// ── Storage adapter (works in Claude + standalone/Vercel) ─────────
const store = {
  get: async key => {
    try {
      if (window.storage?.get) return window.storage.get(key);
    } catch(e) {}
    const v = localStorage.getItem(key);
    return v ? {value:v} : null;
  },
  set: async (key,val) => {
    try {
      if (window.storage?.set) return window.storage.set(key,val);
    } catch(e) {}
    localStorage.setItem(key,val);
  }
};

// ── State ─────────────────────────────────────────────────────────
const qual = [
  {v:'reduzida',l:'Reduzida'},
  {v:'media',l:'Média amplitude'},
  {v:'boa',l:'Boa'},
  {v:'excelente',l:'Excelente'},
];
const arch = [
  {v:'plano',l:'Plano'},{v:'neutro',l:'Neutro'},
  {v:'cavo_medio',l:'Cavo médio'},{v:'cavo',l:'Cavo'},
];

const INIT = {
  name:'',age:'',weight:'',height:'',context:[],level:'',anamnesis:'',
  interASIS:'',ischialW:'',altura:'',entrepernas:'',comprBraco:'',pelvisTilt:'',
  flexaoLomboPelvica:'',extensaoCoxo:'',flexaoCoxo:'',lordosis:'',
  thoracic:'',shoulder:'',posturalNotes:'',mobilityNotes:'',bioConclusions:'',
  fLenR:'',fLenL:'',fWidR:'',fWidL:'',archR:'',archL:'',
  pronTypeR:'',pronTypeL:'',pronDegR:'',pronDegL:'',
  shoeBrand:'',shoeModel:'',shoeSize:'',cleatR:'',cleatL:'',
  insoleBrand:'',insoleModel:'',footNotes:'',
  bkBrand:'',bkModel:'',bkSize:'',bkYear:'',bkMat:'',
  hbWidth:'',hbDrop:'',hbReach:'',hbType:'',stemLen:'',stemAngle:'',
  crankLen:'',qFactor:'',pedals:'',sadBrand:'',sadModel:'',
  sadHeight:'',sadSetback:'',sadToHb:'',sadToLevers:'',sadTilt:'',hbVsSad:'',
  bikeNotes:'',recommendations:'',summary:'',
};

// ── UI Components ─────────────────────────────────────────────────
function Lbl({children, accent}) {
  return (
    <div style={{fontSize:10.5,fontWeight:500,color:accent||C.sec,
      letterSpacing:'0.09em',textTransform:'uppercase',marginBottom:6}}>
      {children}
    </div>
  );
}

function Fld({label,k,d,set,type='text',unit,ph='',rows,opts}) {
  const u = v => set(p=>({...p,[k]:v}));
  return (
    <div style={{display:'flex',flexDirection:'column',minWidth:0}}>
      <Lbl>{label}</Lbl>
      {rows
        ? <textarea value={d[k]||''} onChange={e=>u(e.target.value)} placeholder={ph} rows={rows}/>
        : opts
        ? <select value={d[k]||''} onChange={e=>u(e.target.value)}>
            <option value="">—</option>
            {opts.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
          </select>
        : <div style={{display:'flex',alignItems:'center',gap:7}}>
            <input type={type} value={d[k]||''} onChange={e=>u(e.target.value)} placeholder={ph}/>
            {unit && <span style={{fontSize:11,color:C.dim,whiteSpace:'nowrap',flexShrink:0}}>{unit}</span>}
          </div>
      }
    </div>
  );
}

function BiFld({label,kR,kL,d,set,unit,type='number',opts}) {
  return (
    <div>
      <Lbl>{label}</Lbl>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        {[{k:kR,s:'D',c:C.coral},{k:kL,s:'E',c:C.blue}].map(({k,s,c})=>(
          <div key={k} style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:10,fontWeight:600,color:c,minWidth:12,flexShrink:0}}>{s}</span>
            {opts
              ? <select value={d[k]||''} onChange={e=>set(p=>({...p,[k]:e.target.value}))}>
                  <option value="">—</option>
                  {opts.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
                </select>
              : <input type={type} value={d[k]||''} onChange={e=>set(p=>({...p,[k]:e.target.value}))}/>
            }
            {unit && !opts && <span style={{fontSize:10,color:C.dim,flexShrink:0}}>{unit}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Sec({title,accent,children}) {
  return (
    <div style={{marginBottom:22}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
        <div style={{height:1.5,width:16,background:accent||C.coral,borderRadius:1,flexShrink:0}}/>
        <span style={{fontSize:10.5,fontWeight:500,color:C.sec,letterSpacing:'0.1em',textTransform:'uppercase'}}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function G({cols=2,gap=12,children}) {
  return (
    <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},minmax(0,1fr))`,gap,marginBottom:12}}>
      {children}
    </div>
  );
}

function Card({children,style={}}) {
  return (
    <div className="bf-card"
      style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,
        padding:'20px 22px',marginBottom:14,...style}}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{borderTop:`1px solid ${C.border}`,margin:'16px 0'}}/>;
}

// ── TABS ──────────────────────────────────────────────────────────

function TabCiclista({d,set}) {
  const ctxList = ['Estrada','Gravel','BTT','Triatlo','Indoor','Outro'];
  return (
    <>
      <Card>
        <Sec title="Identificação">
          <G cols={2}>
            <Fld label="Nome" k="name" d={d} set={set} ph="Nome completo"/>
            <Fld label="Idade" k="age" d={d} set={set} type="number" unit="anos"/>
          </G>
          <G cols={3}>
            <Fld label="Peso" k="weight" d={d} set={set} type="number" unit="kg"/>
            <Fld label="Altura" k="height" d={d} set={set} type="number" unit="cm"/>
            <Fld label="Nível" k="level" d={d} set={set} opts={[
              {v:'competicao',l:'Competição'},{v:'treino',l:'Treino'},{v:'lazer',l:'Lazer'}]}/>
          </G>
        </Sec>
        <Divider/>
        <Sec title="Modalidade">
          <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
            {ctxList.map(ctx=>(
              <label key={ctx} style={{display:'flex',alignItems:'center',gap:7,cursor:'pointer',
                fontSize:13.5,color:C.text,userSelect:'none'}}>
                <input type="checkbox" checked={(d.context||[]).includes(ctx)}
                  onChange={e=>set(p=>({...p,context:e.target.checked
                    ?[...(p.context||[]),ctx]:(p.context||[]).filter(c=>c!==ctx)}))}/>
                {ctx}
              </label>
            ))}
          </div>
        </Sec>
      </Card>
      <Card>
        <Sec title="Anamnese & Condição Atual" accent={C.blue}>
          <Fld label="Lesões, Patologias e Historial Relevante" k="anamnesis" d={d} set={set} rows={7}
            ph="Lesões atuais ou passadas, queixas, cirurgias, assimetrias, patologias, medicação, limitações funcionais..."/>
        </Sec>
      </Card>
    </>
  );
}

function TabBio({d,set}) {
  return (
    <>
      <Card>
        <Sec title="Antropometria">
          <G cols={2}>
            <Fld label="Dist. Inter-ASIS" k="interASIS" d={d} set={set} type="number" unit="mm"/>
            <Fld label="Larg. Tuberosidades Isquiais" k="ischialW" d={d} set={set} type="number" unit="mm"/>
          </G>
          <G cols={3}>
            <Fld label="Altura" k="altura" d={d} set={set} type="number" unit="cm"/>
            <Fld label="Comprimento Entrepernas" k="entrepernas" d={d} set={set} type="number" unit="cm"/>
            <Fld label="Comprimento Braço" k="comprBraco" d={d} set={set} type="number" unit="cm"/>
          </G>
          <G cols={2}>
            <Fld label="Inclinação Pélvica" k="pelvisTilt" d={d} set={set} opts={[
              {v:'neutro',l:'Neutro'},
              {v:'hiperlordose',l:'Hiperlordose'},
              {v:'lordose_reduzida',l:'Lordose reduzida'},
              {v:'cifose_lombar',l:'Cifose lombar'},
            ]}/>
          </G>
        </Sec>
        <Divider/>
        <Sec title="Mobilidade & Flexibilidade" accent={C.blue}>
          <G cols={2}>
            <Fld label="Flexão Lombo-Pélvica" k="flexaoLomboPelvica" d={d} set={set} opts={qual}/>
            <Fld label="Extensão Coxo-Femoral" k="extensaoCoxo" d={d} set={set} opts={qual}/>
          </G>
          <G cols={2}>
            <Fld label="Flexão Coxo-Femoral" k="flexaoCoxo" d={d} set={set} opts={qual}/>
            <Fld label="Lordose" k="lordosis" d={d} set={set} opts={[
              {v:'neutra',l:'Neutra'},{v:'reduzida',l:'Reduzida'},{v:'hiperlordose',l:'Hiperlordose'}]}/>
          </G>
          <G cols={2}>
            <Fld label="Mobilidade Torácica" k="thoracic" d={d} set={set} opts={qual}/>
            <Fld label="Mobilidade Ombro" k="shoulder" d={d} set={set} opts={qual}/>
          </G>
          <Fld label="Notas de Mobilidade" k="mobilityNotes" d={d} set={set} rows={3}
            ph="Limitações, assimetrias, compensações observadas, testes realizados..."/>
        </Sec>
      </Card>
      <Card>
        <Sec title="Avaliação Postural & Conclusões" accent="#a78bfa">
          <Fld label="Avaliação Postural" k="posturalNotes" d={d} set={set} rows={4}
            ph="Postura estática e dinâmica, desvios, rotações, compensações, cifose/lordose..."/>
          <div style={{marginTop:12}}>
            <Fld label="Conclusões Biomecânicas" k="bioConclusions" d={d} set={set} rows={4}
              ph="Síntese da avaliação funcional, implicações para o fit, prioridades de intervenção..."/>
          </div>
        </Sec>
      </Card>
    </>
  );
}

function TabPodal({d,set}) {
  const sides = [
    {typeK:'pronTypeR',degK:'pronDegR',s:'D',c:C.coral},
    {typeK:'pronTypeL',degK:'pronDegL',s:'E',c:C.blue},
  ];
  return (
    <>
      <Card>
        <Sec title="Morfologia do Pé">
          <G cols={2}>
            <BiFld label="Comprimento" kR="fLenR" kL="fLenL" d={d} set={set} unit="mm"/>
            <BiFld label="Largura (1ª – 5ª MTT)" kR="fWidR" kL="fWidL" d={d} set={set} unit="mm"/>
          </G>
          <G cols={2}>
            <BiFld label="Tipo de Arco" kR="archR" kL="archL" d={d} set={set} opts={arch}/>
            <div>
              <Lbl>Pronação / Supinação</Lbl>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {sides.map(({typeK,degK,s,c})=>(
                  <div key={s}>
                    <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:5}}>
                      <span style={{fontSize:10,fontWeight:600,color:c,minWidth:12}}>{s}</span>
                      <select value={d[typeK]||''} onChange={e=>set(p=>({...p,[typeK]:e.target.value}))}>
                        <option value="">—</option>
                        <option value="neutro">Neutro</option>
                        <option value="pronacao">Pronação</option>
                        <option value="supinacao">Supinação</option>
                      </select>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:5,paddingLeft:17}}>
                      <input type="number" min="0" max="20" step="0.5"
                        value={d[degK]||''} onChange={e=>set(p=>({...p,[degK]:e.target.value}))}
                        placeholder="0–20"/>
                      <span style={{fontSize:10,color:C.dim,flexShrink:0}}>°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </G>
        </Sec>
        <Divider/>
        <Sec title="Calçado & Equipamento" accent={C.blue}>
          <G cols={3}>
            <Fld label="Marca Sapatilha" k="shoeBrand" d={d} set={set}/>
            <Fld label="Modelo" k="shoeModel" d={d} set={set}/>
            <Fld label="Tamanho" k="shoeSize" d={d} set={set}/>
          </G>
          <G cols={2}>
            <BiFld label="Posição Tacos (eixo → 1ª MTT)" kR="cleatR" kL="cleatL" d={d} set={set} unit="mm"/>
            <G cols={1} gap={8}>
              <Fld label="Marca Palmilha" k="insoleBrand" d={d} set={set}/>
              <Fld label="Modelo Palmilha" k="insoleModel" d={d} set={set}/>
            </G>
          </G>
        </Sec>
      </Card>
      <Card>
        <Sec title="Observações & Conclusões Podais" accent="#a78bfa">
          <Fld label="Notas" k="footNotes" d={d} set={set} rows={7}
            ph="Craig's Test, Jack/Windlass Test, equinismo funcional, rigidez, padrão de carga, cunhas/wedges, intervenções, correiro, drop ideal..."/>
        </Sec>
      </Card>
    </>
  );
}

function TabBicicleta({d,set,bfImg,setBfImg}) {
  const bfRef = useRef();
  return (
    <>
      <Card>
        <Sec title="Identificação da Bicicleta">
          <G cols={3}>
            <Fld label="Marca" k="bkBrand" d={d} set={set}/>
            <Fld label="Modelo" k="bkModel" d={d} set={set}/>
            <Fld label="Tamanho" k="bkSize" d={d} set={set}/>
          </G>
          <G cols={2}>
            <Fld label="Ano" k="bkYear" d={d} set={set} type="number"/>
            <Fld label="Material" k="bkMat" d={d} set={set} opts={[
              {v:'carbono',l:'Carbono'},{v:'aluminio',l:'Alumínio'},
              {v:'titanio',l:'Titânio'},{v:'aco',l:'Aço'},{v:'outro',l:'Outro'}]}/>
          </G>
        </Sec>
        <Divider/>
        <Sec title="Componentes" accent={C.blue}>
          <G cols={2}>
            <Fld label="Selim — Marca" k="sadBrand" d={d} set={set}/>
            <Fld label="Selim — Modelo" k="sadModel" d={d} set={set}/>
          </G>
          <G cols={3}>
            <Fld label="Guiador — Largura" k="hbWidth" d={d} set={set} type="number" unit="mm"/>
            <Fld label="Guiador — Drop" k="hbDrop" d={d} set={set} type="number" unit="mm"/>
            <Fld label="Guiador — Reach" k="hbReach" d={d} set={set} type="number" unit="mm"/>
          </G>
          <G cols={2}>
            <Fld label="Tipo de Guiador" k="hbType" d={d} set={set} opts={[
              {v:'compacto',l:'Compacto'},{v:'anatomico',l:'Anatómico'},
              {v:'classico',l:'Clássico'},{v:'flare',l:'Flare'},{v:'aero',l:'Aero'},{v:'outro',l:'Outro'}]}/>
            <G cols={2} gap={8}>
              <Fld label="Avanço — Comp." k="stemLen" d={d} set={set} type="number" unit="mm"/>
              <Fld label="Avanço — Ângulo" k="stemAngle" d={d} set={set} type="number" unit="°"/>
            </G>
          </G>
          <G cols={3}>
            <Fld label="Comprimento Manivelas" k="crankLen" d={d} set={set} type="number" unit="mm"/>
            <Fld label="Q-Factor / Stance Total" k="qFactor" d={d} set={set} type="number" unit="mm"/>
            <Fld label="Pedais" k="pedals" d={d} set={set} ph="Marca e modelo"/>
          </G>
        </Sec>
      </Card>
      <Card>
        <Sec title="Setup Atual" accent={C.green}>
          <G cols={2}>
            <Fld label="Altura do Selim (BB → topo)" k="sadHeight" d={d} set={set} type="number" unit="mm"/>
            <Fld label="Recuo Selim (centro anatómico)" k="sadSetback" d={d} set={set} type="number" unit="mm"/>
          </G>
          <G cols={2}>
            <Fld label="Selim → Guiador (horizontal)" k="sadToHb" d={d} set={set} type="number" unit="mm"/>
            <Fld label="Selim → Manetes (reach)" k="sadToLevers" d={d} set={set} type="number" unit="mm"/>
          </G>
          <G cols={2}>
            <Fld label="Inclinação Selim" k="sadTilt" d={d} set={set} type="number" unit="°"/>
            <Fld label="Drop Guiador vs Selim" k="hbVsSad" d={d} set={set} type="number" unit="mm" ph="− abaixo / + acima"/>
          </G>
          <Fld label="Notas do Setup Atual" k="bikeNotes" d={d} set={set} rows={3}
            ph="Observações sobre posição atual, queixas relacionadas..."/>
        </Sec>
        <Divider/>
        <Sec title="Recomendações & Alterações" accent={C.coral}>
          <Fld label="Peças a substituir / Ajustes recomendados" k="recommendations" d={d} set={set} rows={5}
            ph="Alterações de selim, avanço, manivelas, tacos, palmilhas, ajustes de altura/recuo/reach, custo estimado..."/>
        </Sec>
      </Card>
      <Card>
        <Sec title="Análise Bikefitting.com" accent={C.blue}>
          <input ref={bfRef} type="file" accept="image/*" style={{display:'none'}}
            onChange={e=>{
              const f=e.target.files[0]; if(!f) return;
              const r=new FileReader();
              r.onload=ev=>setBfImg(ev.target.result);
              r.readAsDataURL(f); e.target.value='';
            }}/>
          {bfImg ? (
            <div style={{position:'relative'}}>
              <img src={bfImg} alt="Bikefitting.com"
                style={{width:'100%',borderRadius:10,border:`1px solid ${C.border}`}}/>
              <button onClick={()=>setBfImg(null)}
                style={{position:'absolute',top:8,right:8,background:'rgba(0,0,0,0.7)',
                  border:'none',borderRadius:6,color:'#fff',fontSize:15,
                  width:28,height:28,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
            </div>
          ) : (
            <div onClick={()=>bfRef.current.click()}
              style={{border:`1px dashed ${C.border}`,borderRadius:12,padding:'28px',
                textAlign:'center',cursor:'pointer',color:C.sec,fontSize:13.5,
                transition:'background 0.15s'}}
              onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
              onMouseOut={e=>e.currentTarget.style.background='transparent'}>
              Clique para carregar screenshot do bikefitting.com<br/>
              <span style={{fontSize:11.5,color:C.dim,marginTop:5,display:'block'}}>
                Incluída automaticamente no PDF e no Word
              </span>
            </div>
          )}
        </Sec>
      </Card>
    </>
  );
}

// ── Image helpers ─────────────────────────────────────────────────
function catOf(name) {
  const n=(name||'').toLowerCase();
  if(n.startsWith('mapa_antes')||n.startsWith('map_antes')) return 'mapa_antes';
  if(n.startsWith('mapa_final')||n.startsWith('mapa_depois')||n.startsWith('map_final')) return 'mapa_final';
  if(n.startsWith('antes')||n.startsWith('before')) return 'antes';
  if(n.startsWith('depois')||n.startsWith('final')||n.startsWith('after')) return 'final';
  return 'geral';
}
const CAT_LABEL = {
  antes:'Posição Inicial', final:'Posição Final / Ajustada',
  mapa_antes:'Mapeamento — Inicial', mapa_final:'Mapeamento — Final', geral:'Outras Imagens',
};
const CAT_ORDER = ['antes','final','mapa_antes','mapa_final','geral'];

function ImgGrid({imgs,bfImg}) {
  const g={};
  imgs.forEach(i=>{const c=catOf(i.name);if(!g[c])g[c]=[];g[c].push(i);});
  if(bfImg){if(!g.geral)g.geral=[];g.geral.unshift({src:bfImg,name:'Bikefitting.com'});}
  const cats=CAT_ORDER.filter(c=>g[c]);
  if(!cats.length) return null;
  return <>
    {cats.map(cat=>(
      <div key={cat} style={{marginBottom:20}}>
        <div style={{fontSize:12,fontWeight:500,color:C.sec,letterSpacing:'0.06em',textTransform:'uppercase',
          borderBottom:`1px solid ${C.border}`,paddingBottom:6,marginBottom:10}}>
          {CAT_LABEL[cat]}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
          {g[cat].map((img,i)=>(
            <div key={i}>
              <img src={img.src} alt={img.name}
                style={{width:'100%',borderRadius:10,border:`1px solid ${C.border}`}}/>
              <div style={{fontSize:10,color:C.dim,marginTop:3,textAlign:'center'}}>{img.name}</div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </>;
}

// ── Word export ───────────────────────────────────────────────────
function buildWordHtml(d,imgs,bfImg) {
  const r=(l,v)=>v?`<tr><td style="color:#777;font-size:9pt;width:42%;padding:3pt 6pt;border-bottom:0.5pt solid #eee;">${l}</td><td style="font-size:10pt;padding:3pt 6pt;border-bottom:0.5pt solid #eee;">${v}</td></tr>`:'';
  const sec=(t,c)=>`<h2 style="font-size:12pt;color:#d97706;border-bottom:1pt solid #d97706;padding-bottom:3pt;margin:14pt 0 8pt;">${t}</h2>${c}`;
  const tbl=rows=>`<table style="width:100%;border-collapse:collapse;">${rows}</table>`;
  const g={};
  imgs.forEach(i=>{const c=catOf(i.name);if(!g[c])g[c]=[];g[c].push(i);});
  if(bfImg){if(!g.geral)g.geral=[];g.geral.unshift({src:bfImg,name:'Bikefitting.com'});}
  const imgHtml=CAT_ORDER.filter(c=>g[c]).map(cat=>`
    <h3 style="font-size:10pt;color:#555;margin:10pt 0 5pt;">${CAT_LABEL[cat]}</h3>
    <div style="display:flex;flex-wrap:wrap;gap:8pt;">
    ${g[cat].map(img=>`<div style="width:48%;"><img src="${img.src}" style="width:100%;border:0.5pt solid #ddd;"/><p style="font-size:8pt;color:#999;text-align:center;">${img.name}</p></div>`).join('')}
    </div>`).join('');
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>body{font-family:Calibri,sans-serif;font-size:10.5pt;line-height:1.5;margin:2cm}h1{font-size:18pt;color:#1a2b1e}</style></head><body>
<h1>Relatório de Bike Fit</h1>
<p style="color:#777;font-size:10pt;margin-bottom:14pt;">Custom Bike Lab &nbsp;·&nbsp; ${new Date().toLocaleDateString('pt-PT')}</p>
${sec('Dados do Atleta',tbl([r('Nome',d.name),r('Idade',d.age?d.age+' anos':''),r('Peso',d.weight?d.weight+' kg':''),r('Altura',d.height?d.height+' cm':''),r('Modalidade',(d.context||[]).join(', ')),r('Nível',d.level)].join('')))}
${d.anamnesis?sec('Anamnese',`<p style="font-size:10pt;">${d.anamnesis}</p>`):''}
${sec('Avaliação Biomecânica',tbl([r('Dist. Inter-ASIS',d.interASIS?d.interASIS+' mm':''),r('Tuberosidades Isquiais',d.ischialW?d.ischialW+' mm':''),r('Comprimento Entrepernas',d.entrepernas?d.entrepernas+' cm':''),r('Comprimento Braço',d.comprBraco?d.comprBraco+' cm':''),r('Inclinação Pélvica',d.pelvisTilt),r('Flexão Lombo-Pélvica',d.flexaoLomboPelvica),r('Extensão Coxo-Femoral',d.extensaoCoxo),r('Flexão Coxo-Femoral',d.flexaoCoxo),r('Lordose',d.lordosis),r('Mobilidade Torácica',d.thoracic),r('Mobilidade Ombro',d.shoulder)].join('')))}
${d.bioConclusions?`<p style="font-size:10pt;margin-top:8pt;">${d.bioConclusions}</p>`:''}
${sec('Avaliação Podal',tbl([r('Comprimento D/E',d.fLenR&&d.fLenL?`${d.fLenR} / ${d.fLenL} mm`:''),r('Largura D/E',d.fWidR&&d.fWidL?`${d.fWidR} / ${d.fWidL} mm`:''),r('Arco D/E',d.archR&&d.archL?`${d.archR} / ${d.archL}`:''),r('Pronação/Sup. D',d.pronTypeR?`${d.pronTypeR}${d.pronDegR?' — '+d.pronDegR+'°':''}`:''),r('Pronação/Sup. E',d.pronTypeL?`${d.pronTypeL}${d.pronDegL?' — '+d.pronDegL+'°':''}`:''),r('Sapatilha',d.shoeBrand?`${d.shoeBrand} ${d.shoeModel} (${d.shoeSize})`:''),r('Tacos D/E',d.cleatR&&d.cleatL?`${d.cleatR} / ${d.cleatL} mm`:''),r('Palmilha',d.insoleBrand?`${d.insoleBrand} ${d.insoleModel}`:'')].join('')))}
${d.footNotes?`<p style="font-size:10pt;margin-top:8pt;">${d.footNotes}</p>`:''}
${sec('Bicicleta & Componentes',tbl([r('Bicicleta',d.bkBrand?`${d.bkBrand} ${d.bkModel} ${d.bkSize} (${d.bkYear||'—'})`:''),r('Material',d.bkMat),r('Selim',d.sadBrand?`${d.sadBrand} ${d.sadModel}`:''),r('Guiador',d.hbWidth?`${d.hbWidth}mm larg. · drop ${d.hbDrop||'—'}mm · reach ${d.hbReach||'—'}mm`:''),r('Tipo Guiador',d.hbType),r('Avanço',d.stemLen?`${d.stemLen}mm / ${d.stemAngle||'—'}°`:''),r('Manivelas',d.crankLen?d.crankLen+' mm':''),r('Q-Factor',d.qFactor?d.qFactor+' mm':''),r('Pedais',d.pedals)].join('')))}
${sec('Setup Atual',tbl([r('Altura Selim',d.sadHeight?d.sadHeight+' mm':''),r('Recuo Selim',d.sadSetback?d.sadSetback+' mm':''),r('Selim → Guiador',d.sadToHb?d.sadToHb+' mm':''),r('Selim → Manetes',d.sadToLevers?d.sadToLevers+' mm':''),r('Inclinação Selim',d.sadTilt?d.sadTilt+' °':''),r('Drop Guiador vs Selim',d.hbVsSad?d.hbVsSad+' mm':'')].join('')))}
${d.bikeNotes?`<p style="font-size:10pt;margin-top:8pt;">${d.bikeNotes}</p>`:''}
${d.recommendations?sec('Recomendações & Alterações',`<p style="font-size:10pt;">${d.recommendations}</p>`):''}
${d.summary?sec('Relatório / Conclusões',`<p style="font-size:10pt;line-height:1.7;">${d.summary.replace(/\n/g,'<br/>')}</p>`):''}
${bfImg?sec('Análise Bikefitting.com',`<img src="${bfImg}" style="max-width:100%;margin-top:6pt;"/>`):''}
${(imgs.length>0||bfImg)?sec('Imagens da Sessão',imgHtml):''}
</body></html>`;
}

// ── TAB: RELATÓRIO ────────────────────────────────────────────────
function TabRelatorio({d,set,bfImg,allData}) {
  const [gen,setGen] = useState(false);
  const [imgs,setImgs] = useState([]);
  const fileRef = useRef();

  const addImgs = e => {
    Array.from(e.target.files).forEach(f=>{
      const r=new FileReader();
      r.onload=ev=>setImgs(p=>[...p,{src:ev.target.result,name:f.name}]);
      r.readAsDataURL(f);
    });
    e.target.value='';
  };

  const generate = async () => {
    setGen(true);
    try {
      const prompt=`És um bike fitter nível 3 e profissional de reabilitação desportiva. Com base nos dados seguintes, escreve um relatório profissional completo em português europeu. Inclui: introdução ao atleta, avaliação biomecânica (com valores medidos), avaliação podal, análise do setup atual, recomendações detalhadas e conclusão. Prosa fluida, linguagem técnica mas acessível.\n\nDADOS:\n${JSON.stringify(allData,null,2)}`;
      '/api/generate'
        method:'POST',headers:{'Content-Type':'application/json','x-api-key':import.meta.env.VITE_ANTHROPIC_KEY,'anthropic-version':'2023-06-01'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1500,
          messages:[{role:'user',content:prompt}]})
      });
      const j=await res.json();
      const text=j.content?.map(b=>b.text||'').join('');
      if(text) set(p=>({...p,summary:text}));
    }catch(e){console.error(e);}
    setGen(false);
  };

  const exportWord = () => {
    const html = buildWordHtml(allData,imgs,bfImg);
    const blob = new Blob(['\ufeff',html],{type:'application/msword'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url;
    a.download=`Bikefit_${allData.name||'atleta'}_${new Date().toLocaleDateString('pt-PT').replace(/\//g,'-')}.doc`;
    a.click(); URL.revokeObjectURL(url);
  };

  const Btn = ({children,onClick,accent,disabled,outline}) => (
    <button onClick={onClick} disabled={disabled}
      style={{background:outline?'transparent':disabled?'rgba(255,255,255,0.08)':accent||C.coral,
        border:outline?`1px solid ${C.border}`:'none',borderRadius:10,
        color:disabled?C.sec:outline?C.sec:'#fff',fontSize:13,fontWeight:500,
        padding:'11px 18px',cursor:disabled?'wait':'pointer',
        opacity:disabled?0.6:1,transition:'all 0.2s',width:'100%'}}>
      {children}
    </button>
  );

  return (
    <>
      <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{height:1.5,width:16,background:C.coral,borderRadius:1}}/>
            <span style={{fontSize:10.5,fontWeight:500,color:C.sec,letterSpacing:'0.1em',textTransform:'uppercase'}}>
              Relatório Final
            </span>
          </div>
          <button onClick={generate} disabled={gen}
            style={{background:gen?'rgba(255,255,255,0.06)':C.coral,border:'none',borderRadius:10,
              color:gen?C.sec:'#fff',fontSize:12.5,fontWeight:500,padding:'8px 18px',
              cursor:gen?'wait':'pointer',opacity:gen?0.7:1,transition:'all 0.2s'}}>
            {gen?'⟳  A gerar...':'✦  Gerar com IA'}
          </button>
        </div>
        <textarea value={d.summary||''} onChange={e=>set(p=>({...p,summary:e.target.value}))} rows={16}
          placeholder="Relatório final da sessão — escreva manualmente ou gere automaticamente com IA.&#10;&#10;A geração IA produz análise biomecânica, podal, setup e recomendações em texto profissional."/>
      </Card>
      <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{height:1.5,width:16,background:C.blue,borderRadius:1}}/>
            <span style={{fontSize:10.5,fontWeight:500,color:C.sec,letterSpacing:'0.1em',textTransform:'uppercase'}}>
              Imagens da Sessão
            </span>
          </div>
          <button onClick={()=>fileRef.current.click()}
            style={{background:'rgba(255,255,255,0.07)',border:`1px solid ${C.border}`,borderRadius:10,
              color:C.sec,fontSize:12.5,fontWeight:500,padding:'7px 14px',cursor:'pointer'}}>
            + Adicionar
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={addImgs}/>
        {imgs.length===0 ? (
          <div onClick={()=>fileRef.current.click()}
            style={{border:`1px dashed ${C.border}`,borderRadius:12,padding:'32px',
              textAlign:'center',color:C.sec,fontSize:13,cursor:'pointer'}}>
            Clique para adicionar imagens
            <div style={{fontSize:11,color:C.dim,marginTop:6}}>
              antes_ · final_ · mapa_antes_ · mapa_final_ — agrupadas automaticamente
            </div>
          </div>
        ) : (
          <>
            <ImgGrid imgs={imgs} bfImg={null}/>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
              <button onClick={()=>fileRef.current.click()}
                style={{background:'rgba(255,255,255,0.07)',border:`1px solid ${C.border}`,
                  borderRadius:8,color:C.sec,fontSize:12,padding:'6px 14px',cursor:'pointer'}}>
                + Adicionar mais
              </button>
              <button onClick={()=>setImgs([])}
                style={{background:'none',border:'none',color:C.dim,fontSize:11,cursor:'pointer'}}>
                Limpar todas
              </button>
            </div>
          </>
        )}
      </Card>
      <div className="np" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
        <Btn onClick={()=>window.print()} outline>🖨 &nbsp;Imprimir / PDF</Btn>
        <Btn onClick={exportWord}>📄 &nbsp;Exportar Word (.doc)</Btn>
      </div>
      <div className="print-break">
        <ImgGrid imgs={imgs} bfImg={bfImg}/>
      </div>
    </>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────
const TABS = [
  {id:'ciclista',label:'Ciclista'},
  {id:'bio',label:'Biomecânica'},
  {id:'podal',label:'Podal'},
  {id:'bicicleta',label:'Bicicleta'},
  {id:'relatorio',label:'Relatório'},
];

export default function App() {
  const [tab,setTab] = useState(0);
  const [d,setD] = useState(INIT);
  const [bfImg,setBfImg] = useState(null);
  const [savedAt,setSavedAt] = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      try{ const r=await store.get('cbl_bfv3'); if(r?.value) setD(JSON.parse(r.value)); }
      catch(e){}
      setLoading(false);
    })();
  },[]);

  useEffect(()=>{
    if(loading) return;
    const t=setTimeout(async()=>{
      try{
        await store.set('cbl_bfv3',JSON.stringify(d));
        setSavedAt(new Date().toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}));
      }catch(e){}
    },900);
    return()=>clearTimeout(t);
  },[d,loading]);

  const content = [
    <TabCiclista d={d} set={setD}/>,
    <TabBio d={d} set={setD}/>,
    <TabPodal d={d} set={setD}/>,
    <TabBicicleta d={d} set={setD} bfImg={bfImg} setBfImg={setBfImg}/>,
    <TabRelatorio d={d} set={setD} bfImg={bfImg} allData={d}/>,
  ];

  if(loading) return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',
      justifyContent:'center',color:C.sec,fontFamily:'DM Sans,sans-serif'}}>
      A carregar sessão...
    </div>
  );

  return (
    <div className="bf" style={{minHeight:'100vh',background:C.bg,color:C.text}}>

      {/* Header */}
      <div className="np" style={{background:'rgba(26,43,29,0.95)',backdropFilter:'blur(8px)',
        borderBottom:`1px solid ${C.border}`,padding:'16px 28px',
        display:'flex',justifyContent:'space-between',alignItems:'center',
        position:'sticky',top:0,zIndex:100}}>
        <div>
          <span style={{fontSize:20,fontWeight:600,color:C.text,letterSpacing:'-0.02em'}}>
            Bike Fit
          </span>
          <span style={{fontSize:12,color:C.sec,marginLeft:10}}>Custom Bike Lab</span>
          {d.name && <span style={{fontSize:13,color:C.dim,marginLeft:8}}>— {d.name}</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          {savedAt && <span style={{fontSize:11,color:C.green,fontFamily:'monospace'}}>✓ {savedAt}</span>}
          <button onClick={()=>{if(confirm('Iniciar nova sessão?')){setD(INIT);setBfImg(null);setSavedAt(null);}}}
            style={{background:'rgba(255,255,255,0.07)',border:`1px solid ${C.border}`,borderRadius:10,
              color:C.sec,fontSize:12,padding:'6px 14px',cursor:'pointer'}}>
            Nova Sessão
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="np" style={{background:'rgba(26,43,29,0.7)',borderBottom:`1px solid ${C.border}`,
        display:'flex',overflowX:'auto',padding:'0 28px'}}>
        {TABS.map((t,i)=>(
          <button key={t.id} onClick={()=>setTab(i)}
            style={{background:'transparent',border:'none',
              borderBottom:i===tab?`2px solid ${C.coral}`:'2px solid transparent',
              color:i===tab?C.coral:C.sec,
              padding:'13px 20px',cursor:'pointer',fontSize:13,fontWeight:i===tab?500:400,
              whiteSpace:'nowrap',transition:'all 0.15s',marginBottom:'-1px'}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="np" style={{height:2,background:'rgba(255,255,255,0.06)'}}>
        <div style={{height:'100%',background:C.coral,transition:'width 0.3s',
          width:`${((tab+1)/TABS.length)*100}%`}}/>
      </div>

      {/* Content */}
      <div style={{padding:'24px 24px',maxWidth:860,margin:'0 auto'}}>
        {content[tab]}
        <div className="np" style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
          <button onClick={()=>setTab(p=>Math.max(0,p-1))} disabled={tab===0}
            style={{background:'transparent',border:`1px solid ${C.border}`,borderRadius:10,
              color:tab===0?C.dim:C.sec,fontSize:12.5,padding:'9px 20px',
              cursor:tab===0?'default':'pointer',opacity:tab===0?0.3:1}}>
            ← Anterior
          </button>
          <button onClick={()=>setTab(p=>Math.min(TABS.length-1,p+1))}
            disabled={tab===TABS.length-1}
            style={{background:tab===TABS.length-1?'transparent':C.coral,
              border:`1px solid ${tab===TABS.length-1?C.border:C.coral}`,borderRadius:10,
              color:tab===TABS.length-1?C.dim:'#fff',fontSize:12.5,fontWeight:500,
              padding:'9px 20px',cursor:tab===TABS.length-1?'default':'pointer',
              opacity:tab===TABS.length-1?0.3:1}}>
            Seguinte →
          </button>
        </div>
      </div>
    </div>
  );
}
