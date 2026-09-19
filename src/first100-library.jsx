import React, { useEffect, useMemo, useRef, useState } from 'react'
import { first100Shelves } from './first100-data.js'
import { speakNeural } from './speech.js'

const EMPTY_PROGRESS = { seen: [], correct: {}, missed: {}, attempts: [], updatedAt: 0 }

function cleanProgress(value) {
  return {
    seen: Array.isArray(value?.seen) ? value.seen : [],
    correct: value?.correct && typeof value.correct === 'object' ? value.correct : {},
    missed: value?.missed && typeof value.missed === 'object' ? value.missed : {},
    attempts: Array.isArray(value?.attempts) ? value.attempts : [],
    updatedAt: Number(value?.updatedAt) || 0,
  }
}

function wordLabel(word) {
  return word?.word || word?.label || word?.name || 'Picture'
}

function wordSlug(word) {
  return word?.slug || wordLabel(word).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function wordKey(shelf, word) {
  return `${shelf.id}:${wordSlug(word)}`
}

function shuffle(items) {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function Photo({ shelf, word, className = '', onLoad }) {
  const [failed, setFailed] = useState(false)
  const label = wordLabel(word)
  const provided = word?.image || word?.photo
  const src = provided || `/first100/${shelf.id}/${wordSlug(word)}.jpg`
  const number = shelf.id === 'concepts' && /^\d+$/.test(label) ? Number(label) : 0

  useEffect(() => setFailed(false), [src])

  if (number) {
    const colors = ['#ff7864','#f3b842','#65bce8','#6fc27c','#9c7ddd']
    return <div className={`f100-photo ${className}`} role="img" aria-label={`Number ${number}`} style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'clamp(18px,4vw,34px)',background:`linear-gradient(145deg,${colors[(number-1)%colors.length]},#fff2a8)`}}><strong style={{fontSize:'clamp(8rem,28vw,18rem)',lineHeight:.7,color:'#fff',textShadow:'0 8px 0 #294b4233'}}>{number}</strong><span aria-hidden="true" style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:8,maxWidth:420}}>{Array.from({length:number},(_,index)=><i key={index} style={{width:18,height:18,borderRadius:'50%',background:'#fff',boxShadow:'0 2px 0 #294b4233'}}/>)}</span></div>
  }

  if (failed) {
    return (
      <div className={`f100-photo f100-photo-missing ${className}`} role="img" aria-label={label}>
        <span aria-hidden="true">{word?.emoji || '🖼️'}</span>
        <small>Picture coming soon</small>
      </div>
    )
  }

  return <img className={`f100-photo ${className}`} src={src} alt={label} draggable="false" onLoad={onLoad} onError={() => setFailed(true)} />
}

function playClip(slug) {
  const audio = new Audio(`/first100-audio/${slug}.m4a`)
  audio.play().catch(() => {})
}

function Speaker({ word, large = false, autoPlay = false }) {
  const [playing, setPlaying] = useState(false)
  const [liveVoice, setLiveVoice] = useState(false)
  const audioRef = useRef(null)
  const src = word?.audio || `/first100-audio/${wordSlug(word)}.m4a`
  const label = wordLabel(word)

  function speakLive() {
    speakNeural(label).catch(() => {})
  }

  useEffect(() => {
    setLiveVoice(false)
    setPlaying(false)
    const audio = audioRef.current
    if (!audio) return
    audio.load()
    if (autoPlay) audio.play().then(() => setPlaying(true)).catch(() => speakLive())
  }, [src, autoPlay])

  function play() {
    const audio = audioRef.current
    if (liveVoice || !audio) {
      speakLive()
      return
    }
    audio.currentTime = 0
    audio.play().then(() => setPlaying(true)).catch(() => speakLive())
  }

  function handleAudioError() {
    setLiveVoice(true)
    if (autoPlay) speakLive()
  }

  return (
    <>
      <audio ref={audioRef} src={src} preload="none" onEnded={() => setPlaying(false)} onError={handleAudioError} />
      <button className={`f100-speaker ${large ? 'large' : ''} ${playing ? 'playing' : ''}`} type="button" onClick={play} aria-label={`Hear ${label}`}>
        <span aria-hidden="true">{playing ? '🎶' : '🔊'}</span>
        {large && <small>Tap to hear</small>}
      </button>
    </>
  )
}

