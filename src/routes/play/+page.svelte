<script>
  // @ts-nocheck
  import { onMount, onDestroy } from 'svelte';
  import { playerCard, player, game, gamePlayers, gameType } from '../../store';
  import { socketMessage, gsocket } from '$lib/socket';
  import { goto } from '$app/navigation';
  import UpUpGoLogo from '$lib/components/UpUpGoLogo.svelte';

  // Static Game Variables
  let gNum = null;
  $: gNum = $game.gameNumber;

  // Header letters
  const headerLetters = ['B','I','N','G','O'];

  // Called numbers
  let calledNumbers = [];
  let recentNumbers = [];
  let currentNumber = null;

  // Marks for interactive card - using array to store marked numbers
  let marks = Array(25).fill(0);
  let numbers = [], grid = [];

  // Winner modal state
  let showWinnerModal = false;
  let winnerData = null;

  // Button state for invalid BINGO feedback
  let bingoButtonState = 'normal'; // 'normal' or 'invalid'
  let bingoButtonTimeout;

  // Dynamic color themes based on gameType
  $: backgroundGradient = $gameType === 10 ? 'from-emerald-300 via-teal-300 to-cyan-300' :
                          $gameType === 20 ? 'from-blue-300 via-indigo-300 to-purple-300' :
                          $gameType === 40 ? 'from-purple-300 via-pink-300 to-rose-300' :
                          $gameType === 50 ? 'from-red-300 via-orange-300 to-amber-300' :
                          $gameType === 100 ? 'from-yellow-300 via-amber-300 to-orange-300' :
                          $gameType === 200 ? 'from-gray-700 via-gray-800 to-black' :
                          'from-orange-300 via-pink-300 to-red-300';

  // Dynamic header colors for BINGO letters
  $: headerColors = $gameType === 10 ? ['bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500'] :
                    $gameType === 20 ? ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-violet-500', 'bg-pink-500'] :
                    $gameType === 40 ? ['bg-purple-500', 'bg-violet-500', 'bg-pink-500', 'bg-rose-500', 'bg-red-500'] :
                    $gameType === 50 ? ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500'] :
                    $gameType === 100 ? ['bg-yellow-500', 'bg-amber-500', 'bg-orange-500', 'bg-red-500', 'bg-pink-500'] :
                    $gameType === 200 ? ['bg-gray-800', 'bg-gray-700', 'bg-gray-600', 'bg-gray-500', 'bg-gray-400'] :
                    ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500'];

  // Dynamic calling panel gradient
  $: callingPanelGradient = $gameType === 10 ? 'from-emerald-200 to-teal-300' :
                            $gameType === 20 ? 'from-blue-200 to-indigo-300' :
                            $gameType === 40 ? 'from-purple-200 to-pink-300' :
                            $gameType === 50 ? 'from-red-200 to-orange-300' :
                            $gameType === 100 ? 'from-yellow-200 to-amber-300' :
                            $gameType === 200 ? 'from-gray-300 to-gray-400' :
                            'from-yellow-200 to-red-300';

  // Dynamic calling panel border
  $: callingPanelBorder = $gameType === 10 ? 'border-emerald-500' :
                          $gameType === 20 ? 'border-blue-500' :
                          $gameType === 40 ? 'border-purple-500' :
                          $gameType === 50 ? 'border-red-500' :
                          $gameType === 100 ? 'border-yellow-500' :
                          $gameType === 200 ? 'border-gray-600' :
                          'border-red-500';

  // Dynamic player card gradient
  $: playerCardGradient = $gameType === 10 ? 'from-emerald-200 to-emerald-400' :
                          $gameType === 20 ? 'from-blue-200 to-blue-400' :
                          $gameType === 40 ? 'from-purple-200 to-purple-400' :
                          $gameType === 50 ? 'from-red-200 to-red-400' :
                          $gameType === 100 ? 'from-yellow-200 to-yellow-400' :
                          $gameType === 200 ? 'from-gray-400 to-gray-500' :
                          'from-green-200 to-green-400';

  // Dynamic player card border
  $: playerCardBorder = $gameType === 10 ? 'border-emerald-500' :
                        $gameType === 20 ? 'border-blue-500' :
                        $gameType === 40 ? 'border-purple-500' :
                        $gameType === 50 ? 'border-red-500' :
                        $gameType === 100 ? 'border-yellow-500' :
                        $gameType === 200 ? 'border-gray-600' :
                        'border-green-500';

  // Dynamic BINGO button colors
  $: bingoButtonColors = $gameType === 10 ? 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700' :
                         $gameType === 20 ? 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' :
                         $gameType === 40 ? 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700' :
                         $gameType === 50 ? 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' :
                         $gameType === 100 ? 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' :
                         $gameType === 200 ? 'from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900' :
                         'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700';

  // Dynamic sync button colors
  $: syncButtonColors = $gameType === 10 ? 'bg-emerald-500 hover:bg-emerald-600' :
                        $gameType === 20 ? 'bg-blue-500 hover:bg-blue-600' :
                        $gameType === 40 ? 'bg-purple-500 hover:bg-purple-600' :
                        $gameType === 50 ? 'bg-red-500 hover:bg-red-600' :
                        $gameType === 100 ? 'bg-yellow-500 hover:bg-yellow-600' :
                        $gameType === 200 ? 'bg-gray-700 hover:bg-gray-800' :
                        'bg-blue-500 hover:bg-blue-600';

  // Dynamic winner modal gradient
  $: winnerModalGradient = $gameType === 10 ? 'from-emerald-200 via-teal-200 to-cyan-200' :
                           $gameType === 20 ? 'from-blue-200 via-indigo-200 to-purple-200' :
                           $gameType === 40 ? 'from-purple-200 via-pink-200 to-rose-200' :
                           $gameType === 50 ? 'from-red-200 via-orange-200 to-amber-200' :
                           $gameType === 100 ? 'from-yellow-200 via-amber-200 to-orange-200' :
                           $gameType === 200 ? 'from-gray-300 via-gray-400 to-gray-500' :
                           'from-yellow-200 via-orange-200 to-pink-200';

  // Simple Sync Function
  const syncGame = () => {
    // Reset local game state
    calledNumbers = [];
    recentNumbers = [];
    currentNumber = null;
    
    // Reset marks but preserve center FREE space
    marks = Array(25).fill(0);
    if (grid.length > 0 && grid[2] && grid[2][2]) {
      const centerNum = grid[2][2];
      marks[12] = centerNum;
    }
  };

  onMount(() => {
    // Check if we have required game data
    if (!$game || !$game.gameId || !$playerCard || !$gameType) {
      goto('/');
      return;
    }

    numbers = $playerCard.data.split(',').map(s => s.trim()).filter(Boolean).map(n => +n);
    if (numbers.length === 25) {
      grid = [];
      for (let r = 0; r < 5; r++) {
        grid.push(numbers.slice(r*5, r*5 + 5));
      }

      const centerNum = grid[2][2];
      marks[12] = centerNum;
    } else {
      grid = [];
    }
  });

  function claimBingo() {
    const payload = {
      type: 'claim-bingo',
      data: {
        gtype: $gameType,
        gameId: $game.gameId,   
        userId: $player.user_id,
        marks: [...marks]
      }
    };

    if ($gsocket && $gsocket.readyState === WebSocket.OPEN) {
      $gsocket.send(JSON.stringify(payload));
    }
  }

  // Function to show invalid BINGO feedback
  function showInvalidBingo() {
    // Clear any existing timeout
    if (bingoButtonTimeout) {
      clearTimeout(bingoButtonTimeout);
    }
    
    // Set button to invalid state
    bingoButtonState = 'invalid';
    
    // Reset to normal after 3 seconds
    bingoButtonTimeout = setTimeout(() => {
      bingoButtonState = 'normal';
    }, 3000);
  }

  function toggleMark(num, i, j) {
    const idx = j * 5 + i;
    const centerNumber = grid[2] && grid[2][2];
    const isCenter = num === centerNumber;
    
    if (isCenter && marks.includes(num)) {
      return;
    }
    
    const isNumberCalled = calledNumbersSet.has(num);
    
    if (!isCenter && !isNumberCalled) {
      return;
    }

    if (marks[idx] === 0) {
      marks[idx] = num;
    }
  }

  // Flash logic for draw panel
  let isFlashing = false;
  let flashTimeout;
  let previousCalledCount = 0;
  let calledNumbersSet = new Set();

  // Watch for changes in calledNumbers to trigger flash
  $: {
    if (calledNumbers.length > previousCalledCount) {
      triggerFlash();
      previousCalledCount = calledNumbers.length;
    }
    calledNumbersSet = new Set(calledNumbers.map(label => {
      const num = label.split('-')[1];
      return parseInt(num);
    }));
  }

  function triggerFlash() {
    isFlashing = true;
    
    if (flashTimeout) {
      clearTimeout(flashTimeout);
    }
    
    flashTimeout = setTimeout(() => {
      isFlashing = false;
    }, 1000);
  }

  function isNumberCalled(number) {
    return calledNumbersSet.has(number);
  }

  onDestroy(() => {
    if (flashTimeout) {
      clearTimeout(flashTimeout);
    }
    if (bingoButtonTimeout) {
      clearTimeout(bingoButtonTimeout);
    }
  });

  $: if ($socketMessage) {
    try {
      const data = JSON.parse($socketMessage);
      handleSocketData(data);
    } catch (error) {
      console.error('Error parsing socket message:', error);
    }
  }

  function getBingoLabel(n) {
    n = Number(n);
    if (n <= 15)   return `B-${n}`;
    if (n <= 30)   return `I-${n}`;
    if (n <= 45)   return `N-${n}`;
    if (n <= 60)   return `G-${n}`;
    return `O-${n}`;
  }

  function handleSocketData(msg) {
    if (msg.type === 'bingo-call') {
      const d = msg.data;
      
      if (d.game_id == $game.gameId) {
        calledNumbers = d.history.map(getBingoLabel);
        recentNumbers = calledNumbers.slice(-6);
        currentNumber = getBingoLabel(d.number);
      }
    }
    else if (msg.type === 'game-finished') {
      const d = msg.data;
      if (d.game_id == $game.gameId) {
        winnerData = d;
        showWinnerModal = true;
      }
    }
    else if (msg.type === 'bingo-claim-rejected') {
      const d = msg.data;
      showInvalidBingo();
    }
  }
    
  // Dynamic letter colors mapping based on game type
  $: letterColorsMap = {
    B: headerColors[0],
    I: headerColors[1],
    N: headerColors[2],
    G: headerColors[3],
    O: headerColors[4]
  };

  function letterOf(bingoLabel) {
    return bingoLabel.split('-')[0];
  }

  function closeWinnerModal() {
    goto('/');
  }

  function playAgain() {
    closeWinnerModal();
    goto('/game-type');
  }

  function getWinnerGrid(marks) {
    if (!marks || marks.length !== 25) return [];
    
    const grid = [];
    for (let row = 0; row < 5; row++) {
      const rowData = [];
      for (let col = 0; col < 5; col++) {
        const index = col * 5 + row;
        rowData.push(marks[index]);
      }
      grid.push(rowData);
    }
    return grid;
  }
