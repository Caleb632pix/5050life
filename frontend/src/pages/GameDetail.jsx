import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, Users, Target, Trophy, Zap, Share2, Bell, MessageSquare, Plus, Star } from 'lucide-react';
import { getGameById, GAME_CATEGORIES, BET_TYPES_BY_GAME } from '../data/games';
import { selectUser } from '../store/slices/authSlice';
import { selectBalance } from '../store/slices/walletSlice';
import { Modal } from '../components/Common/NotificationPanel';
import BetCard from '../components/Betting/BetCard';
import api from '../services/api';
import toast from 'react-hot-toast';

const TABS = ['Bets', 'Leaderboard', 'How to Bet', 'Community'];
const COMMISSION = 0.10;

export default function GameDetail() {
  const { gameId }   = useParams();
  const navigate     = useNavigate();
  const user         = useSelector(selectUser);
  const balance      = useSelector(selectBalance);
  const game         = getGameById(gameId);

  const [tab, setTab]             = useState('Bets');
  const [bets, setBets]           = useState([]);
  const [leaderboard, setLboard]  = useState(getMockLeaderboard(gameId));
  const [loading, setLoading]     = useState(false);
  const [showCreate, setCreate]   = useState(false);
  const [showChallenge, setChal]  = useState(false);
  const [betTypeFilter, setBTF]   = useState('all');

  useEffect(() => {
    if (!game) return;
    loadBets();
  }, [gameId, betTypeFilter]);

  const loadBets = async () => {
    setLoading(true);
    try {
      const params = betTypeFilter !== 'all' ? { betType: betTypeFilter } : {};
      const { data } = await api.get(`/games/${gameId}/bets`, { params });
      setBets(data.data.bets);
    } catch {
      setBets(getMockBets(game));
    } finally { setLoading(false); }
  };

  if (!game) {
    return (
      <div style={{ textAlign:'center', padding:80, color:'var(--text-muted)' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🎮</div>
        <h2>Game not found</h2>
        <button className="btn btn-blue" onClick={() => navigate('/gaming')} style={{ marginTop:16 }}>Back to Games</button>
      </div>
    );
  }

  const cat = GAME_CATEGORIES[game.category];

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', paddingBottom: 80 }}>

      {/* ── Game Hero ────────────────────────────────────────────────── */}
      <div style={{
        background:`linear-gradient(160deg,${game.gradient[0]}dd 0%,${game.gradient[1]}dd 100%)`,
        padding:'20px 16px 0', position:'relative', overflow:'hidden'
      }}>
        {/* BG icon */}
        <div style={{
          position:'absolute', right:-20, top:-20, fontSize:200, opacity:0.06,
          userSelect:'none', lineHeight:1
        }}>{game.icon}</div>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, position:'relative' }}>
          <button onClick={() => navigate('/gaming')} style={{
            background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'var(--radius)',
            padding:'6px 10px', cursor:'pointer', color:'white', display:'flex', alignItems:'center'
          }}><ChevronLeft size={18} /></button>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
              <span style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:26, color:'white' }}>
                {game.name}
              </span>
              {game.verified && <span style={{ fontSize:14 }}>✅</span>}
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.7)', background:'rgba(255,255,255,0.15)', padding:'2px 8px', borderRadius:20 }}>
                {cat?.icon} {cat?.label}
              </span>
              {game.platforms.map(p => (
                <span key={p} style={{ fontSize:10, color:'rgba(255,255,255,0.6)', background:'rgba(255,255,255,0.1)', padding:'2px 7px', borderRadius:20 }}>{p}</span>
              ))}
              {game.popular && <span style={{ fontSize:10, color:'white', background:'var(--red)', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>🔥 TRENDING</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'var(--radius)', padding:'8px', cursor:'pointer', color:'white', display:'flex' }}>
              <Bell size={16} />
            </button>
            <button style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'var(--radius)', padding:'8px', cursor:'pointer', color:'white', display:'flex' }}>
              <Share2 size={16} />
            </button>
          </div>
        </div>

        <p style={{ fontSize:13, color:'rgba(255,255,255,0.8)', lineHeight:1.5, marginBottom:16, position:'relative' }}>
          {game.description}
        </p>

        {/* Stats bar */}
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16,
          background:'rgba(0,0,0,0.2)', borderRadius:'var(--radius)', padding:'12px',
          position:'relative'
        }}>
          <StatBox icon="👥" label="Active Players" value={game.activePlayers.toLocaleString()} />
          <StatBox icon="🎯" label="Open Bets"      value={game.openBets.toLocaleString()} />
          <StatBox icon="🏆" label="Top Prize"      value={`$${game.topPrize}`} />
        </div>

        {/* CTA buttons */}
        <div style={{ display:'flex', gap:8, paddingBottom:16, position:'relative' }}>
          <button className="btn btn-lg" onClick={() => setCreate(true)} style={{
            flex:2, background:'white', color:'#0D0D0D', fontFamily:'var(--font-cond)',
            fontWeight:900, fontSize:16, letterSpacing:'0.02em'
          }}>
            🎯 CREATE BET CHALLENGE
          </button>
          <button className="btn btn-lg btn-ghost" onClick={() => setChal(true)} style={{
            flex:1, borderColor:'rgba(255,255,255,0.4)', color:'white'
          }}>
            ⚔️ Challenge Player
          </button>
        </div>
      </div>

      {/* ── Bet type quick filters ───────────────────────────────────── */}
      <div style={{ background:'var(--bg-card)', borderBottom:'1px solid var(--border)', padding:'12px 16px' }}>
        <div style={{ overflowX:'auto', display:'flex', gap:6, scrollbarWidth:'none' }}>
          <button onClick={() => setBTF('all')} style={betTypeBtn(betTypeFilter==='all', game.gradient[0])}>
            All Types
          </button>
          {game.betTypes.map(bt => (
            <button key={bt} onClick={() => setBTF(bt)} style={betTypeBtn(betTypeFilter===bt, game.gradient[0])}>
              {BET_TYPES_BY_GAME[bt]?.label || bt.replace(/_/g,' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div style={{
        position:'sticky', top:0, zIndex:10, background:'var(--bg)',
        borderBottom:'1px solid var(--border)', display:'flex', padding:'0 16px'
      }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'12px 14px', border:'none', background:'none', cursor:'pointer',
            fontWeight:700, fontSize:12, textTransform:'uppercase', letterSpacing:'0.04em',
            color: tab===t ? game.gradient[0] : 'var(--text-muted)',
            borderBottom: tab===t ? `2px solid ${game.gradient[0]}` : '2px solid transparent',
            transition:'all 0.15s'
          }}>{t}</button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────── */}
      <div style={{ padding:'14px 16px' }}>

        {tab === 'Bets' && (
          <div>
            {/* Commission notice */}
            <div style={{
              background:`linear-gradient(135deg,${game.gradient[0]}15,${game.gradient[1]}15)`,
              border:`1px solid ${game.gradient[0]}30`, borderRadius:'var(--radius)',
              padding:'10px 14px', marginBottom:14, fontSize:12, color:'var(--text-secondary)',
              display:'flex', alignItems:'center', gap:8
            }}>
              <Zap size={12} style={{ color:'var(--amber)', flexShrink:0 }} />
              <span>All game bets on 50/50 Life carry a <strong style={{ color:'var(--text-primary)' }}>10% platform commission</strong> on winning payouts. Displayed odds are gross — net payout shown in each bet card.</span>
            </div>

            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="card" style={{ marginBottom:10 }}>
                  <div className="skeleton" style={{ height:14, width:'60%', marginBottom:8 }} />
                  <div className="skeleton" style={{ height:40 }} />
                </div>
              ))
            ) : bets.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {bets.map(bet => <BetCard key={bet.id} bet={bet} />)}
              </div>
            ) : (
              <EmptyBets game={game} onCreateBet={() => setCreate(true)} />
            )}
          </div>
        )}

        {tab === 'Leaderboard' && (
          <LeaderboardTab gameId={gameId} game={game} leaderboard={leaderboard} />
        )}

        {tab === 'How to Bet' && (
          <HowToBetTab game={game} />
        )}

        {tab === 'Community' && (
          <CommunityTab game={game} gameId={gameId} />
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateGameBetModal
          game={game}
          balance={balance}
          onClose={() => setCreate(false)}
          onCreated={(bet) => { setBets(prev => [bet, ...prev]); toast.success('Bet live! 🎮'); }}
        />
      )}
      {showChallenge && (
        <ChallengePlayerModal
          game={game}
          balance={balance}
          onClose={() => setChal(false)}
        />
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatBox({ icon, label, value }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:16, marginBottom:2 }}>{icon}</div>
      <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:20, color:'white', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', marginTop:2 }}>{label}</div>
    </div>
  );
}

