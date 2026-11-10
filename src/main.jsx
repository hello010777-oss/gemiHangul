import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const INITIALS = ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const EXTRA_INITIALS = ['ㄲ','ㄸ','ㅃ','ㅆ','ㅉ'];
const MEDIALS = ['ㅏ','ㅑ','ㅓ','ㅕ','ㅗ','ㅛ','ㅜ','ㅠ','ㅡ','ㅣ','ㅐ','ㅔ'];
const EXTRA_MEDIALS = ['ㅒ','ㅖ','ㅘ','ㅙ','ㅚ','ㅝ','ㅞ','ㅟ','ㅢ'];
const FINALS = ['', 'ㄱ','ㄴ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const EXTRA_FINALS = ['ㄲ','ㄳ','ㄵ','ㄶ','ㄷ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅄ','ㅆ'];

const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONG = ['', 'ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

function compose(initial, medial, final = '') {
  const a = CHO.indexOf(initial);
  const b = JUNG.indexOf(medial);
  const c = JONG.indexOf(final);
  if (a < 0 || b < 0 || c < 0) return '';
  return String.fromCharCode(0xac00 + (a * 21 + b) * 28 + c);
}

let audioContext;

function ensureAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  audioContext ||= new AudioContext();
  return audioContext;
}

function playTone(notes, type = 'sine', volume = 0.16) {
  const ctx = ensureAudio();
  if (!ctx) return;

  const play = () => {
    const now = ctx.currentTime;
    notes.forEach(note => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(note.frequency, now + note.start);
      gain.gain.setValueAtTime(0.0001, now + note.start);
      gain.gain.exponentialRampToValueAtTime(volume, now + note.start + .015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now + note.start);
      oscillator.stop(now + note.start + note.duration);
    });
  };

  if (ctx.state === 'suspended') ctx.resume().then(play);
  else play();
}

function playClick(kind = 'initial') {
  const pitch = { initial: 620, medial: 740, final: 520 }[kind] || 620;
  playTone([{ frequency: pitch, start: 0, duration: .1 }], 'triangle', 0.12);
}

function playFeedback(isCorrect) {
  if (isCorrect) {
    playTone(
      [{ frequency: 659, start: 0, duration: .17 }, { frequency: 880, start: .18, duration: .35 }],
      'sine',
      0.18
    );
  } else {
    playTone(
      [{ frequency: 190, start: 0, duration: .12 }, { frequency: 145, start: .13, duration: .18 }],
      'square',
      0.09
    );
  }
}

