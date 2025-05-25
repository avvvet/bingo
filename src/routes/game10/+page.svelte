<script>
  // @ts-nocheck
  import { onMount, onDestroy } from 'svelte';
  import { player, game, gamePlayers, playerCard } from '../../store';
  import { initSocket, socketMessage, socketConnected, gsocket } from '$lib/socket';
  import { goto } from '$app/navigation';

  const cards = Array.from({ length: 100 }, (_, i) => i + 1);
  const startInMinutes = 0.5; // 30 seconds

  let showTooltip = false;

  onMount(() => {
    getWaitGame();
    // show tooltip for 3 seconds
    showTooltip = true;
    const timer = setTimeout(() => (showTooltip = false), 3000);
    return () => clearTimeout(timer);
  });

  const getWaitGame = () => {
    const payload = {
      type: 'get-wait-game',
      data: { user_id: $player.user_id, gtype: 1},
    };
    if ($gsocket?.readyState === WebSocket.OPEN) {
      $gsocket.send(JSON.stringify(payload));
    }
  };

  $: if ($socketMessage) {
    const data = JSON.parse($socketMessage);
    handleSocketData(data);
  }

  function handleSocketData(msg) {
    if (msg.type == 'get-wait-game-response') {
      let d = msg.data;
      game.set({
        gameId:     d.game.id, 
        gameNumber: d.game.game_no,
        noPlayers:  getPlayerCount(d.players),
        jackpot:    800
      });
      gamePlayers.set(d.players);
    }
    else if (msg.type === 'get-wait-game-response-broadcast') {
      let d = msg.data;
      console.log("yelowwwwwwwwwwwwwwwww", d)
      gamePlayers.set(d.players);
    }
    else if (msg.type === 'player-select-card-response') {
      let d = msg.data;
      console.log("card selected ", d)
      playerCard.set(d);
    }
    else if (msg.type === 'game-started') {
      goto('/play10', { replaceState: false, noscroll: false, keepfocus: false });
    }
  }

  const getPlayerCount = (players) => (Array.isArray(players) ? players.length : 0);

  function isCardHighlighted(card) {
    if ($gamePlayers == null) return false;
    return $gamePlayers.some(p => parseInt(p.card_sn) === card);
  }

  function handleCardClick(card) {
    if (!isCardHighlighted(card)) {
      selectCard(card);
    }
  }

  const selectCard = sn => {
    const payload = {
      type: 'player-select-card',
      data: {
        user_id:  $player.user_id,
        game_id:  $game.gameId,
        card_sn:  sn.toString(),
        gtype:    1
      }
    };
    if ($gsocket?.readyState === WebSocket.OPEN) {
      $gsocket.send(JSON.stringify(payload));
    }
  };

  // Bingo reactive grid
  let numbers = [], grid = [];
  const headerLetters = ['B','I','N','G','O'];

  $: if ($playerCard) {
    numbers = $playerCard.data.split(',').map(s => s.trim()).filter(Boolean).map(n => +n);
    if (numbers.length === 25) {
      grid = [];
      for (let r = 0; r < 5; r++) {
        grid.push(numbers.slice(r*5, r*5 + 5));
      }
    } else {
      grid = [];
    }
  }

  $: serial = $playerCard ? $playerCard.card_sn : '';

  // countdown
  let countdown = startInMinutes * 60, interval;
  function startCountdown() {
    clearInterval(interval);
    interval = setInterval(() => { if (countdown>0) countdown--; }, 1000);
  }
  function stopCountdown() { clearInterval(interval); }
  $: if (grid.length) startCountdown(); else stopCountdown();
  onDestroy(stopCountdown);

  $: minutes = String(Math.floor(countdown/60)).padStart(2,'0');
  $: seconds = String(countdown%60).padStart(2,'0');
</script>

<div class="min-h-screen bg-gradient-to-br from-orange-300 via-pink-300 to-red-300 p-4">
  <div class="max-w-md mx-auto">

    <!-- Header Stats - Single Row with Medium Height -->
    <div class="grid grid-cols-3 gap-2 mb-6">
      <!-- Game Number -->
      <div class="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-600">
        <div class="text-xs text-gray-300 font-medium">Game</div>
        <div class="text-lg font-bold text-white">{$game.gameNumber}</div>
      </div>

      <!-- Players -->
      <div class="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-600">
        <div class="text-xs text-gray-300 font-medium">Players</div>
        <div class="text-lg font-bold text-white">{ $gamePlayers?.players?.length ?? 0 }</div>
      </div>

      <!-- Jackpot -->
      <div class="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-600">
        <div class="text-xs text-gray-300 font-medium">BIRR</div>
        <div class="text-lg font-bold text-white">{($gamePlayers?.players?.length ?? 0) * 10}</div>
      </div>
    </div>



    <!-- Number Selection Grid - Square Cards -->
    <div class="bg-white rounded-2xl p-4 shadow-xl mb-6 border border-gray-200">
      <h3 class="text-lg font-bold text-gray-800 mb-4 text-center">
        {#if grid.length}
          Game starting in {countdown} seconds...
        {:else}
          Select Your Number
        {/if}
      </h3>
      <div class="grid grid-cols-10 gap-1">
        {#each cards as card}
          <button
            on:click={() => handleCardClick(card)}
            class="aspect-square flex items-center justify-center text-sm font-semibold rounded-lg transition-all duration-200 border-2
                   {isCardHighlighted(card)
                     ? 'bg-red-500 text-white shadow-lg transform scale-105 ring-2 ring-red-300 border-red-400'
                     : 'bg-white text-gray-800 hover:bg-gray-100 hover:shadow-md active:scale-95 border-gray-300 shadow-sm'}"
          >
            {card}
          </button>
        {/each}
      </div>
    </div>

    <!-- Bingo Card Display -->
    {#if grid.length}
      <div class="grid grid-cols-5 gap-1 max-w-52 mx-auto shadow-2xl rounded-lg p-2 bg-white">
        <!-- BINGO Headers -->
        {#each headerLetters as letter, i}
          <div class="w-9 h-9 flex items-center justify-center text-sm font-bold text-white rounded
                     {i === 0 ? 'bg-red-500' : 
                      i === 1 ? 'bg-yellow-500' : 
                      i === 2 ? 'bg-green-500' : 
                      i === 3 ? 'bg-blue-500' : 'bg-purple-500'}">
            {letter}
          </div>
        {/each}
        
        <!-- Number Grid -->
        {#each grid as row}
          {#each row as num}
            <div class="w-9 h-9 flex items-center justify-center text-sm font-semibold bg-gray-50 border border-gray-300 rounded">
              {num}
            </div>
          {/each}
        {/each}
      </div>
    {/if}

  </div>
</div>