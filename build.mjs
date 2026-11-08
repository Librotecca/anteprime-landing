// Scarica le immagini Instagram referenziate nelle pagine e le serve in locale (/img/...)
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const OUT='out'; fs.mkdirSync(path.join(OUT,'img'),{recursive:true});
const re=/https:\/\/[^"'\s)]*(?:cdninstagram\.com|fbcdn\.net|images\.unsplash\.com)[^"'\s)]*/g;
const cache=new Map(); let ok=0, ko=0;
async function get(raw){
  if(cache.has(raw)) return cache.get(raw);
  const url=raw.replace(/&amp;/g,'&');
  const name=crypto.createHash('sha1').update(url.split('?')[0]).digest('hex').slice(0,16)+'.jpg';
  let res=null;
  for(let i=0;i<3&&!res;i++){
    try{const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0'},signal:AbortSignal.timeout(15000)});
      if(r.ok){fs.writeFileSync(path.join(OUT,'img',name),Buffer.from(await r.arrayBuffer()));res='/img/'+name;}}
    catch(e){}
  }
  res?ok++:ko++; cache.set(raw,res); return res;
}
const pages=fs.readdirSync(OUT).map(d=>path.join(OUT,d,'index.html')).filter(f=>fs.existsSync(f));
let done=0;
async function page(f){
  let h=fs.readFileSync(f,'utf8'); const urls=[...new Set(h.match(re)||[])];
  const links=await Promise.all(urls.map(get));
  urls.forEach((u,i)=>{ if(links[i]) h=h.split(u).join(links[i]); });
  fs.writeFileSync(f,h); console.log('pagina',++done,'/',pages.length,f);
}
for(let i=0;i<pages.length;i+=6) await Promise.all(pages.slice(i,i+6).map(page));
console.log('immagini scaricate',ok,'fallite',ko);