function EmptyBets({ game, onCreateBet }) {
  return (
    <div style={{ textAlign:'center', padding:'50px 20px', color:'var(--text-muted)' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>{game.icon}</div>
      <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:20, marginBottom:8 }}>No open bets yet</div>
      <div style={{ fontSize:13, marginBottom:20 }}>Be the first to create a {game.shortName} bet challenge!</div>
      <button className="btn btn-lg" onClick={onCreateBet} style={{
        background:`linear-gradient(135deg,${game.gradient[0]},${game.gradient[1]})`,
        border:'none', color:'white', fontFamily:'var(--font-cond)', fontWeight:900
      }}>🎯 Create First Bet</button>
    </div>
  );
}

function LeaderboardTab({ gameId, game, leaderboard }) {
  const navigate = useNavigate();
  return (
    <div>
      <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:18, marginBottom:14 }}>
        🏆 TOP {game.shortName} BETTORS
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {leaderboard.map((player, i) => (
          <div key={player.username} className="card" style={{
            display:'flex', alignItems:'center', gap:12, cursor:'pointer',
            borderLeft:`3px solid ${i===0?'#FFD700':i===1?'#C0C0C0':i===2?'#CD7F32':'var(--border)'}`,
          }} onClick={() => navigate(`/profile/${player.username}`)}>
            <div style={{
              width:32, fontFamily:'var(--font-cond)', fontWeight:900, fontSize:20,
              textAlign:'center', color: i===0?'#FFD700':i===1?'#C0C0C0':i===2?'#CD7F32':'var(--text-muted)'
            }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</div>
            <div style={{
              width:40, height:40, borderRadius:'50%', flexShrink:0,
              background:`linear-gradient(135deg,${game.gradient[0]},${game.gradient[1]})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'white', fontWeight:900, fontFamily:'var(--font-cond)', fontSize:16
            }}>{player.username[0].toUpperCase()}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700 }}>@{player.username}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                {player.wins} wins · {player.totalBets} bets · {player.winRate}% rate
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:18, color:'var(--green)' }}>
                +${player.netProfit.toLocaleString()}
              </div>
              <div style={{ fontSize:10, color:'var(--text-muted)' }}>NET WON</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HowToBetTab({ game }) {
  return (
    <div>
      <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:18, marginBottom:16 }}>
        📖 HOW TO BET ON {game.shortName.toUpperCase()}
      </div>

      {/* Steps */}
      {[
        { num:'1', title:'Pick a bet type', desc:`${game.shortName} supports ${game.betTypes.length} different bet types including: ${game.betTypes.slice(0,3).map(b=>b.replace(/_/g,' ')).join(', ')} and more.` },
        { num:'2', title:'Set your stake and odds', desc:`Choose how much you want to bet ($1–$10,000) and agree on the odds with your opponent. Fair odds for ${game.shortName} are typically between 1.5–3.0x.` },
        { num:'3', title:'Create or accept a challenge', desc:`Post your bet publicly for anyone to accept, or challenge a specific player directly. Your stake goes into escrow immediately.` },
        { num:'4', title:'Play the game', desc:`Both players play ${game.shortName} and the agreed match/challenge takes place. Honor system applies — disputes can be raised within 24 hours of settlement.` },
        { num:'5', title:'Settlement and payout', desc:`Once results are confirmed, the winner receives the payout minus the 50/50 Life 10% commission. Net winnings go straight to your wallet.` },
      ].map(step => (
        <div key={step.num} style={{ display:'flex', gap:14, marginBottom:18 }}>
          <div style={{
            width:36, height:36, borderRadius:'50%', flexShrink:0,
            background:`linear-gradient(135deg,${game.gradient[0]},${game.gradient[1]})`,
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'white', fontFamily:'var(--font-cond)', fontWeight:900, fontSize:18
          }}>{step.num}</div>
          <div>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{step.title}</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 }}>{step.desc}</div>
          </div>
        </div>
      ))}

      {/* Supported bet types */}
      <div className="card" style={{ marginTop:8 }}>
        <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:15, marginBottom:12 }}>
          ⚡ SUPPORTED BET TYPES FOR {game.shortName.toUpperCase()}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {game.betTypes.map(bt => {
            const info = BET_TYPES_BY_GAME[bt];
            return (
              <div key={bt} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                <div style={{
                  width:8, height:8, borderRadius:'50%', flexShrink:0, marginTop:4,
                  background:`linear-gradient(135deg,${game.gradient[0]},${game.gradient[1]})`
                }} />
                <div>
                  <div style={{ fontWeight:700, fontSize:13 }}>{info?.label || bt.replace(/_/g,' ')}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{info?.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Commission reminder */}
      <div style={{ background:'var(--bg-hover)', borderRadius:'var(--radius)', padding:'12px 14px', marginTop:14, fontSize:12, color:'var(--text-secondary)' }}>
        💰 <strong style={{ color:'var(--text-primary)' }}>50/50 Life Commission:</strong> 10% of all winning payouts go to the platform. This is deducted automatically at settlement and shown clearly on every bet card before you accept.
      </div>
    </div>
  );
}

function CommunityTab({ game, gameId }) {
  const navigate = useNavigate();
  const posts = getMockCommunityPosts(game);
  return (
    <div>
      <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:18, marginBottom:14 }}>
        💬 {game.shortName.toUpperCase()} COMMUNITY
      </div>
      {posts.map(post => (
        <div key={post.id} className="card card-hover" style={{ marginBottom:10, cursor:'pointer' }}>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <div style={{
              width:34, height:34, borderRadius:'50%', flexShrink:0,
              background:`linear-gradient(135deg,${game.gradient[0]},${game.gradient[1]})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'white', fontWeight:900, fontSize:13
            }}>{post.username[0].toUpperCase()}</div>
            <div>
              <span style={{ fontWeight:700, fontSize:13 }}>@{post.username}</span>
              <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:6 }}>{post.time}</span>
            </div>
          </div>
          <p style={{ fontSize:13, lineHeight:1.5, marginBottom:8 }}>{post.content}</p>
          <div style={{ display:'flex', gap:12, fontSize:12, color:'var(--text-muted)' }}>
            <span>❤️ {post.likes}</span>
            <span>💬 {post.comments}</span>
            {post.hasBet && <span style={{ color:'var(--amber)', fontWeight:700 }}>🎯 Includes bet</span>}
          </div>
        </div>
      ))}
      <button className="btn btn-ghost btn-full" style={{ marginTop:6 }}
        onClick={() => navigate('/explore')}>
        <MessageSquare size={14} /> View more discussions
      </button>
    </div>
  );
}