</script>

<!-- Root container: flex column to stack header above content -->
<div class="min-h-screen bg-gradient-to-br {backgroundGradient} p-1 flex flex-col">

  <div class="mb-2 mt-2">
    <UpUpGoLogo size="sm" animated={true} variant="default" />
  </div>

  <!-- Bright game header with Sync Button -->
  <div class="w-full mb-2 flex justify-between gap-1">
    <!-- Game Number Box -->
    <div class="flex-1 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-2 shadow-md text-center border border-white/30">
      <div class="text-xs uppercase text-gray-500 font-semibold">Game #</div>
      <div class="mt-1 text-lg font-extrabold text-red-600">{gNum || '---'}</div>
    </div>
    <!-- Players Box -->
    <div class="flex-1 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-2 shadow-md text-center border border-white/30">
      <div class="text-xs uppercase text-gray-500 font-semibold">Players</div>
      <div class="mt-1 text-lg font-extrabold text-blue-600">{$gamePlayers?.length || 0}</div>
    </div>
    <!-- Jackpot Box -->
    <div class="flex-1 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-2 shadow-md text-center border border-white/30">
      <div class="text-xs uppercase text-gray-500 font-semibold">BIRR</div>
      <div class="mt-1 text-lg font-extrabold text-green-600">{($gamePlayers?.length || 0) * $gameType}</div>
    </div>
    <!-- Sync Button -->
    <button
      on:click={syncGame}
      class="{syncButtonColors} text-white rounded-lg p-2 shadow-md transition-all group min-w-[3rem]"
      aria-label="Sync game state"
      title="Reload game data"
    >
      <svg class="w-6 h-6 mx-auto group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
      </svg>
    </button>
  </div>

  <div class="flex-1 flex flex-col space-y-2">
    <!-- Panels Row -->
    <div class="flex-1 flex gap-1">

      <!-- Central Bingo Draw Panel -->
      <div class="flex-shrink-0 w-32 border-2 border-white rounded-xl p-1 bg-white bg-opacity-95 backdrop-blur-sm shadow-lg">
        <!-- Header Row -->
        <div class="grid grid-cols-5 gap-1 mb-1">
          {#each headerLetters as l, i}
            <div class={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${headerColors[i]}`}>{l}</div>
          {/each}
        </div>
        <!-- 15 Rows × 5 Columns -->
        <div class="grid grid-cols-5 gap-1">
          {#each Array(15) as _, rowIndex}
            {#each Array(5) as _, colIndex}
              {@const number = colIndex * 15 + rowIndex + 1}
              {@const isCalled = isNumberCalled(number)}
              {@const isLatestCall = currentNumber && parseInt(currentNumber.split('-')[1]) === number}
              <div class={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                isLatestCall 
                  ? 'bg-green-500 text-white animate-pulse shadow-lg border-2 border-yellow-400' 
                  : isCalled 
                    ? `${headerColors[Math.floor((number-1)/15)]} text-white shadow-md opacity-80` 
                    : 'bg-gray-200 text-gray-700'
              }`}>
                {number}
              </div>
            {/each}
          {/each}
        </div>
      </div>

      <!-- Player Side Panel -->
      <div class="flex-1 flex flex-col space-y-2 min-w-0">
        <!-- Number Calling Panel -->
        <div class="border-2 {callingPanelBorder} rounded-xl p-3 bg-gradient-to-r {callingPanelGradient} text-black text-center shadow-lg backdrop-blur-sm">
          <div class="text-xs text-gray-600 uppercase mb-2 font-semibold">Current Call</div>

          {#if currentNumber}
            <div
              class={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-xl font-extrabold text-white shadow-xl border-4 border-white transform hover:scale-105 transition-transform duration-200 ${
                letterColorsMap[letterOf(currentNumber)]
              }`}
            >
              {currentNumber}
            </div>
          {:else}
            <div class="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-sm font-bold bg-gray-300 text-gray-600 border-4 border-white">
              ...
            </div>
          {/if}

          <div class="flex justify-center space-x-1 mt-3 overflow-hidden">
            {#each recentNumbers as n}
              <div
                class={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md ${
                  letterColorsMap[letterOf(n)]
                }`}
              >
                {n}
              </div>
            {/each}
          </div>
        </div>

        <!-- Interactive 5x5 Player Card -->
        <div class="h-64 border-2 {playerCardBorder} rounded-xl p-2 bg-gradient-to-br {playerCardGradient} shadow-lg backdrop-blur-sm">
          <div class="text-center text-gray-900 font-bold mb-2 text-xs">Your Bingo Card # {$playerCard?.card_sn || '---'}</div>
          <div class="grid grid-cols-5 gap-1 mb-2">
            {#each headerLetters as l, i}
              <div class={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${headerColors[i]}`}>{l}</div>
            {/each}
          </div>
          <div class="grid grid-cols-5 gap-1">
            {#each grid as row, rowIndex}
              {#each row as num, colIndex}
                {@const isCenter = rowIndex === 2 && colIndex === 2}
                {@const isMarked = marks.includes(num)}
                {@const canMark = isCenter || calledNumbersSet.has(num)}
                <button
                  on:click={() => toggleMark(num, rowIndex, colIndex)}
                  class={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 select-none
                    ${isMarked 
                      ? (isCenter ? 'bg-black text-white shadow-lg border-2 border-yellow-400' : 'bg-black text-white shadow-lg') 
                      : 'bg-white text-gray-800 border-2 border-gray-300 hover:bg-gray-100 active:bg-gray-200 active:scale-95 touch-manipulation shadow-sm'
                    }`}
                >
                  {isCenter ? 'FREE' : num}
                </button>
              {/each}
            {/each}
          </div>
        </div>

        <!-- Bingo Button with State Change -->
        <div class="flex justify-center">
          <button 
            on:click={claimBingo} 
            disabled={bingoButtonState === 'invalid'}
            class={`w-32 font-bold py-2 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 text-sm ${
              bingoButtonState === 'invalid' 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white cursor-not-allowed' 
                : `bg-gradient-to-r ${bingoButtonColors} text-white`
            }`}
          >
            {bingoButtonState === 'invalid' ? '❌ Invalid BINGO!' : '🎉 BINGO! 🎉'}
          </button>
        </div>

        <!-- Current Players List -->
        <div class="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/30">
          <div class="text-center text-gray-700 font-semibold mb-3 text-sm">
            Current Players ({$gamePlayers?.length || 0})
          </div>
          
          {#if $gamePlayers && $gamePlayers.length > 0}
            <div class="flex flex-wrap gap-2 justify-center max-h-20 overflow-y-auto">
              {#each $gamePlayers as gamePlayer}
                <div class="flex items-center space-x-2 bg-gray-50 bg-opacity-90 backdrop-blur-sm rounded-lg p-2 min-w-0 shadow-sm">
                  <!-- Player Avatar -->
                  {#if gamePlayer.avatar}
                    <img 
                      src={gamePlayer.avatar} 
                      alt="{gamePlayer.name || 'Player'}'s avatar" 
                      class="w-6 h-6 rounded-full border border-gray-300 flex-shrink-0"
                    />
                  {:else}
                    <div class="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {gamePlayer.name ? gamePlayer.name.charAt(0).toUpperCase() : 'P'}
                    </div>
                  {/if}
                  
                  <!-- Player Name -->
                  <span class="text-xs font-medium text-gray-700 truncate">
                    {gamePlayer.name || 'Player'}
                    {#if gamePlayer.user_id === $player?.user_id}
                      <span class="text-green-600 font-semibold">(You)</span>
                    {/if}
                  </span>
                </div>
              {/each}
            </div>
          {:else}
            <div class="text-center text-gray-500 text-xs py-2">
              No players found
            </div>
          {/if}
        </div>

      </div>
    </div>

  </div>
</div>

<!-- Winner Modal -->
{#if showWinnerModal && winnerData}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-gradient-to-br {winnerModalGradient} rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 transform animate-pulse backdrop-blur-sm border border-white/30">
      <!-- Close button -->
      <button
        on:click={closeWinnerModal}
        class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
      >
        ×
      </button>

      <!-- UpUpGo Logo at the top -->
      <div class="text-center mb-4">
        <UpUpGoLogo size="sm" animated={true} variant="dark" />
      </div>

      <!-- Trophy and Winner Info -->
      <div class="text-center mb-6">
        <div class="text-6xl mb-4">🏆</div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">BINGO WINNER!</h2>
        
        <!-- Winner Avatar and Name -->
        <div class="flex items-center justify-center space-x-3 mb-4">
          {#if winnerData.avatar}
            <img
              src={winnerData.avatar}
              alt="Winner Avatar"
              class="w-12 h-12 rounded-full border-4 border-yellow-400 shadow-lg"
            />
          {:else}
            <div class="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg border-4 border-yellow-400 shadow-lg">
              {winnerData.name ? winnerData.name.charAt(0).toUpperCase() : 'W'}
            </div>
          {/if}
          <div class="text-xl font-bold text-gray-800">{winnerData.name || 'Anonymous'}</div>
        </div>

        <!-- Winner Amount -->
        {#if winnerData.winner_amount && winnerData.winner_amount > 0}
          <div class="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-4 mb-4 border-2 border-green-300 shadow-lg">
            <div class="text-sm text-green-700 font-semibold uppercase tracking-wide mb-1"></div>
            <div class="text-4xl font-extrabold text-green-800 flex items-center justify-center">
              💰 Birr {winnerData.winner_amount.toFixed(2)}
            </div>
          </div>
        {/if}
      </div>

      <!-- Winning Bingo Card -->
      <div class="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-4 mb-6 shadow-inner border border-white/30">
        <div class="text-center text-gray-700 font-semibold mb-3 text-sm">Winning Card</div>
        
        <!-- BINGO Header -->
        <div class="grid grid-cols-5 gap-1 mb-2">
          {#each headerLetters as l, i}
            <div class={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${headerColors[i]}`}>
              {l}
            </div>
          {/each}
        </div>

        <!-- Winner's Card Grid -->
        <div class="grid grid-cols-5 gap-1">
          {#each getWinnerGrid(winnerData.marks) as row, rowIndex}
            {#each row as num, colIndex}
              {@const isCenter = rowIndex === 2 && colIndex === 2}
              {@const isMarked = num !== 0}
              <div class={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200
                ${isMarked
                  ? (isCenter
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg border-2 border-yellow-600'
                    : 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg border-2 border-green-600'
                  )
                  : 'bg-gray-200 text-gray-400 border border-gray-300'
                }`}>
                {isCenter ? 'FREE' : (num !== 0 ? num : '')}
              </div>
            {/each}
          {/each}
        </div>
      </div>

      <!-- Play Again Button -->
      <div class="text-center">
        <button
          on:click={playAgain}
          class="bg-gradient-to-r {bingoButtonColors} text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          🎮 Play Again
        </button>
      </div>
    </div>
  </div>
{/if}