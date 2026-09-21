// Paint Studio pure logic — testable bits shared with paint-studio.jsx.
// No JSX here so node:test can import this module directly.

export const colors=['#ef6b67','#f1bd46','#62a96b','#4e9dcc','#8067b8','#513f35','#f47ac2','#f28c38','#2b2b2b','#ffffff'];
export const colorNames={'#ef6b67':'red','#f1bd46':'yellow','#62a96b':'green','#4e9dcc':'blue','#8067b8':'purple','#513f35':'brown','#f47ac2':'pink','#f28c38':'orange','#2b2b2b':'black','#ffffff':'white'};

export const brushes=[
  {id:'classic',label:'Classic',emoji:'🖌️'},
  {id:'neon',label:'Neon glow',emoji:'✨'},
  {id:'rainbow',label:'Rainbow',emoji:'🌈'},
  {id:'spray',label:'Spray paint',emoji:'💨'},
];

export const stamps=['🐶','🐱','🦁','🐘','🦋','🐟','🚗','🚀','✈️','🚂','🍎','🍦','🍕','🌮'];
export const shapes=['●','■','▲','♥','★','⬟','🔷','🌙','☀'];

export const papers=[
  {id:'white',label:'White paper',fill:'#ffffff',ink:'#3a4a3f'},
  {id:'night',label:'Black night',fill:'#12121f',ink:'#ffffff'},
  {id:'sky',label:'Sky blue',fill:'#bfe6f7',ink:'#2c4a5e'},
];

export const PROMPTS=[
  'Draw a creature made of shapes. What is its name?',
  'Paint your silliest monster. Does it have three eyes?',
  'Make a rainbow sky over a tiny house. Who lives there?',
  'Stamp a parade of animals marching to a party!',
  'Draw what the moon dreams about at night.',
  'Paint your favorite snack as a superhero.',
  'Make a garden where the flowers can sing.',
  'Draw a rocket zooming past sleepy stars.',
  'Stamp a pizza party and invite all your friends!',
  'Paint a friendly dragon. What is it smiling about?',
];

// Keys are always the two hex colors sorted lexicographically.
export const mixMap={
  '#4e9dcc|#ef6b67':'purple',
  '#4e9dcc|#f1bd46':'green',
  '#ef6b67|#f1bd46':'orange',
  '#2b2b2b|#4e9dcc':'midnight blue',
  '#2b2b2b|#513f35':'dark brown',
  '#2b2b2b|#62a96b':'dark green',
  '#2b2b2b|#8067b8':'dark purple',
  '#2b2b2b|#ef6b67':'maroon',
  '#2b2b2b|#f1bd46':'dark yellow',
  '#2b2b2b|#f28c38':'dark orange',
  '#2b2b2b|#f47ac2':'deep pink',
  '#2b2b2b|#ffffff':'gray',
  '#4e9dcc|#62a96b':'teal',
  '#4e9dcc|#8067b8':'indigo',
  '#4e9dcc|#f28c38':'rust',
  '#4e9dcc|#f47ac2':'violet',
  '#4e9dcc|#ffffff':'light blue',
  '#513f35|#ef6b67':'dark red',
  '#513f35|#f1bd46':'golden brown',
  '#513f35|#ffffff':'tan',
  '#62a96b|#ef6b67':'brown',
  '#62a96b|#f1bd46':'lime',
  '#62a96b|#f28c38':'olive',
  '#62a96b|#ffffff':'light green',
  '#8067b8|#ef6b67':'magenta',
  '#8067b8|#ffffff':'light purple',
  '#ef6b67|#f28c38':'red-orange',
  '#ef6b67|#f47ac2':'hot pink',
  '#ef6b67|#ffffff':'pink',
  '#f1bd46|#f28c38':'golden yellow',
  '#f1bd46|#f47ac2':'peach',
  '#f1bd46|#ffffff':'light yellow',
  '#f28c38|#ffffff':'light orange',
  '#f47ac2|#ffffff':'baby pink',
};

export function mixResult(a,b){
  return mixMap[[a,b].sort().join('|')]||'a new color';
}

export function nextPrompt(i){
  return (((i%PROMPTS.length)+PROMPTS.length+1)%PROMPTS.length);
}
