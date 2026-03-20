import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import api from '../services/api';

export default function BetDetail() {
  var params = useParams();
  var id = params.id;
  var navigate = useNavigate();
  var user = useSelector(selectUser);
  var stateArr = useState(null);
  var bet = stateArr[0];
  var setBet = stateArr[1];
  var loadArr = useState(true);
  var loading = loadArr[0];
  var setLoading = loadArr[1];

  useEffect(function() {
    api.get('/bets/' + id)
      .then(function(r) { setBet(r.data.data.bet); })
      .catch(function() { setBet(getMockBet(id)); })
      .finally(function() { setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner lg" />
      </div>
    );
  }

  if (!bet) {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
        <h2>Bet not found</h2>
        <button
          className="btn btn-blue"
          onClick={function() { navigate('/betting'); }}
          style={{ marginTop: 16 }}
        >
          Back to Betting
        </button>
      </div>
    );
  }

  var isOwn = user && user.id === bet.creatorId;
  var canAccept = bet.status === 'open' && !isOwn;
  var stake = parseFloat(bet.stake);
  var odds = parseFloat(bet.odds);
  var grossPayout = stake * odds;
  var commission = grossPayout * 0.10;
  var netPayout = grossPayout - commission;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 80px' }}>
      <div style={{ padding: '16px 16px 0' }}>

        <button
          onClick={function() { navigate(-1); }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 14,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          Back
        </button>

        <div style={{
          background: 'linear-gradient(135deg, #1a0000, #000d33)',
          borderRadius: 'var(--radius-xl)',
          padding: 20,
          marginBottom: 16,
          border: '1px solid var(--border)'
        }}>
          <div style={{
            fontFamily: 'var(--font-cond)',
            fontWeight: 900,
            fontSize: 22,
            marginBottom: 6
          }}>
            {bet.eventName}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {bet.sport} — {bet.market || 'Match Winner'}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 12,
          alignItems: 'center',
          marginBottom: 16
        }}>
          <div style={{
            background: 'var(--red-muted)',
            border: '1px solid rgba(204,0,0,0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: 16,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              fontWeight: 700,
              marginBottom: 4
            }}>
              THEIR PICK
            </div>
            <div style={{ fontWeight: 800, color: 'var(--red)', fontSize: 14 }}>
              {bet.selection}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-cond)',
              fontWeight: 900,
              fontSize: 30,
              color: 'var(--amber)'
            }}>
              {odds.toFixed(2)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ODDS</div>
          </div>

          <div style={{
            background: 'var(--blue-muted)',
            border: '1px solid rgba(0,51,204,0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: 16,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              fontWeight: 700,
              marginBottom: 4
            }}>
              OTHER SIDE
            </div>
            <div style={{ fontWeight: 800, color: 'var(--blue-light)', fontSize: 14 }}>
              {bet.status === 'matched' ? 'Matched' : 'Open'}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{
            fontFamily: 'var(--font-cond)',
            fontWeight: 900,
            fontSize: 15,
            marginBottom: 12
          }}>
            PAYOUT BREAKDOWN
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <BetRow label="Stake" value={'$' + stake.toFixed(2)} />
            <BetRow label="Gross Payout" value={'$' + grossPayout.toFixed(2)} />
            <BetRow
              label="50/50 Life Commission (10%)"
              value={'-$' + commission.toFixed(2)}
              color="var(--error)"
            />
            <BetRow
              label="Net Payout"
              value={'$' + netPayout.toFixed(2)}
              color="var(--green)"
              bold={true}
            />
          </div>
        </div>

        {canAccept && (
          <button className="btn btn-split btn-full btn-lg">
            Accept This Bet
          </button>
        )}

      </div>
    </div>
  );
}

function BetRow(props) {
  var label = props.label;
  var value = props.value;
  var color = props.color;
  var bold = props.bold;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      paddingBottom: 8,
      borderBottom: '1px solid var(--border)'
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <span style={{
        fontWeight: bold ? 900 : 700,
        fontSize: bold ? 16 : 13,
        color: color || 'var(--text-primary)',
        fontFamily: bold ? 'var(--font-cond)' : 'var(--font)'
      }}>
        {value}
      </span>
    </div>
  );
}

function getMockBet(id) {
  return {
    id: id,
    sport: 'football',
    eventName: 'Man City vs Arsenal',
    selection: 'Man City Win',
    odds: 1.85,
    stake: 50,
    status: 'open',
    result: null,
    creatorId: 'other',
    market: 'Match Winner'
  };
}