// ── Create Game Bet Modal ────────────────────────────────────────────────────
function CreateGameBetModal({ game, balance, onClose, onCreated }) {
  const [betType, setBetType]   = useState(game.betTypes[0]);
  const [desc, setDesc]         = useState('');
  const [selection, setSelection]= useState('');
  const [stake, setStake]       = useState('');
  const [odds, setOdds]         = useState('2.00');
  const [visibility, setVis]    = useState('public');
  const [loading, setLoading]   = useState(false);
  const [step, setStep]         = useState(1);

  const stakeNum   = parseFloat(stake) || 0;
  const oddsNum    = parseFloat(odds)  || 0;
  const grossPayout= stakeNum * oddsNum;
  const commission = grossPayout * COMMISSION;
  const netPayout  = grossPayout - commission;
  const canAfford  = stakeNum <= parseFloat(balance || 0);

  const submit = async () => {
    if (!desc || !stake || !odds) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/games/${game.id}/bets`, {
        betType, description: desc, selection: selection || game.shortName,
        stake: stakeNum, odds: oddsNum, visibility
      });
      onCreated(data.data.bet);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create bet');
    } finally { setLoading(false); }
  };

  return (
    <Modal title={`🎮 Bet on ${game.shortName}`} onClose={onClose} width={520}>
      {/* Game identity */}
      <div style={{
        display:'flex', gap:12, alignItems:'center', marginBottom:20, padding:12,
        background:`linear-gradient(135deg,${game.gradient[0]}15,${game.gradient[1]}15)`,
        borderRadius:'var(--radius)', border:`1px solid ${game.gradient[0]}30`
      }}>
        <div style={{
          width:48, height:48, borderRadius:'var(--radius)', flexShrink:0,
          background:`linear-gradient(135deg,${game.gradient[0]},${game.gradient[1]})`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:26
        }}>{game.icon}</div>
        <div>
          <div style={{ fontWeight:900, fontSize:16 }}>{game.name}</div>
          <div style={{ fontSize:12, color:'var(--text-secondary)' }}>
            {game.openBets} open bets · {game.activePlayers.toLocaleString()} active players
          </div>
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <>
          {/* Bet type */}
          <div className="form-group">
            <label className="form-label">Bet Type</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {game.betTypes.map(bt => {
                const info = BET_TYPES_BY_GAME[bt];
                return (
                  <button key={bt} onClick={() => setBetType(bt)} style={{
                    padding:'8px 10px', borderRadius:'var(--radius)', cursor:'pointer',
                    background: betType===bt ? `${game.gradient[0]}20` : 'var(--bg-input)',
                    border:`2px solid ${betType===bt ? game.gradient[0] : 'var(--border)'}`,
                    textAlign:'left', transition:'all 0.15s'
                  }}>
                    <div style={{ fontWeight:700, fontSize:12, color: betType===bt ? game.gradient[0] : 'var(--text-primary)' }}>
                      {info?.label || bt.replace(/_/g,' ')}
                    </div>
                    <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{info?.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Challenge description */}
          <div className="form-group">
            <label className="form-label">Challenge Description</label>
            <textarea className="form-input" rows={2} style={{ resize:'none' }}
              placeholder={`e.g. "I'll get top 3 in the next ${game.shortName} match" or "I beat you in a 1v1 — $${stake || '50'} on it"`}
              value={desc} onChange={e => setDesc(e.target.value)} maxLength={300} />
          </div>

          <div className="form-group">
            <label className="form-label">Your Side / Selection</label>
            <input className="form-input" placeholder={`Your player name or claim, e.g. "I win" or your username`}
              value={selection} onChange={e => setSelection(e.target.value)} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="form-group">
              <label className="form-label">Stake ($)</label>
              <input className={`form-input ${!canAfford&&stake?'error':''}`} type="number" min="1" max="10000"
                placeholder="e.g. 50" value={stake} onChange={e => setStake(e.target.value)} />
              {!canAfford && stake && <span className="form-error">Balance: ${parseFloat(balance).toFixed(2)}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Odds (Decimal)</label>
              <input className="form-input" type="number" min="1.01" step="0.05" value={odds}
                onChange={e => setOdds(e.target.value)} placeholder="e.g. 2.00" />
            </div>
          </div>

          <button className="btn btn-lg btn-full" onClick={() => setStep(2)}
            disabled={!desc || !stake || !odds || !canAfford}
            style={{ background:`linear-gradient(135deg,${game.gradient[0]},${game.gradient[1]})`, border:'none', color:'white', fontFamily:'var(--font-cond)', fontWeight:900 }}>
            Review Challenge →
          </button>
        </>
      )}

      {/* Step 2 — Review */}
      {step === 2 && (
        <>
          <button onClick={() => setStep(1)} style={{ background:'none', border:'none', color:'var(--blue-light)', cursor:'pointer', fontSize:13, marginBottom:16 }}>← Edit</button>

          <div style={{ background:'var(--bg-hover)', borderRadius:'var(--radius-lg)', padding:16, marginBottom:16 }}>
            <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:16, marginBottom:12, color:game.gradient[0] }}>
              📊 BET SUMMARY
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { label:'Game',           value: game.name },
                { label:'Bet Type',       value: BET_TYPES_BY_GAME[betType]?.label },
                { label:'Challenge',      value: desc },
                { label:'Stake',          value: `$${stakeNum.toFixed(2)}` },
                { label:'Odds',           value: `${oddsNum.toFixed(2)}x` },
                null,
                { label:'Gross Payout',   value: `$${grossPayout.toFixed(2)}` },
                { label:'Commission (10%)', value: `-$${commission.toFixed(2)}`, color:'var(--error)' },
                { label:'🏆 Net Payout',  value: `$${netPayout.toFixed(2)}`, color:'var(--green)', bold:true },
              ].map((row, i) => row === null
                ? <hr key={i} style={{ border:'none', borderTop:'1px solid var(--border)' }} />
                : (
                  <div key={row.label} style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{row.label}</span>
                    <span style={{ fontWeight:row.bold?900:700, fontSize:row.bold?16:13, color:row.color||'var(--text-primary)', fontFamily:row.bold?'var(--font-cond)':'var(--font)', maxWidth:'55%', textAlign:'right', wordBreak:'break-word' }}>
                      {row.value}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Visibility</label>
              <select className="form-input" value={visibility} onChange={e => setVis(e.target.value)}>
                <option value="public">🌍 Public</option>
                <option value="followers">👥 Followers</option>
                <option value="private">🔒 Private</option>
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <span className="form-label">Platform</span>
              <div style={{ fontSize:13, color:'var(--text-secondary)', background:'var(--bg-input)', borderRadius:'var(--radius)', padding:'9px 12px', border:'1px solid var(--border)' }}>
                {game.shortName}
              </div>
            </div>
          </div>

          <div style={{ background:'rgba(245,124,0,0.1)', border:'1px solid rgba(245,124,0,0.3)', borderRadius:'var(--radius)', padding:'10px 12px', marginBottom:14, fontSize:12, color:'var(--amber)' }}>
            ⚠️ <strong>${stakeNum.toFixed(2)}</strong> locked in escrow until settled. By creating this bet you agree to play the game and report results honestly.
          </div>

          <button className="btn btn-lg btn-full" onClick={submit} disabled={loading} style={{
            background:`linear-gradient(135deg,${game.gradient[0]},${game.gradient[1]})`,
            border:'none', color:'white', fontFamily:'var(--font-cond)', fontWeight:900, fontSize:16
          }}>
            {loading ? '⏳ Creating…' : `🎮 Post Bet — Stake $${stakeNum.toFixed(2)}`}
          </button>
        </>
      )}
    </Modal>
  );
}

// ── Direct Challenge Modal ───────────────────────────────────────────────────
function ChallengePlayerModal({ game, balance, onClose }) {
  const [targetUser, setTarget] = useState('');
  const [desc, setDesc]         = useState('');
  const [stake, setStake]       = useState('');
  const [odds, setOdds]         = useState('2.00');
  const [loading, setLoading]   = useState(false);

  const stakeNum   = parseFloat(stake) || 0;
  const oddsNum    = parseFloat(odds)  || 0;
  const netPayout  = stakeNum * oddsNum * 0.90;

  const submit = async () => {
    setLoading(true);
    try {
      await api.post(`/games/${game.id}/challenge`, {
        targetUsername: targetUser, description: desc,
        stake: stakeNum, odds: oddsNum
      });
      toast.success(`⚔️ Challenge sent to @${targetUser}!`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Challenge failed');
    } finally { setLoading(false); }
  };

  return (
    <Modal title={`⚔️ Challenge a Player — ${game.shortName}`} onClose={onClose} width={480}>
      <div style={{
        display:'flex', gap:12, alignItems:'center', marginBottom:18, padding:12,
        background:`linear-gradient(135deg,${game.gradient[0]}15,${game.gradient[1]}15)`,
        borderRadius:'var(--radius)'
      }}>
        <div style={{ fontSize:32 }}>{game.icon}</div>
        <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 }}>
          Challenge any 50/50 Life player to a <strong>{game.shortName}</strong> bet. They'll get a notification and can accept or decline.
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Player Username</label>
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontSize:14 }}>@</span>
          <input className="form-input" style={{ paddingLeft:28 }} placeholder="kingbettor" value={targetUser} onChange={e => setTarget(e.target.value.replace('@',''))} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Challenge Description</label>
        <textarea className="form-input" rows={2} style={{ resize:'none' }}
          placeholder={`e.g. "1v1 ${game.shortName} match — first to 10 kills wins" or "I'll rank higher than you this week"`}
          value={desc} onChange={e => setDesc(e.target.value)} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div className="form-group">
          <label className="form-label">Your Stake ($)</label>
          <input className="form-input" type="number" min="1" value={stake} onChange={e => setStake(e.target.value)} placeholder="50" />
        </div>
        <div className="form-group">
          <label className="form-label">Odds</label>
          <input className="form-input" type="number" min="1.01" step="0.1" value={odds} onChange={e => setOdds(e.target.value)} />
        </div>
      </div>

      {stakeNum > 0 && (
        <div style={{ background:'var(--bg-hover)', borderRadius:'var(--radius)', padding:12, marginBottom:14, fontSize:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ color:'var(--text-muted)' }}>If you win (net after 10%)</span>
            <span style={{ color:'var(--green)', fontWeight:700 }}>+${netPayout.toFixed(2)}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ color:'var(--text-muted)' }}>If you lose</span>
            <span style={{ color:'var(--error)', fontWeight:700 }}>-${stakeNum.toFixed(2)}</span>
          </div>
        </div>
      )}

      <button className="btn btn-lg btn-full" onClick={submit}
        disabled={loading || !targetUser || !desc || !stake}
        style={{ background:`linear-gradient(135deg,${game.gradient[0]},${game.gradient[1]})`, border:'none', color:'white', fontFamily:'var(--font-cond)', fontWeight:900 }}>
        {loading ? 'Sending…' : `⚔️ Send Challenge to @${targetUser || '?'}`}
      </button>
    </Modal>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function betTypeBtn(active, color) {
  return {
    padding:'5px 14px', borderRadius:20, border:`1px solid ${active?color:'var(--border)'}`,
    background: active ? `${color}22` : 'transparent',
    color: active ? color : 'var(--text-muted)',
    fontWeight:700, fontSize:11, cursor:'pointer', flexShrink:0, whiteSpace:'nowrap', transition:'all 0.15s'
  };
}

function getMockBets(game) {
  return [
    { id:'gb1', type:'p2p', sport:`game:${game.id}`, eventName:`1v1 ${game.shortName} Challenge — $50 stake`, selection:'Player1 wins', odds:2.0, stake:50, status:'open', creator:{username:'kingbettor'}, commissionAmount:10, netPayout:90, visibility:'public' },
    { id:'gb2', type:'p2p', sport:`game:${game.id}`, eventName:`${game.shortName} — Top placement bet`, selection:'Top 3 finish guaranteed', odds:1.85, stake:25, status:'matched', creator:{username:'pro_gamer99'}, commissionAmount:4.625, netPayout:41.625, visibility:'public' },
    { id:'gb3', type:'p2p', sport:`game:${game.id}`, eventName:`${game.shortName} Kill Count Over/Under`, selection:'Over 8 kills', odds:1.70, stake:100, status:'open', creator:{username:'sharp_shooter'}, commissionAmount:17, netPayout:153, visibility:'public' },
  ];
}

function getMockLeaderboard(gameId) {
  return [
    { username:'kingbettor',   wins:47, totalBets:78,  winRate:60, netProfit:2340 },
    { username:'pro_gamer99',  wins:38, totalBets:65,  winRate:58, netProfit:1870 },
    { username:'sharp_shooter',wins:31, totalBets:52,  winRate:60, netProfit:1540 },
    { username:'lucky_ace',    wins:29, totalBets:56,  winRate:52, netProfit:1120 },
    { username:'esports_king', wins:22, totalBets:41,  winRate:54, netProfit:890  },
    { username:'game_master',  wins:19, totalBets:38,  winRate:50, netProfit:650  },
  ];
}

function getMockCommunityPosts(game) {
  return [
    { id:1, username:'kingbettor', content:`Just hit a 5-match winning streak in ${game.shortName}! Who wants to challenge me? 🎮 I'll put $100 on my next 3 games 💰`, likes:34, comments:12, time:'2h ago', hasBet:true },
    { id:2, username:'pro_gamer99', content:`${game.shortName} meta has shifted so much this season. The current top players are completely different from last month. Anyone tracking this for bets?`, likes:21, comments:8, time:'5h ago', hasBet:false },
    { id:3, username:'lucky_ace',   content:`Lost a $50 bet on ${game.shortName} yesterday 😢 GG to @sharp_shooter though, clean win. Rematch when? 👀`, likes:18, comments:15, time:'1d ago', hasBet:true },
    { id:4, username:'esports_king',content:`Tip for betting on ${game.shortName}: always check recent form, not just overall stats. Last 10 games matters more than career average for live bets 📊`, likes:56, comments:22, time:'2d ago', hasBet:false },
  ];
}
