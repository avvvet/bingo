<script>
  // @ts-nocheck
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { playerCard, player, game, gamePlayers } from '../../store';
  import { initSocket, socketMessage, socketConnected, gsocket } from '$lib/socket';
  import { goto } from '$app/navigation';

  // Static Game Variables (demo)
  let gNum = null;  //game number
  $: gNum = $game.gameNumber;

  const noPlayers = 7;
  const jackpot = 4000;

  // Header letters and colors
  const headerLetters = ['B','I','N','G','O'];
  const headerColors = ['bg-red-500','bg-yellow-500','bg-green-500','bg-blue-500','bg-purple-500'];

  // Bingo draw numbers
  const bingoNumbers = Array.from({ length: 75 }, (_, i) => i + 1);

  
  // Called numbers
  let calledNumbers = [];
  let recentNumbers = [];
  let currentNumber = null;

  // Marks for interactive card - using array to store marked numbers
  let marks = Array(25).fill(0);
  let displayGrid = [];
  let numbers = [], grid = [];

  onMount(() => {
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
        gtype: 1,
        gameId: $game.gameId,   
        userId: $player.user_id,
        marks: [...marks]      // slice to plain array
      }
    };

    
    if ($gsocket?.readyState === WebSocket.OPEN) {
      $gsocket.send(JSON.stringify(payload));
    }
  }

  function toggleMark(num, i, j) {
    // compute flat index (0–24) from (i,j)
    const idx = j * 5 + i;

    // Check if it's the center free square
    const centerNumber = grid[2] && grid[2][2];
    const isCenter = num === centerNumber;
    
    // Don't allow unmarking the center free square
    if (isCenter && marks.includes(num)) {
      return;
    }
    
    // Only allow marking if the number has been called or it's the center free square
    const isNumberCalled = calledNumbersSet.has(num);
    
    if (!isCenter && !isNumberCalled) {
      return; // Don't allow marking if number hasn't been called
    }

    // once valid, mark the slot (never unmark)
    if (marks[idx] === 0) {
      marks[idx] = num;
    }
  }


  let interval;

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
    // Update the set of called numbers for quick lookup
    calledNumbersSet = new Set(calledNumbers.map(label => {
      const num = label.split('-')[1];
      return parseInt(num);
    }));
  }

  function triggerFlash() {
    isFlashing = true;
    
    // Clear any existing timeout
    if (flashTimeout) {
      clearTimeout(flashTimeout);
    }
    
    // Stop flashing after 1 second
    flashTimeout = setTimeout(() => {
      isFlashing = false;
    }, 1000);
  }

  // Check if a specific number has been called
  function isNumberCalled(number) {
    return calledNumbersSet.has(number);
  }

  onDestroy(() => {
    if (flashTimeout) {
      clearTimeout(flashTimeout);
    }
  });

  $: if ($socketMessage) {
    const data = JSON.parse($socketMessage);
    handleSocketData(data);
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
      const d = msg.data;       // already parsed object
      
      //check if this call belong to this game_id 
      if (d.game_id == $game.gameId) {
        // transform history and current number
        calledNumbers  = d.history.map(getBingoLabel);
        recentNumbers  = calledNumbers.slice(-6);
        currentNumber  = getBingoLabel(d.number);
      }
    }
    else if (msg.type === 'game-finished') {
      goto('/win', { replaceState: false, noscroll: false, keepfocus: false });
    }
    
  }
    
  const letterColorsMap = {
    B: 'bg-red-500',
    I: 'bg-yellow-500',
    N: 'bg-green-500',
    G: 'bg-blue-500',
    O: 'bg-purple-500'
  };

  function letterOf(bingoLabel) {
    return bingoLabel.split('-')[0];
  }

</script>