function ShelfHome({ progress, onOpenShelf, onQuiz, onParent, onHome }) {
  const seen = new Set(progress.seen)
  return (
    <div className="f100-page f100-library-home">
      <header className="f100-topbar">
        <button type="button" className="f100-round" onClick={onHome} aria-label="Back home">⌂</button>
        <div><p className="f100-eyebrow">Pranav's picture books</p><h1>My First 100 Library</h1></div>
        <button type="button" className="f100-grownups" onClick={onParent}>Grown-ups</button>
      </header>
      <section className="f100-welcome" aria-label="Choose a book">
        <div><span>👋</span><strong>Pick a book!</strong><small>Tap, look, listen, and play.</small></div>
        <button type="button" onClick={() => onQuiz(first100Shelves[Math.floor(Math.random() * first100Shelves.length)])}>✨ Play “Find it!”</button>
      </section>
      <main className="f100-shelves">
        {first100Shelves.map((shelf, shelfIndex) => {
          const words = shelf.words || shelf.items || []
          const count = words.filter((word) => seen.has(wordKey(shelf, word))).length
          const color = shelf.color || ['#ff7657', '#f3b53f', '#5dbf78', '#5c9ee8', '#9b78dc'][shelfIndex % 5]
          return (
            <article className="f100-shelf" style={{ '--shelf': color }} key={shelf.id}>
              <button type="button" className="f100-book" onClick={() => onOpenShelf(shelf)}>
                <span className="f100-book-art" aria-hidden="true">{shelf.icon || shelf.emoji || ['🦁', '🍓', '🔵', '🚂', '🧸'][shelfIndex % 5]}</span>
                <span><small>MY FIRST 100</small><strong>{shelf.title || shelf.name}</strong><em>{words.length} pictures</em></span>
              </button>
              <div className="f100-shelf-bottom">
                <div className="f100-progress" aria-label={`${count} of ${words.length} seen`}><i style={{ width: `${words.length ? (count / words.length) * 100 : 0}%` }} /></div>
                <span>{count}/{words.length} seen</span>
                <button type="button" onClick={() => onQuiz(shelf)}>Find it! 🔎</button>
              </div>
            </article>
          )
        })}
      </main>
    </div>
  )
}

function CardViewer({ shelf, progress, update, onBack, onQuiz }) {
  const words = shelf.words || shelf.items || []
  const [index, setIndex] = useState(0)
  const [auto, setAuto] = useState(false)
  const touchStart = useRef(null)
  const word = words[index]

  useEffect(() => {
    if (!word) return
    const key = wordKey(shelf, word)
    if (progress.seen.includes(key)) return
    update({ ...progress, seen: [...progress.seen, key] })
  }, [index, shelf.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!auto || words.length < 2) return undefined
    const timer = window.setTimeout(() => setIndex((value) => (value + 1) % words.length), 4500)
    return () => window.clearTimeout(timer)
  }, [auto, index, words.length])

  if (!word) return <div className="f100-empty"><button type="button" onClick={onBack}>← Books</button><p>This book is being filled with pictures.</p></div>

  const move = (amount) => setIndex((value) => (value + amount + words.length) % words.length)
  return (
    <div className="f100-page f100-viewer" style={{ '--shelf': shelf.color || '#ff7657' }}>
      <header className="f100-topbar compact">
        <button type="button" className="f100-round" onClick={onBack} aria-label="All books">←</button>
        <div><p className="f100-eyebrow">{shelf.title || shelf.name}</p><h1>{index + 1} <span>of {words.length}</span></h1></div>
        <button type="button" className={`f100-auto ${auto ? 'on' : ''}`} onClick={() => setAuto((value) => !value)} aria-pressed={auto}>Auto {auto ? '✓' : '▶'}</button>
      </header>
      <div className="f100-card-wrap" onTouchStart={(event) => { touchStart.current = event.changedTouches[0].clientX }} onTouchEnd={(event) => {
        if (touchStart.current == null) return
        const distance = event.changedTouches[0].clientX - touchStart.current
        if (Math.abs(distance) > 45) move(distance < 0 ? 1 : -1)
        touchStart.current = null
      }}>
        <button type="button" className="f100-page-arrow left" onClick={() => move(-1)} aria-label="Previous picture">‹</button>
        <article className="f100-card">
          <Photo shelf={shelf} word={word} />
          <div className="f100-card-label"><h2>{wordLabel(word)}</h2><Speaker word={word} large /></div>
        </article>
        <button type="button" className="f100-page-arrow right" onClick={() => move(1)} aria-label="Next picture">›</button>
      </div>
      <div className="f100-dots" aria-hidden="true">{words.slice(Math.max(0, index - 2), Math.min(words.length, index + 3)).map((item) => <i className={item === word ? 'active' : ''} key={wordSlug(item)} />)}</div>
      <button type="button" className="f100-quiz-cta" onClick={() => onQuiz(shelf)}>🔎 Play “Find it!”</button>
    </div>
  )
}

