import React from 'react';

export const colorThemes=[
  {id:'meadow',name:'Meadow',icon:'🌿',colors:['#496a48','#e6edda','#f8f6ee']},
  {id:'ocean',name:'Ocean',icon:'🌊',colors:['#176b87','#cdebf2','#f3fbfc']},
  {id:'sunset',name:'Sunset',icon:'🌅',colors:['#a85156','#ffd9bf','#fff7ed']},
  {id:'rainbow',name:'Rainbow',icon:'🌈',colors:['#7257a5','#f1d7f5','#fff8fd']},
  {id:'space',name:'Space',icon:'🚀',colors:['#41518a','#dce0ff','#f5f5ff']},
];
export const validTheme=id=>colorThemes.some(theme=>theme.id===id)?id:'meadow';

export function ThemePicker({value,onChange,compact=false}){
  const selected=validTheme(value);
  return <section className={`theme-picker ${compact?'compact':''}`} aria-label="Choose your colors">
    <div><b>Pick your colors</b><small>Your choice is saved</small></div>
    <div className="theme-choices">{colorThemes.map(theme=><button key={theme.id} type="button" aria-label={`${theme.name} color theme`} aria-pressed={selected===theme.id} title={theme.name} onClick={()=>onChange(theme.id)} style={{'--swatch-one':theme.colors[0],'--swatch-two':theme.colors[1],'--swatch-three':theme.colors[2]}}><span>{theme.icon}</span><small>{theme.name}</small></button>)}</div>
  </section>;
}
