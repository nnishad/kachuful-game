# Kachuful / Judgement Card Game — Complete Rules, Algorithm, and Real-Life Scenarios

## 1. Overview
Kachuful (also spelled Kachufool, Kachufol) is a trick‑taking bidding game similar to Oh Hell. Players predict how many tricks they will win, score only if they match their bid, and play rounds with varying hand sizes.

---

## 2. Core Rules

### 2.1 Players and Deck
- 3–7 players.
- Standard 52‑card deck.
- No jokers unless table rules specify.

### 2.2 Round Structure
- Rounds progress using a predefined **hand size sequence** (e.g., 8→1→8).
- Dealer rotates each round.
- Trump suit rotates per round or is selected by rule.

### 2.3 Dealing
- Shuffle thoroughly.
- Deal `handSize` cards to each player.
- All players must have equal cards.

### 2.4 Bidding
- Each player declares how many tricks they will win.
- Bidding can be:
  - **Simultaneous** (finger show), or
  - **Sequential** (clockwise).
- Optional rule: **last player cannot bid a number that would make the total bids equal total tricks**.

### 2.5 Trick Play
- Player left of dealer leads first.
- Players must follow the **led suit** if possible.
- If a player cannot follow suit, any card may be played.
- Trick resolution:
  - Highest trump wins.
  - If no trump is played, highest card of the led suit wins.
- Trick winner leads the next trick.

### 2.6 Scoring
Common scoring model:
- **Exact bid hit:** `10 + bid` points.
- **Missed bid:** `0`.

Alternative models:
- **Penalty:** miss → negative penalty based on deviation.
- **Multiplier:** hit → `bid × multiplier`.

---

## 3. Formal Game Model (Data Structures)
```
Game {
  players: [Player],
  deck: Deck(52),
  dealerIndex: int,
  roundNumber: int,
  handSize: int,
  trump: Suit | null,
  bids: Map<PlayerId, int>,
  tricksWon: Map<PlayerId, int>,
  scores: Map<PlayerId, int>,
  state: ENUM{DEAL,BIDDING,PLAYING,SCORING,ROUND_END,GAME_END}
}

Player {
  id, name,
  hand: [Card],
  connected: bool,
  timeoutCount: int
}
```

---

## 4. High‑Level Algorithm

### 4.1 Game Loop
1. Initialize players, scores = 0.
2. Determine dealer and hand sequence.
3. For each round:
   - Shuffle and deal.
   - Determine trump.
   - Collect bids.
   - Play tricks.
   - Score the round.
   - Advance dealer.
4. End when sequence complete.

### 4.2 Trick Algorithm (deterministic)
```
leadPlayer = left of dealer
for t in 1..handSize:
  trick = []
  for each player in turn order starting at lead:
    enforce follow-suit
    card = player selects card
    trick.add(player, card)

  winner = resolveTrick(trick, trump)
  tricksWon[winner]++
  lead = winner
```

### 4.3 Trick Resolution
```
if any card.suit == trump:
  winner = highest trump
else:
  winner = highest card of led suit
```

---

## 5. Bidding and Scoring Logic

### 5.1 Bidding Constraints
- If last-player restriction enabled:
  - If sum(previous bids) + lastBid == handSize → **reject bid**.

### 5.2 Scoring Functions
```
Standard:
  if won == bid: 10 + bid
  else: 0

Penalty:
  if won == bid: 10 + bid
  else: -abs(won - bid) * penaltyFactor

Multiplier:
  if won == bid: bid * multiplier
  else: 0
```

---

## 6. Pseudocode (Full Round)
```
function playRound(players, dealer, handSize, scoringModel):
  deck.shuffle()
  dealHands(players, handSize)
  trump = selectTrump()

  bids = collectBids(players)
  tricksWon = zeroMap(players)

  lead = (dealer + 1) % playerCount

  for trick in 1..handSize:
    trickCards = []
    for offset in 0..playerCount-1:
      p = players[(lead + offset) % playerCount]
      card = getValidPlay(p, trickCards)
      trickCards.add(p, card)

    winner = resolveTrick(trickCards, trump)
    tricksWon[winner]++
    lead = indexOf(winner)

  applyScoring(players, bids, tricksWon, scoringModel)
```

---

## 7. Real‑Life Scenarios and Required Handling

### 7.1 Misdeal
- Detected before first trick → redeal entire round.
- Track repeated misdeals by dealer.

### 7.2 Insufficient Cards
- Validate handSize against playerCount.
- Automatically adjust or use multi-deck.

### 7.3 Disconnection During Bidding
- Timeout → auto-bid (usually 0 or random valid).

### 7.4 Disconnection During Trick
- Auto-play a legal card.
- Maintain deterministic fallback.

### 7.5 Illegal Play (Not Following Suit)
- Reject client action.
- Server enforces rule: force legal play.

### 7.6 Cheating Detection
- Log every action.
- Provide replay system.

### 7.7 Scorekeeper Error (Physical Play)
- Recompute from event log.
- Require confirmation before edits.

### 7.8 Tie at Game End
Tie-break methods:
- Highest single-round score.
- Head-to-head score.
- Extra sudden-death round.

### 7.9 Player Stalling
- Strict move timers.
- After repeated violations → auto-play or eject.

### 7.10 Jokers Used
- Declare their function explicitly.
- Must apply consistently.

### 7.11 Server Crash
- Persist state after every trick.
- On restart, resume from last checkpoint.

---

## 8. Network & Implementation Requirements
- Secure RNG.
- Server authoritative state.
- Immutable event log for full replay.
- Optimistic concurrency for client submissions.
- Unit tests for:
  - Bidding constraints,
  - Follow-suit validation,
  - Trick resolution,
  - Disconnect logic,
  - Scoring.

---

## 9. Configuration Options (Table Creation)
- Number of players.
- Hand-size sequence.
- Scoring model.
- Bid style (simultaneous/sequential).
- Last-player restriction.
- Trump rotation rule.
- Timeout rules.
- Auto-play policy.
- Joker rules.
- Tie-break rule.

---

## 10. Complete Testing Checklist
- Deal correctness.
- Bidding restriction validation.
- Illegal play rejection.
- Correct trick winner resolution.
- Scoring model consistency.
- Disconnect recovery.
- Misdeal handling.
- Replay log correctness.

---

This document provides full rules, algorithms, variants, and edge-case handling required for implementing a complete Kachuful game engine.