function chooseQuestion(shelf, progress, previous) {
  const words = shelf.words || shelf.items || []
  if (words.length < 3) return null
  const missedFirst = words.filter((word) => (progress.missed[wordKey(shelf, word)] || 0) > 0 && wordSlug(word) !== previous)
  const pool = missedFirst.length ? missedFirst : words.filter((word) => wordSlug(word) !== previous)
  const target = pool[Math.floor(Math.random() * pool.length)] || words[0]
  const others = shuffle(words.filter((word) => wordSlug(word) !== wordSlug(target))).slice(0, 2)
  return { target, choices: shuffle([target, ...others]) }
}

function FindItQuiz({ shelf, progress, update, onBack }) {
  const [question, setQuestion] = useState(() => chooseQuestion(shelf, progress))
  const [message, setMessage] = useState('Listen, then tap the picture!')
  const [celebrating, setCelebrating] = useState(false)
  const [wrong, setWrong] = useState([])

  function next() {
    setQuestion(chooseQuestion(shelf, progress, question ? wordSlug(question.target) : ''))
    setMessage('Listen, then tap the picture!')
    setCelebrating(false)
    setWrong([])
  }

  function answer(word) {
    if (!question || celebrating) return
    const key = wordKey(shelf, question.target)
    const picked = wordSlug(word)
    const correct = picked === wordSlug(question.target)
    const attempt = { shelf: shelf.id, word: wordSlug(question.target), correct, at: Date.now() }
    if (correct) {
      update({
        ...progress,
        seen: progress.seen.includes(key) ? progress.seen : [...progress.seen, key],
        correct: { ...progress.correct, [key]: (progress.correct[key] || 0) + 1 },
        missed: { ...progress.missed, [key]: Math.max(0, (progress.missed[key] || 0) - 1) },
        attempts: [...progress.attempts, attempt].slice(-1000),
      })
      setMessage(`Yes! ${wordLabel(word)}!`)
      playClip('quiz-great-job')
      setCelebrating(true)
      window.setTimeout(next, 1500)
    } else {
      update({ ...progress, missed: { ...progress.missed, [key]: (progress.missed[key] || 0) + 1 }, attempts: [...progress.attempts, attempt].slice(-1000) })
      setWrong((items) => [...items, picked])
      setMessage('Good try! Look again.')
      playClip('quiz-try-again')
    }
  }

  if (!question) return <div className="f100-empty"><button type="button" onClick={onBack}>← Books</button><p>Add at least three pictures to play.</p></div>
  return (
    <div className={`f100-page f100-find ${celebrating ? 'celebrate' : ''}`} style={{ '--shelf': shelf.color || '#5dbf78' }}>
      <header className="f100-topbar compact">
        <button type="button" className="f100-round" onClick={onBack} aria-label="Leave game">←</button>
        <div><p className="f100-eyebrow">{shelf.title || shelf.name}</p><h1>Find it!</h1></div>
        <Speaker word={question.target} />
      </header>
      <section className="f100-find-prompt">
        <p>{message}</p>
        <h2>Where is the <strong>{wordLabel(question.target)}</strong>?</h2>
        <Speaker word={question.target} large autoPlay />
      </section>
      <div className="f100-find-grid">
        {question.choices.map((word) => {
          const slug = wordSlug(word)
          return <button type="button" className={`${wrong.includes(slug) ? 'try-again' : ''} ${celebrating && slug === wordSlug(question.target) ? 'right' : ''}`} key={slug} onClick={() => answer(word)}><Photo shelf={shelf} word={word} /><span>{wordLabel(word)}</span></button>
        })}
      </div>
      {celebrating && <div className="f100-confetti" aria-hidden="true">⭐ 🎉 ⭐</div>}
      <button type="button" className="f100-skip" onClick={next}>Another one ↻</button>
    </div>
  )
}

