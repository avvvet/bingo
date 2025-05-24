<script>
  // @ts-nocheck
  import { onMount, onDestroy } from 'svelte';
  import { playerCard } from '../../store';
  import { initSocket, socketMessage, socketConnected, gsocket } from '$lib/socket';

  // Static Game Variables (demo)
  let gameNumber = null;
  const noPlayers = 7;
  const jackpot = 4000;

  // Header letters and colors
  const headerLetters = ['B','I','N','G','O'];
  const headerColors = ['bg-red-500','bg-yellow-500','bg-green-500','bg-blue-500','bg-purple-500'];

  // Bingo draw numbers
  const bingoNumbers = Array.from({ length: 75 }, (_, i) => i + 1);

  // Player card grid (use sample if store not wired)
  let cardGrid = [];
  const sampleCardNumbers = [
    5,20,33,49,70,
    12,25,34,58,62,
    14,27,42,53,71,
    8,18,35,46,67,
    2,29,31,54,73
  ];
  const sampleCardGrid = [];
  for (let r = 0; r < 5; r++) {
    sampleCardGrid.push(sampleCardNumbers.slice(r*5, r*5 + 5));
  }

  $: if (typeof $playerCard === 'string' && $playerCard.includes(',')) {
    const nums = $playerCard.split(',').map(s => +s.trim());
    if (nums.length === 25) {
      cardGrid = [];
      for (let r = 0; r < 5; r++) {
        cardGrid.push(nums.slice(r*5, r*5 + 5));
      }
    }
  }
  $: displayGrid = cardGrid.length === 25 ? cardGrid : sampleCardGrid;

  // Called numbers
  let calledNumbers = [];
  let recentNumbers = [];
  let currentNumber = null;

  // Marks for interactive card
  let marks = new Set();
  function toggleMark(num) {
    if (marks.has(num)) marks.delete(num);
    else marks.add(num);
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

      // transform history and current number
      calledNumbers  = d.history.map(getBingoLabel);
      recentNumbers  = calledNumbers.slice(-6);
      currentNumber  = getBingoLabel(d.number);

      gameNumber = d.game_no
    }
    // ... other cases …
  }

    // …inside your <script> block…
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
      <div class="mt-1 text-2xl font-extrabold text-red-600">{gameNumber}</div>
    </div>
    <!-- Players Box -->
    <div class="flex-1 m-1 bg-white rounded-lg p-4 shadow-md text-center">
      <div class="text-sm uppercase text-gray-500">Players</div>
      <div class="mt-1 text-2xl font-extrabold text-blue-600">{noPlayers}</div>
    </div>
    <!-- Jackpot Box -->
    <div class="flex-1 m-1 bg-white rounded-lg p-4 shadow-md text-center">
      <div class="text-sm uppercase text-gray-500">Win</div>
      <div class="mt-1 text-2xl font-extrabold text-green-600">{jackpot}</div>
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
          <div class="text-center text-gray-900 font-bold mb-2">Your Bingo Card</div>
          <div class="grid grid-cols-5 gap-1 mb-1">
            {#each headerLetters as l, i}
              <div class={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${headerColors[i]}`}>{l}</div>
            {/each}
          </div>
          <div class="grid grid-cols-5 gap-1">
            {#each displayGrid as row}
              {#each row as num}
                <button
                  on:click={() => toggleMark(num)}
                  class={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition
                    ${marks.has(num) ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                >
                  {num}
                </button>
              {/each}
            {/each}
          </div>
        </div>

        <!-- Bingo Button Centered Below -->
        <div class="flex justify-center mt-2">
          <button class="w-32 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-xl shadow-md transition">BINGO!</button>
        </div>

      </div>
    </div>

  </div>
</div>