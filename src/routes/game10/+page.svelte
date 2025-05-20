<script>
  // @ts-nocheck
  import { onMount, onDestroy } from 'svelte';
  import { player, game, gamePlayers, playerCard } from '../../store';
  import { initSocket, socketMessage, socketConnected, gsocket } from '$lib/socket';
  import { goto } from '$app/navigation';

  const cards = Array.from({ length: 100 }, (_, i) => i + 1);
  const startInMinutes = 3;

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
      data: { user_id: $player.user_id, gtype: 1 },
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
    if (msg.type == 'get-wait-game-response' || msg.type == 'get-wait-game-response-broadcast') {
      let d = msg.data;
      game.set({
        gameId:     d.game.id,
        gameNumber: d.game.game_no,
        noPlayers:  getPlayerCount(d.players),
        jackpot:    800
      });
      gamePlayers.set(d.players);
    }
    else if (msg.type === 'player-select-card-response') {
      let d = msg.data;
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
  const headerColors  = ['bg-red-500','bg-yellow-500','bg-green-500','bg-blue-500','bg-purple-500'];

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

  // derive a short serial from the first 8 chars of the card data
  //$: serial = $playerCard ? $playerCard.replace(/,/g, '').slice(0, 8).toUpperCase() : '';
  
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

<div class="min-h-screen bg-blue-100 p-4 flex justify-center">
  <div class="w-[360px] relative">


    <!-- Top Section: Dynamic Game Stat Cards (Smaller) -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <!-- Game Number Card -->
      <div class="flex flex-col items-center bg-gradient-to-br from-yellow-400 to-orange-500 p-3 rounded-lg shadow-md transform hover:scale-105 transition">
        <div class="bg-white p-1.5 rounded-full mb-1 shadow-sm">
          <span class="text-xl">🔵</span>
        </div>
        <div class="text-xs uppercase tracking-wide text-white">Game Number</div>
        <div class="text-2xl font-bold text-white">{$game.gameNumber}</div>
      </div>

      <!-- Players Card -->
      <div class="flex flex-col items-center bg-gradient-to-br from-blue-400 to-purple-500 p-3 rounded-lg shadow-md transform hover:scale-105 transition">
        <div class="bg-white p-1.5 rounded-full mb-1 shadow-sm">
          <span class="text-xl">👤</span>
        </div>
        <div class="text-xs uppercase tracking-wide text-white">Players</div>
        <div class="text-2xl font-bold text-white">{$game.noPlayers}</div>
      </div>

      <!-- Jackpot Card -->
      <div class="flex flex-col items-center bg-gradient-to-br from-green-400 to-teal-500 p-3 rounded-lg shadow-md transform hover:scale-105 transition">
        <div class="bg-white p-1.5 rounded-full mb-1 shadow-sm">
          <span class="text-xl">💰</span>
        </div>
        <div class="text-xs uppercase tracking-wide text-white">Win</div>
        <div class="text-2xl font-bold text-white">{$game.jackpot}</div>
      </div>

      <!-- Timer Card -->
      <div class="flex flex-col items-center bg-gradient-to-br from-red-400 to-pink-500 p-3 rounded-lg shadow-md transform hover:scale-105 transition">
        <div class="bg-white p-1.5 rounded-full mb-1 shadow-sm">
          <span class="text-xl">⏱️</span>
        </div>
        <div class="text-xs uppercase tracking-wide text-white">Starts In</div>
        <div class="text-2xl font-bold text-white">{minutes}:{seconds}</div>
      </div>
    </div>


    <!-- Cards Section with Pulsing Effect & Tooltip -->
    <div class="relative mb-auto">
      {#if showTooltip}
        <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-300 text-black rounded-full px-3 py-1 text-sm font-semibold animate-pulse">
          Tap a Bingo chip to select!
        </div>
      {/if}
      <div class="grid grid-cols-10 gap-2 justify-center animate-pulse">
        {#each cards as card}
          <button
            on:click={() => handleCardClick(card)}
            class={`relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                    transition-transform duration-200
                    ${isCardHighlighted(card)
                      ? 'bg-red-500 ring-4 ring-red-300 shadow-lg scale-110'
                      : 'bg-gray-300 hover:bg-gray-400 hover:scale-105'}`}
          >
            <span class="absolute inset-0 rounded-full bg-gradient-to-br from-white to-transparent opacity-20"></span>
            <span class="z-10">{card}</span>
          </button>
        {/each}
      </div>
    </div>

<!-- ✨ UPDATED Bingo Card + Waiting Modal -->
{#if grid.length}
  <div class="fixed inset-0 bg-transparent flex items-end justify-center pb-6 z-50">
    <div class="bg-white bg-opacity-90 rounded-2xl shadow-2xl p-6 text-center w-[320px] border-4 border-yellow-400">
      <div class="text-sm text-gray-600 mb-2">Card # : {serial}</div>
      <div class="text-2xl font-extrabold mb-4">Game starts in {minutes}:{seconds}</div>
      <div class="border-2 border-gray-800 rounded-lg p-2 mb-4 bg-white bg-opacity-80">
        <div class="grid grid-cols-5 gap-2 justify-center">
          {#each headerLetters as letter,i}
            <div class={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white ${headerColors[i]}`}>{letter}</div>
          {/each}
          {#each grid as row}
            {#each row as num}
              <div class="w-10 h-10 rounded-full bg-white bg-opacity-80 border-2 border-gray-400 flex items-center justify-center font-semibold text-gray-800">{num}</div>
            {/each}
          {/each}
        </div>
      </div>
      <div class="text-gray-700 font-medium">Please wait for the game to begin...</div>
    </div>
  </div>
{/if}

  </div>
</div>