function ParentCorner({ progress, update, onBack }) {
  const attempts = progress.attempts
  return (
    <div className="f100-page f100-parent">
      <header className="f100-topbar"><button type="button" className="f100-round" onClick={onBack}>←</button><div><p className="f100-eyebrow">For grown-ups</p><h1>Learning progress</h1></div></header>
      <p className="f100-parent-intro">Short, happy play is enough. Revisit favorites and let missed words return naturally in “Find it!”</p>
      <div className="f100-stat-cards">
        <div><strong>{progress.seen.length}</strong><span>pictures explored</span></div>
        <div><strong>{attempts.length}</strong><span>quiz tries</span></div>
        <div><strong>{attempts.length ? Math.round((attempts.filter((item) => item.correct).length / attempts.length) * 100) : 0}%</strong><span>quiz accuracy</span></div>
      </div>
      <div className="f100-parent-shelves">
        {first100Shelves.map((shelf) => {
          const words = shelf.words || shelf.items || []
          const shelfAttempts = attempts.filter((item) => item.shelf === shelf.id)
          const right = shelfAttempts.filter((item) => item.correct).length
          const seen = words.filter((word) => progress.seen.includes(wordKey(shelf, word))).length
          return <article key={shelf.id} style={{ '--shelf': shelf.color || '#5c9ee8' }}><span aria-hidden="true">{shelf.icon || shelf.emoji || '📕'}</span><div><strong>{shelf.title || shelf.name}</strong><small>{seen}/{words.length} seen · {shelfAttempts.length ? Math.round((right / shelfAttempts.length) * 100) : 0}% quiz</small><div className="f100-progress"><i style={{ width: `${words.length ? (seen / words.length) * 100 : 0}%` }} /></div></div></article>
        })}
      </div>
      <a href="/first100/attribution.json" target="_blank" rel="noreferrer" style={{display:'block',margin:'24px auto 8px',textAlign:'center',color:'#476e60',fontWeight:800}}>Photo credits and licenses</a>
      <button type="button" className="f100-reset" onClick={() => { if (window.confirm('Reset all First 100 progress?')) update(EMPTY_PROGRESS) }}>Reset First 100 progress</button>
    </div>
  )
}

export default function First100Library({ onHome = () => {}, progress: incomingProgress, onChange = () => {} }) {
  const [localProgress, setLocalProgress] = useState(() => cleanProgress(incomingProgress))
  const [screen, setScreen] = useState({ name: 'home' })
  const progress = useMemo(() => cleanProgress(incomingProgress || localProgress), [incomingProgress, localProgress])

  function update(next) {
    const cleaned = { ...cleanProgress(next), updatedAt: Date.now() }
    setLocalProgress(cleaned)
    onChange(cleaned)
  }

  let content
  if (screen.name === 'viewer') content = <CardViewer shelf={screen.shelf} progress={progress} update={update} onBack={() => setScreen({ name: 'home' })} onQuiz={(shelf) => setScreen({ name: 'quiz', shelf })} />
  else if (screen.name === 'quiz') content = <FindItQuiz shelf={screen.shelf} progress={progress} update={update} onBack={() => setScreen({ name: 'home' })} />
  else if (screen.name === 'parent') content = <ParentCorner progress={progress} update={update} onBack={() => setScreen({ name: 'home' })} />
  else content = <ShelfHome progress={progress} onHome={onHome} onOpenShelf={(shelf) => { playClip(`shelf-intro-${shelf.id}`); setScreen({ name: 'viewer', shelf }) }} onQuiz={(shelf) => setScreen({ name: 'quiz', shelf })} onParent={() => setScreen({ name: 'parent' })} />

  return <div className="first100-library">{content}<First100Styles /></div>
}