function LetterButton({ value, selected, type, onClick }) {
  const label = value || '없음';
  return (
    <button
      type="button"
      className={`letter ${type} ${selected ? 'selected' : ''} ${!value ? 'empty' : ''}`}
      aria-pressed={selected}
      aria-label={value ? `${label} 선택` : '받침 없음'}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function App() {
  const [goal, setGoal] = useState('학교');
  const [draftGoal, setDraftGoal] = useState('학교');
  const [editing, setEditing] = useState(false);
  const [initial, setInitial] = useState('');
  const [medial, setMedial] = useState('');
  const [final, setFinal] = useState('');
  const [answer, setAnswer] = useState('');
  const [showMore, setShowMore] = useState({ initial:false, medial:false, final:false });
  const [celebrating, setCelebrating] = useState(false);
  const syllable = useMemo(() => compose(initial, medial, final), [initial, medial, final]);
  const matched = [...goal].map((char, index) => answer[index] === char);

  useEffect(() => {
    if (answer && answer === goal) {
      setCelebrating(true);
      return;
    }
    setCelebrating(false);
  }, [answer, goal]);

  const choose = (kind, value) => {
    playClick(kind);
    if (kind === 'initial') setInitial(value);
    if (kind === 'medial') setMedial(value);
    if (kind === 'final') setFinal(value);
  };

  const addSyllable = () => {
    if (!syllable || answer.length >= goal.length) return;
    playFeedback(syllable === goal[answer.length]);
    setAnswer(prev => prev + syllable);
    setInitial('');
    setMedial('');
    setFinal('');
  };

  const saveGoal = (event) => {
    event.preventDefault();
    const clean = draftGoal.trim().replace(/\s+/g, '');
    if (!clean) return;
    setGoal(clean.slice(0, 6));
    setAnswer('');
    setEditing(false);
  };

  const reset = () => {
    setAnswer('');
    setInitial('');
    setMedial('');
    setFinal('');
    setCelebrating(false);
  };

  return (
    <main className="app">
      <div className="sky-deco cloud one" aria-hidden="true" />
      <div className="sky-deco cloud two" aria-hidden="true" />
      <header>
        <a className="brand" href="#" aria-label="한글연구소 처음으로">
          <span className="brand-mark">한</span>
          <span><b>한글연구소</b><small>놀이로 만나는 재미있는 한글</small></span>
        </a>
        <img className="maker-logo" src={`${import.meta.env.BASE_URL}gemidain-logo.png`} alt="Gemidain" />
      </header>

      <section className="goal-card" aria-labelledby="goal-title">
        <div className="goal-label" id="goal-title"><span>⭐</span> 오늘의 목표 단어</div>
        <div className="goal-row">
          <div className="goal-word" aria-label={`목표 단어 ${goal}`}>
            {[...goal].map((char, i) => <span key={`${char}-${i}`}>{char}</span>)}
          </div>
          <button className="edit-goal" onClick={() => { setDraftGoal(goal); setEditing(true); }}>✏️ 단어 바꾸기</button>
        </div>
        <p>목표 단어와 똑같이 글자를 만들어 보세요!</p>
      </section>

      <section className="workbench" aria-label="글자 조합기">
        <div className="answer-zone">
          <div className="answer-title"><span>내가 만든 단어</span><button onClick={reset}>↻ 다시 하기</button></div>
          <div className="answer-boxes">
            {[...goal].map((char, i) => (
              <div className={`answer-box ${answer[i] ? (matched[i] ? 'correct' : 'wrong') : ''}`} key={i}>
                {answer[i] || <span>{i + 1}</span>}
                {answer[i] && <small>{matched[i] ? '✓' : '한 번 더!'}</small>}
              </div>
            ))}
          </div>
          {answer.length > 0 && (
            <div className="answer-actions">
              <button className="backspace" onClick={() => setAnswer(v => v.slice(0, -1))}>⌫ 한 글자 지우기</button>
            </div>
          )}
        </div>

        <div className="builder">
          <div className="builder-heading">
            <span className="step-badge">글자 조합기</span>
            <h2>글자를 골라 한 글자를 만들어요</h2>
          </div>
          <div className="formula" aria-live="polite">
            <div className={`part initial-part ${initial ? 'filled' : ''}`}><small>첫소리</small><strong>{initial || '?'}</strong></div>
            <span className="plus">+</span>
            <div className={`part medial-part ${medial ? 'filled' : ''}`}><small>가운데소리</small><strong>{medial || '?'}</strong></div>
            <span className="plus">+</span>
            <div className={`part final-part ${final !== '' ? 'filled' : ''}`}><small>끝소리</small><strong>{final || '없음'}</strong></div>
            <span className="equals">=</span>
            <div className={`result ${syllable ? 'ready' : ''}`}><small>완성 글자</small><strong>{syllable || '?'}</strong></div>
            <button className="add-letter" disabled={!syllable || answer.length >= goal.length} onClick={addSyllable}>
              {syllable ? <><span>{syllable}</span> 넣기</> : '두 소리를 골라요'}
            </button>
          </div>

          <div className="choices">
            <section className="choice-group initials">
              <div className="choice-title"><span className="number">1</span><div><h3>첫소리</h3><p>자음에서 골라요</p></div><span className="mascot">🐰</span></div>
              <div className="letter-grid">
                {[...INITIALS, ...(showMore.initial ? EXTRA_INITIALS : [])].map(v =>
                  <LetterButton key={v} value={v} type="initial" selected={initial === v} onClick={() => choose('initial', v)} />
                )}
              </div>
              <button className="more" onClick={() => setShowMore(s => ({...s, initial:!s.initial}))}>{showMore.initial ? '기본 글자만 보기' : '+ 쌍자음 더 보기'}</button>
            </section>

            <section className="choice-group medials">
              <div className="choice-title"><span className="number">2</span><div><h3>가운데소리</h3><p>모음에서 골라요</p></div><span className="mascot">🐥</span></div>
              <div className="letter-grid">
                {[...MEDIALS, ...(showMore.medial ? EXTRA_MEDIALS : [])].map(v =>
                  <LetterButton key={v} value={v} type="medial" selected={medial === v} onClick={() => choose('medial', v)} />
                )}
              </div>
              <button className="more" onClick={() => setShowMore(s => ({...s, medial:!s.medial}))}>{showMore.medial ? '기본 글자만 보기' : '+ 합친 모음 더 보기'}</button>
            </section>

            <section className="choice-group finals">
              <div className="choice-title"><span className="number">3</span><div><h3>끝소리</h3><p>받침은 없어도 돼요</p></div><span className="mascot">🐻</span></div>
              <div className="letter-grid">
                {[...FINALS, ...(showMore.final ? EXTRA_FINALS : [])].map(v =>
                  <LetterButton key={v || 'none'} value={v} type="final" selected={final === v} onClick={() => choose('final', v)} />
                )}
              </div>
              <button className="more" onClick={() => setShowMore(s => ({...s, final:!s.final}))}>{showMore.final ? '기본 글자만 보기' : '+ 어려운 받침 더 보기'}</button>
            </section>
          </div>
        </div>
      </section>

      <footer><span>🌱</span> 천천히, 하나씩 골라도 괜찮아요 <span>🌼</span></footer>

      {editing && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setEditing(false)}>
          <form className="modal" onSubmit={saveGoal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button type="button" className="modal-close" onClick={() => setEditing(false)} aria-label="닫기">×</button>
            <div className="modal-icon">🎯</div>
            <h2 id="modal-title">어떤 단어를 만들까요?</h2>
            <p>한글 단어를 6글자까지 적어 주세요.</p>
            <input autoFocus value={draftGoal} maxLength={6} onChange={e => setDraftGoal(e.target.value.replace(/[^가-힣]/g, ''))} aria-label="목표 단어" />
            <div className="quick-words">
              {['학교','나비','토끼','무지개','자동차'].map(word => <button type="button" key={word} onClick={() => setDraftGoal(word)}>{word}</button>)}
            </div>
            <button className="save-goal" type="submit">이 단어로 시작하기</button>
          </form>
        </div>
      )}

      {celebrating && (
        <div className="celebration" role="dialog" aria-modal="true" aria-label="목표 단어 완성">
          <div className="confetti" aria-hidden="true">{['🎉','⭐','🌸','✨','🎈','🌟','💛','🎊'].map((v,i) => <span key={i}>{v}</span>)}</div>
          <div className="celebration-card">
            <div className="trophy">🏆</div>
            <h2>참 잘했어요!</h2>
            <strong>{goal}</strong>
            <p>목표 단어를 멋지게 완성했어요!</p>
            <div><button onClick={reset}>한 번 더 만들기</button></div>
          </div>
        </div>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