<!-- Root container: flex column to stack header above content -->
<div class="min-h-screen bg-gradient-to-br from-orange-300 via-pink-300 to-red-300 pl-1 pt-2 pr-1 flex flex-col items-center">
  <!-- Bright game header -->
  <div class="w-[360px] mb-1 flex justify-between">
    <!-- Game Number Box -->
    <div class="flex-1 m-1 bg-white rounded-lg p-4 shadow-md text-center">
      <div class="text-sm uppercase text-gray-500">Game #</div>
      <div class="mt-1 text-2xl font-extrabold text-red-600">{gNum}</div>
    </div>
    <!-- Players Box -->
    <div class="flex-1 m-1 bg-white rounded-lg p-4 shadow-md text-center">
      <div class="text-sm uppercase text-gray-500">Players</div>
      <div class="mt-1 text-2xl font-extrabold text-blue-600">{$gamePlayers.length}</div>
    </div>
    <!-- Jackpot Box -->
    <div class="flex-1 m-1 bg-white rounded-lg p-4 shadow-md text-center">
      <div class="text-sm uppercase text-gray-500">BIRR</div>
      <div class="mt-1 text-2xl font-extrabold text-green-600">{$gamePlayers.length * 10}</div>
    </div>
  </div>

  <div class="w-[360px] space-y-4">
    <!-- Panels Row -->
    <div class="flex space-x-1">

      <!-- Central Bingo Draw Panel -->
      <div class="flex-shrink-0 w-32 border-2 border-white rounded-xl pr-1 bg-white">
        <!-- Header Row -->
        <div class="grid grid-cols-5 gap-1 mb-1">
          {#each headerLetters as l, i}
            <div class={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${headerColors[i]}`}>{l}</div>
          {/each}
        </div>
        <!-- 15 Rows × 5 Columns -->
        <div class="grid grid-cols-5 gap-1">
          {#each Array(15) as _, rowIndex}
            {#each Array(5) as _, colIndex}
              {@const number = colIndex * 15 + rowIndex + 1}
              {@const isCalled = isNumberCalled(number)}
              <div class={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all duration-200 ${
                isCalled 
                  ? (isFlashing ? 'bg-yellow-400 text-black animate-pulse shadow-lg' : 'bg-green-400 text-white') 
                  : 'bg-gray-200 text-gray-800'
              }`}>
                {number}
              </div>
            {/each}
          {/each}
        </div>
      </div>

      <!-- Player Side Panel -->
      <div class="flex-1 space-y-2">
        <!-- Number Calling Panel -->
        <div class="border-2 border-red-500 h-40 rounded-xl p-2 bg-gradient-to-r from-yellow-200 to-red-300 text-black text-center">
          <div class="text-sm text-gray-400 uppercase mb-1">Current Call</div>

          {#if currentNumber}
            <div
              class={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl font-bold text-white ${
                letterColorsMap[letterOf(currentNumber)]
              }`}
            >
              {currentNumber}
            </div>
          {/if}

          <div class="flex space-x-1 overflow-x-auto mt-2">
            {#each recentNumbers as n}
              <div
                class={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  letterColorsMap[letterOf(n)]
                }`}
              >
                {n}
              </div>
            {/each}
          </div>
        </div>

        <!-- Interactive 5x5 Player Card -->
        <div class="border-2 border-green-500 rounded-xl p-2 bg-gradient-to-br from-green-200 to-green-400">
          <div class="text-center text-gray-900 font-bold mb-2">Your Bingo Card # {$playerCard.card_sn}</div>
          <div class="grid grid-cols-5 gap-1 mb-4">
            {#each headerLetters as l, i}
              <div class={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${headerColors[i]}`}>{l}</div>
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
                  class={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-200 select-none
                    ${isMarked 
                      ? (isCenter ? 'bg-black text-white shadow-md' : 'bg-black text-white shadow-md') 
                      : 'bg-white text-gray-800 border border-gray-300 active:bg-gray-200 active:scale-95 touch-manipulation'
                    }`}
                >
                  {isCenter ? 'FREE' : num}
                </button>
              {/each}
            {/each}
          </div>
        </div>

        <!-- Bingo Button Centered Below -->
        <div class="flex justify-center mt-2">
          <button on:click={() => claimBingo()} class="w-32 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-xl shadow-md transition">BINGO!</button>
        </div>

      </div>
    </div>

  </div>
</div>