function First100Styles() {
  return <style>{`
    .first100-library{min-height:100dvh;background:#fffaf0;color:#243b35;font-family:Nunito,ui-rounded,"Arial Rounded MT Bold",system-ui,sans-serif}.first100-library *{box-sizing:border-box}.first100-library button{font:inherit;touch-action:manipulation}.f100-page{width:min(1050px,100%);min-height:100dvh;margin:auto;padding:clamp(14px,3vw,34px)}.f100-topbar{display:flex;align-items:center;gap:16px;margin-bottom:24px}.f100-topbar>div{flex:1}.f100-topbar h1{margin:2px 0;font-size:clamp(1.55rem,4vw,2.55rem);line-height:1}.f100-topbar h1 span{font-size:.55em;color:#72817c}.f100-eyebrow{margin:0;text-transform:uppercase;letter-spacing:.11em;font-size:.72rem;font-weight:900;color:#75877f}.f100-round,.f100-grownups,.f100-auto{border:0;background:white;box-shadow:0 4px 15px #38594c20;border-radius:999px;min-height:48px;padding:0 17px;font-weight:900;color:#38594c}.f100-round{width:50px;padding:0;font-size:1.6rem}.f100-welcome{background:linear-gradient(135deg,#4fc6a1,#72d7b9);border-radius:28px;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px;color:white;box-shadow:0 10px 0 #319d7d}.f100-welcome div{display:grid;grid-template-columns:auto 1fr;column-gap:12px}.f100-welcome div>span{grid-row:1/3;font-size:3rem}.f100-welcome strong{font-size:1.5rem}.f100-welcome small{font-weight:700}.f100-welcome button,.f100-quiz-cta{border:0;border-radius:999px;background:#fff176;color:#614d00;font-weight:1000;padding:15px 20px;box-shadow:0 5px 0 #e0b82f}.f100-shelves{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;margin-top:30px}.f100-shelf{background:white;border-radius:25px;padding:13px;box-shadow:0 8px 26px #4b655b1a;border:3px solid color-mix(in srgb,var(--shelf),white 55%)}.f100-book{border:0;background:var(--shelf);color:white;width:100%;min-height:170px;border-radius:18px;padding:20px;display:flex;align-items:center;text-align:left;gap:20px;box-shadow:inset -10px 0 #00000010}.f100-book-art{font-size:clamp(3.5rem,8vw,6rem);filter:drop-shadow(0 5px 1px #0002)}.f100-book>span:last-child{display:flex;flex-direction:column}.f100-book small{font-weight:1000;letter-spacing:.08em}.f100-book strong{font-size:clamp(1.25rem,3vw,2rem);line-height:1.05;margin:4px 0}.f100-book em{font-style:normal;font-weight:800;opacity:.88}.f100-shelf-bottom{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:10px;padding:13px 4px 2px;font-size:.75rem;font-weight:800}.f100-shelf-bottom button{border:0;background:color-mix(in srgb,var(--shelf),white 78%);color:#34463f;border-radius:99px;padding:9px 12px;font-weight:900}.f100-progress{height:9px;border-radius:20px;background:#e8ece9;overflow:hidden}.f100-progress i{display:block;height:100%;background:var(--shelf);border-radius:inherit}.f100-viewer{background:color-mix(in srgb,var(--shelf),#fffaf0 88%)}.f100-auto.on{background:#dff8e8;color:#17673b}.f100-card-wrap{display:grid;grid-template-columns:55px minmax(0,720px) 55px;align-items:center;justify-content:center;gap:10px;touch-action:pan-y}.f100-page-arrow{border:0;background:white;color:var(--shelf);border-radius:50%;width:54px;height:54px;font-size:3rem;line-height:1;box-shadow:0 5px 15px #0002}.f100-card{background:white;border-radius:34px;padding:14px;box-shadow:0 16px 45px #31483e25;overflow:hidden}.f100-photo{display:block;width:100%;height:clamp(320px,58vh,620px);object-fit:cover;border-radius:24px;background:#edf2ef}.f100-photo-missing{display:flex;flex-direction:column;align-items:center;justify-content:center;color:#73817b}.f100-photo-missing span{font-size:5rem}.f100-photo-missing small{font-weight:900}.f100-card-label{display:flex;align-items:center;justify-content:center;gap:24px;padding:12px 12px 5px}.f100-card-label h2{font-size:clamp(2.4rem,8vw,5rem);line-height:1;margin:0;text-transform:capitalize}.f100-speaker{border:0;background:#fff176;border-radius:50%;width:52px;height:52px;font-size:1.55rem;box-shadow:0 5px 0 #e5bd32}.f100-speaker.large{width:auto;height:auto;min-height:58px;border-radius:99px;padding:8px 16px;display:flex;align-items:center;gap:8px}.f100-speaker small{font-weight:900}.f100-speaker.playing{animation:f100pop .55s infinite alternate}.f100-speaker:disabled{filter:grayscale(1);opacity:.55}.f100-dots{display:flex;justify-content:center;gap:7px;margin:17px}.f100-dots i{width:8px;height:8px;border-radius:50%;background:#cdd4d1}.f100-dots .active{width:28px;border-radius:9px;background:var(--shelf)}.f100-quiz-cta{display:block;margin:8px auto}.f100-find{background:linear-gradient(#e8f8ff,#fff9de)}.f100-find-prompt{text-align:center}.f100-find-prompt p{margin:0;font-weight:900;color:#678078}.f100-find-prompt h2{font-size:clamp(1.7rem,5vw,3.2rem);margin:7px}.f100-find-prompt strong{color:var(--shelf);text-transform:capitalize}.f100-find-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:28px auto;max-width:920px}.f100-find-grid button{border:7px solid white;background:white;padding:8px;border-radius:27px;box-shadow:0 10px 25px #31483e25;transition:.2s}.f100-find-grid .f100-photo{height:clamp(180px,29vw,310px)}.f100-find-grid span{display:block;font-size:clamp(1.1rem,3vw,1.75rem);font-weight:1000;text-transform:capitalize;padding:8px}.f100-find-grid button.try-again{animation:f100wiggle .35s;border-color:#ffd49d}.f100-find-grid button.right{border-color:#66d490;transform:scale(1.04)}.f100-confetti{text-align:center;font-size:clamp(2rem,8vw,5rem);animation:f100pop .45s infinite alternate}.f100-skip{display:block;margin:15px auto;border:0;background:white;border-radius:99px;padding:12px 20px;font-weight:900;color:#667a72}.f100-parent{background:#f5f5ee}.f100-parent-intro{font-size:1.05rem;line-height:1.5;background:#fff;padding:18px;border-radius:18px}.f100-stat-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:20px 0}.f100-stat-cards div{background:white;border-radius:20px;padding:20px;text-align:center}.f100-stat-cards strong{display:block;font-size:2rem;color:#39785e}.f100-stat-cards span{font-weight:800;color:#718079}.f100-parent-shelves{display:grid;gap:10px}.f100-parent-shelves article{background:white;border-radius:18px;padding:15px;display:flex;align-items:center;gap:15px}.f100-parent-shelves article>span{font-size:2.5rem}.f100-parent-shelves article>div{display:grid;gap:7px;flex:1}.f100-parent-shelves small{color:#718079}.f100-reset{display:block;margin:30px auto;border:1px solid #d7a0a0;background:white;color:#a33;border-radius:99px;padding:12px 20px}.f100-empty{min-height:100dvh;display:grid;place-content:center;text-align:center}.f100-empty button{border:0;border-radius:99px;padding:12px}.f100-confetti{pointer-events:none}@keyframes f100pop{to{transform:scale(1.12)}}@keyframes f100wiggle{25%{transform:rotate(-3deg)}75%{transform:rotate(3deg)}}
    @media(max-width:650px){.f100-page{padding:12px}.f100-topbar{margin-bottom:15px}.f100-grownups{font-size:.75rem;padding:0 10px}.f100-welcome{align-items:stretch;flex-direction:column;padding:16px;box-shadow:0 6px 0 #319d7d}.f100-welcome button{align-self:flex-start}.f100-shelves{grid-template-columns:1fr;gap:15px;margin-top:22px}.f100-book{min-height:135px}.f100-card-wrap{grid-template-columns:1fr}.f100-page-arrow{position:fixed;z-index:4;bottom:22px}.f100-page-arrow.left{left:15px}.f100-page-arrow.right{right:15px}.f100-card{padding:9px}.f100-photo{height:52vh}.f100-card-label{justify-content:space-between}.f100-find-grid{gap:8px;margin-top:18px}.f100-find-grid button{border-width:4px;padding:4px;border-radius:18px}.f100-find-grid .f100-photo{height:31vw;border-radius:12px}.f100-find-grid span{font-size:.92rem;padding:6px 2px}.f100-stat-cards{grid-template-columns:1fr}.f100-shelf-bottom{grid-template-columns:1fr auto}.f100-shelf-bottom>span{display:none}}
    @media(orientation:landscape) and (max-height:600px){.f100-page{padding:10px 18px}.f100-topbar{margin-bottom:8px}.f100-card .f100-photo{height:58vh}.f100-card-label h2{font-size:2rem}.f100-find-prompt h2{font-size:1.55rem}.f100-find-grid{max-width:760px;margin:10px auto;gap:12px}.f100-find-grid .f100-photo{height:34vh}.f100-find-grid span{padding:3px}.f100-shelves{grid-template-columns:repeat(2,1fr)}}
  `}</style>
}
