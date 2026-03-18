import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWallet, initiateDeposit, initiateWithdrawal, transferFunds } from '../store/slices/walletSlice';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Clock, CheckCircle, XCircle, TrendingUp, Shield } from 'lucide-react';
import { Modal } from '../components/Common/NotificationPanel';
import toast from 'react-hot-toast';

const TX_ICONS = {
  deposit:          { icon: ArrowDownLeft, color: 'var(--green)' },
  withdrawal:       { icon: ArrowUpRight,  color: 'var(--red)' },
  bet_stake:        { icon: '🎯',           color: 'var(--amber)' },
  bet_win:          { icon: '🏆',           color: 'var(--green)' },
  bet_refund:       { icon: '↩️',           color: 'var(--blue-light)' },
  bet_commission:   { icon: Shield,         color: 'var(--text-muted)' },
  p2p_transfer_in:  { icon: ArrowDownLeft, color: 'var(--green)' },
  p2p_transfer_out: { icon: ArrowUpRight,  color: 'var(--red)' },
  bonus:            { icon: '🎁',           color: 'var(--amber)' },
};

export default function Wallet() {
  const dispatch = useDispatch();
  const { balance, escrowBalance, stats, transactions, loading } = useSelector(s => s.wallet);
  const [activeModal, setModal] = useState(null); // 'deposit' | 'withdraw' | 'transfer'
  const [txFilter, setTxFilter] = useState('all');

  useEffect(() => { dispatch(fetchWallet()); }, [dispatch]);

  const txs   = transactions.length > 0 ? transactions : getMockTransactions();
  const filtTx = txFilter === 'all' ? txs : txs.filter(t => t.type.includes(txFilter));

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 80px' }}>

      {/* Header */}
      <div style={{ padding: '20px 16px 0' }}>
        <h1 style={{ fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 26, marginBottom: 20 }}>
          💰 MY WALLET
        </h1>

        {/* Balance card */}
        <div style={{
          background: 'linear-gradient(135deg, #1a0000 0%, #000d33 100%)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
          padding: '28px 24px', marginBottom: 20, position: 'relative', overflow: 'hidden'
        }}>
          {/* Decorative split line */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', bottom: 0, width: 2,
            background: 'linear-gradient(180deg,var(--red),var(--blue))', opacity: 0.3
          }} />
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.08em', fontWeight: 700 }}>
            AVAILABLE BALANCE
          </div>
          <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 52, lineHeight: 1 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 28 }}>$</span>
            {parseFloat(balance || 0).toFixed(2)}
          </div>
          {escrowBalance > 0 && (
            <div style={{ fontSize: 12, color: 'var(--amber)', marginTop: 8 }}>
              + ${parseFloat(escrowBalance).toFixed(2)} in escrow (active bets)
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="btn btn-red" style={{ flex: 1 }} onClick={() => setModal('deposit')}>
              <ArrowDownLeft size={16} /> Deposit
            </button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModal('withdraw')}>
              <ArrowUpRight size={16} /> Withdraw
            </button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModal('transfer')}>
              <ArrowLeftRight size={16} /> Transfer
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total Deposited',   value: stats?.totalDeposited   || 0, color: 'var(--green)',      icon: '📥' },
            { label: 'Total Withdrawn',   value: stats?.totalWithdrawn   || 0, color: 'var(--red)',        icon: '📤' },
            { label: 'Total Wagered',     value: stats?.totalWagered     || 0, color: 'var(--amber)',      icon: '🎯' },
            { label: 'Total Won',         value: stats?.totalWon         || 0, color: 'var(--blue-light)', icon: '🏆' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.icon} {s.label.toUpperCase()}</div>
              <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 22, color: s.color }}>
                ${parseFloat(s.value).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Commission note */}
        <div style={{
          background:'linear-gradient(135deg,var(--red-muted),var(--blue-muted))',
          border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'12px 14px', marginBottom:20
        }}>
          <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:13, marginBottom:4 }}>💰 50/50 LIFE COMMISSION</div>
          <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>
            Platform commission: <strong style={{color:'var(--text-primary)'}}>10% of every winning payout</strong>.
            Commission paid: <strong style={{color:'var(--error)'}}>${parseFloat(stats?.totalCommissionPaid||0).toFixed(2)}</strong>.
            Withdrawn from gross payout automatically on settlement.
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 18 }}>Transaction History</h2>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {['all','deposit','withdrawal','bet','transfer'].map(f => (
            <button key={f} onClick={() => setTxFilter(f)} style={{
              padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)',
              background: txFilter === f ? 'var(--red)' : 'transparent',
              color: txFilter === f ? 'white' : 'var(--text-muted)',
              fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0
            }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>

        {loading && <div style={{ textAlign:'center', padding:40 }}><div className="spinner" /></div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtTx.map((tx, i) => <TxRow key={tx.id || i} tx={tx} />)}
          {filtTx.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
              No transactions yet
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'deposit'  && <DepositModal  onClose={() => setModal(null)} />}
      {activeModal === 'withdraw' && <WithdrawModal onClose={() => setModal(null)} />}
      {activeModal === 'transfer' && <TransferModal onClose={() => setModal(null)} />}
    </div>
  );
}

function TxRow({ tx }) {
  const info = TX_ICONS[tx.type] || { icon: '💳', color: 'var(--text-secondary)' };
  const isPositive = tx.amount > 0;
  const statusIcon = tx.status === 'completed' ? <CheckCircle size={12} style={{ color:'var(--green)' }} />
    : tx.status === 'failed' ? <XCircle size={12} style={{ color:'var(--error)' }} />
    : <Clock size={12} style={{ color:'var(--amber)' }} />;

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
      background:'var(--bg-card)', borderRadius:'var(--radius)', border:'1px solid var(--border)'
    }}>
      <div style={{
        width:38, height:38, borderRadius:'50%', flexShrink:0, display:'flex',
        alignItems:'center', justifyContent:'center', fontSize:16,
        background: isPositive ? 'rgba(0,200,83,0.1)' : 'rgba(204,0,0,0.1)',
        border: `1px solid ${isPositive ? 'rgba(0,200,83,0.3)' : 'rgba(204,0,0,0.3)'}`,
        color: info.color
      }}>
        {typeof info.icon === 'string' ? info.icon : React.createElement(info.icon, { size: 16 })}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:13, textTransform:'capitalize' }}>
          {tx.type.replace(/_/g,' ')}
        </div>
        <div style={{ fontSize:11, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {tx.description || '—'}
        </div>
        <div style={{ fontSize:10, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
          {statusIcon} {tx.status} · {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ''}
        </div>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{
          fontFamily:'var(--font-cond)', fontWeight:900, fontSize:18,
          color: isPositive ? 'var(--green)' : 'var(--error)'
        }}>
          {isPositive ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
        </div>
        {tx.balanceAfter != null && (
          <div style={{ fontSize:10, color:'var(--text-muted)' }}>
            Bal: ${parseFloat(tx.balanceAfter).toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
}

function DepositModal({ onClose }) {
  const dispatch = useDispatch();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const presets = [10, 25, 50, 100, 200, 500];

  const submit = async () => {
    setLoading(true);
    try {
      // In production: integrate Stripe Elements here
      await new Promise(r => setTimeout(r, 1500));
      toast.success(`$${amount} deposit initiated!`);
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <Modal title="💰 Deposit Funds" onClose={onClose}>
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {presets.map(p => (
          <button key={p} onClick={() => setAmount(String(p))} className="btn btn-ghost btn-sm"
            style={{ borderColor: amount === String(p) ? 'var(--red)' : 'var(--border)' }}>
            ${p}
          </button>
        ))}
      </div>
      <div className="form-group">
        <label className="form-label">Amount ($)</label>
        <input className="form-input" type="number" min="10" placeholder="Min $10" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Payment Method</label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            { key:'card',    label:'💳 Debit / Credit Card' },
            { key:'paypal',  label:'🅿️ PayPal' },
            { key:'skrill',  label:'💜 Skrill' },
            { key:'neteller',label:'🟠 Neteller' },
          ].map(m => (
            <button key={m.key} onClick={() => setMethod(m.key)} style={{
              padding:'10px', borderRadius:'var(--radius)', cursor:'pointer', fontSize:13, fontWeight:700,
              background: method === m.key ? 'var(--red-muted)' : 'var(--bg-input)',
              border:`2px solid ${method === m.key ? 'var(--red)' : 'var(--border)'}`,
            }}>{m.label}</button>
          ))}
        </div>
      </div>
      <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:16 }}>
        Funds appear instantly. Min deposit $10. Max $50,000. Your details are secured by Stripe PCI-DSS compliance.
      </div>
      <button className="btn btn-red btn-full btn-lg" onClick={submit} disabled={loading || !amount || amount < 10}>
        {loading ? 'Processing…' : `Deposit $${amount || '0'}`}
      </button>
    </Modal>
  );
}

function WithdrawModal({ onClose }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank');
  const [loading, setLoading] = useState(false);

  return (
    <Modal title="📤 Withdraw Funds" onClose={onClose}>
      <div className="form-group">
        <label className="form-label">Amount ($)</label>
        <input className="form-input" type="number" min="10" max="5000" placeholder="Min $10, Max $5,000/day" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Withdrawal Method</label>
        <select className="form-input" value={method} onChange={e => setMethod(e.target.value)}>
          <option value="bank">🏦 Bank Transfer</option>
          <option value="paypal">🅿️ PayPal</option>
          <option value="skrill">💜 Skrill</option>
          <option value="neteller">🟠 Neteller</option>
        </select>
      </div>
      <div style={{ background:'var(--bg-hover)', borderRadius:'var(--radius)', padding:'12px', marginBottom:16, fontSize:12, color:'var(--text-secondary)' }}>
        <div>⏱️ Processing: 1–3 business days</div>
        <div>💸 Fee: Free for first 2 withdrawals/month, $1.00 after</div>
        <div>📋 KYC required for withdrawals over $500</div>
      </div>
      <button className="btn btn-red btn-full btn-lg" disabled={loading || !amount || amount < 10}
        onClick={() => { toast.success('Withdrawal request submitted!'); onClose(); }}>
        {loading ? 'Processing…' : `Withdraw $${amount || '0'}`}
      </button>
    </Modal>
  );
}

function TransferModal({ onClose }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount]       = useState('');
  const [note, setNote]           = useState('');
  const [loading, setLoading]     = useState(false);
  const dispatch = useDispatch();

  const submit = async () => {
    setLoading(true);
    try {
      const result = await dispatch(transferFunds({ recipientUsername: recipient, amount: parseFloat(amount), note }));
      if (transferFunds.fulfilled.match(result)) {
        toast.success(`$${amount} sent to @${recipient}!`);
        onClose();
      } else {
        toast.error(result.payload || 'Transfer failed');
      }
    } finally { setLoading(false); }
  };

  return (
    <Modal title="↔️ Send Funds" onClose={onClose}>
      <div className="form-group">
        <label className="form-label">Recipient Username</label>
        <input className="form-input" placeholder="@username" value={recipient} onChange={e => setRecipient(e.target.value.replace('@',''))} />
      </div>
      <div className="form-group">
        <label className="form-label">Amount ($)</label>
        <input className="form-input" type="number" min="1" max="1000" placeholder="Min $1, Max $1,000" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Note (optional)</label>
        <input className="form-input" placeholder="Settlement, payment, etc." value={note} onChange={e => setNote(e.target.value)} />
      </div>
      <button className="btn btn-blue btn-full btn-lg" onClick={submit}
        disabled={loading || !recipient || !amount || amount < 1}>
        {loading ? 'Sending…' : `Send $${amount || '0'} → @${recipient || '?'}`}
      </button>
    </Modal>
  );
}

function getMockTransactions() {
  return [
    { id:'1', type:'bet_win',  amount:171,   status:'completed', description:'Lakers vs Warriors — Over 224.5', balanceAfter:371,  createdAt:new Date() },
    { id:'2', type:'bet_commission', amount:-19, status:'completed', description:'50/50 Life commission (10%)', createdAt:new Date() },
    { id:'3', type:'bet_stake', amount:-100, status:'completed', description:'Lakers vs Warriors — Over 224.5', balanceAfter:200, createdAt:new Date() },
    { id:'4', type:'deposit',  amount:200,   status:'completed', description:'Card deposit',                   balanceAfter:300, createdAt:new Date() },
    { id:'5', type:'withdrawal',amount:-50,  status:'pending',   description:'Bank withdrawal',                balanceAfter:100, createdAt:new Date() },
    { id:'6', type:'p2p_transfer_in', amount:25, status:'completed', description:'Transfer from @lucky_ace', createdAt:new Date() },
  ];
}
