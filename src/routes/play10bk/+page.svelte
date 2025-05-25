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
      const d = msg.data;
/*
    Gtype    int    `json:"gtype"`
    Gid      int    `json:"game_id"`
    PlayerId int64  `json:"player_id"`
    Name     string `json:"name"`
    Avatar   string `json:"avatar"`
    Marks    []int  `json:"marks"` /
*/

      if (d.game_id == $game.gameId) {
        // luanch a modal for winning bingo 
      }
      
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
<div class="min-h-screen bg-gradient-to-br from-orange-300 via-pink-300 to-red-300 p-1 flex flex-col">
  <!-- Bright game header -->
  <div class="w-full mb-2 flex justify-between gap-1">
    <!-- Game Number Box -->
    <div class="flex-1 bg-white rounded-lg p-2 shadow-md text-center">
      <div class="text-xs uppercase text-gray-500 font-semibold">Game #</div>
      <div class="mt-1 text-lg font-extrabold text-red-600">{gNum}</div>
    </div>
    <!-- Players Box -->
    <div class="flex-1 bg-white rounded-lg p-2 shadow-md text-center">
      <div class="text-xs uppercase text-gray-500 font-semibold">Players</div>
      <div class="mt-1 text-lg font-extrabold text-blue-600">{$gamePlayers.length}</div>
    </div>
    <!-- Jackpot Box -->
    <div class="flex-1 bg-white rounded-lg p-2 shadow-md text-center">
      <div class="text-xs uppercase text-gray-500 font-semibold">BIRR</div>
      <div class="mt-1 text-lg font-extrabold text-green-600">{$gamePlayers.length * 10}</div>
    </div>
  </div>

  <div class="flex-1 flex flex-col space-y-2">
    <!-- Panels Row -->
    <div class="flex-1 flex gap-1">

      <!-- Central Bingo Draw Panel -->
      <div class="flex-shrink-0 w-32 border-2 border-white rounded-xl p-1 bg-white">
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
              {@const isLatestCall = currentNumber && parseInt(currentNumber.split('-')[1]) === number}
              <div class={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                isLatestCall 
                  ? 'bg-red-500 text-white animate-pulse shadow-lg border-2 border-yellow-400' 
                  : isCalled 
                    ? 'bg-green-500 text-white shadow-md' 
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
        <div class="border-2 border-red-500 rounded-xl p-3 bg-gradient-to-r from-yellow-200 to-red-300 text-black text-center">
          <div class="text-xs text-gray-600 uppercase mb-2 font-semibold">Current Call</div>

          {#if currentNumber}
            <div
              class={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-xl font-extrabold text-white shadow-xl border-4 border-white transform hover:scale-105 transition-transform duration-200 ${
                letterColorsMap[letterOf(currentNumber)]
              }`}
            >
              {currentNumber}
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
        <div class="h-64 border-2 border-green-500 rounded-xl p-2 bg-gradient-to-br from-green-200 to-green-400">
          <div class="text-center text-gray-900 font-bold mb-2 text-xs">Your Bingo Card # {$playerCard.card_sn}</div>
          <div class="grid grid-cols-5 gap-1 mb-2">
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

        <!-- Bingo Button Centered Below -->
        <div class="flex justify-center">
          <button on:click={() => claimBingo()} class="w-32 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 text-sm">
            🎉 BINGO! 🎉
          </button>
        </div>

      </div>
    </div>

  </div>
</div>