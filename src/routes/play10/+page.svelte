<script>
    // @ts-nocheck
    import { onMount, onDestroy } from 'svelte';
    import { playerCard } from '../../store';
  
    // Static Game Variables (demo)
    const gameNumber = 10;
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
    onMount(() => {
      interval = setInterval(() => {
        if (calledNumbers.length < 75) {
          const next = calledNumbers.length + 1;
          calledNumbers = [...calledNumbers, next];
          recentNumbers = calledNumbers.slice(-6, -1);
          currentNumber = next;
        }
      }, 3000);
    });
    onDestroy(() => clearInterval(interval));
  </script>
  
  <!-- Root container: flex column to stack header above content -->
  <div class="min-h-screen bg-gradient-to-br from-orange-300 via-pink-300 to-red-300 p-4 flex flex-col items-center">
    <!-- Bright game header -->
    <div class="w-[360px] mb-6 flex justify-between">
      <!-- Game Number Box -->
      <div class="flex-1 mx-1 bg-white rounded-lg p-4 shadow-md text-center">
        <div class="text-sm uppercase text-gray-500">Game Number</div>
        <div class="mt-1 text-2xl font-extrabold text-red-600">{gameNumber}</div>
      </div>
      <!-- Players Box -->
      <div class="flex-1 mx-1 bg-white rounded-lg p-4 shadow-md text-center">
        <div class="text-sm uppercase text-gray-500">Players</div>
        <div class="mt-1 text-2xl font-extrabold text-blue-600">{noPlayers}</div>
      </div>
      <!-- Jackpot Box -->
      <div class="flex-1 mx-1 bg-white rounded-lg p-4 shadow-md text-center">
        <div class="text-sm uppercase text-gray-500">Jackpot</div>
        <div class="mt-1 text-2xl font-extrabold text-green-600">${jackpot}</div>
      </div>
    </div>
  
    <div class="w-[360px] space-y-4">
      <!-- Panels Row -->
      <div class="flex space-x-1">
  
        <!-- Central Bingo Draw Panel -->
        <div class="flex-shrink-0 w-32 border-2 border-white rounded-xl p-3 bg-white">
          <div class="text-center mb-1 text-gray-800 font-bold">Bingo Draw</div>
          <div class="grid grid-cols-5 gap-1">
            {#each headerLetters as l, i}
              <div class={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${headerColors[i]}`}>{l}</div>
            {/each}
            {#each bingoNumbers as num}
              <div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-800">{num}</div>
            {/each}
          </div>
        </div>
  
        <!-- Player Side Panel -->
        <div class="flex-1 space-y-2">
          <!-- Number Calling Panel -->
          <div class="border-2 border-red-500 rounded-xl p-2 bg-gradient-to-r from-yellow-200 to-red-300 text-black text-center">
            <div class="text-sm text-gray-400 uppercase mb-1">Current Call</div>
            <div class="w-12 h-12 mx-auto rounded-full bg-yellow-500 flex items-center justify-center text-xl font-bold text-black">{currentNumber}</div>
            <div class="flex space-x-1 overflow-x-auto mt-2">
              {#each recentNumbers as n}
                <div class="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold text-black">{n}</div>
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
        </div>
      </div>
  
      <!-- Bingo Button Centered Below -->
      <div class="flex justify-center mt-2">
        <button class="w-32 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-xl shadow-md transition">BINGO!</button>
      </div>
    </div>
  </div>
  