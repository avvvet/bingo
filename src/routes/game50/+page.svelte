<script>
    const cards = Array.from({ length: 100 }, (_, i) => i + 1);
    const gameNumber = 102;
    const users = 7;
    const jackpot = "4000";
    const startInMinutes = 3;
  </script>
  
  <div class="min-h-screen bg-yellow-100 p-4">
    <!-- Top Section with Emojis and Values -->
    <div class="flex justify-between items-center bg-white border-2 border-red-800 rounded-xl p-4 shadow mb-6 text-red-800">
      <!-- Game Number (🟠) -->
      <div class="flex items-center">
        <span class="text-lg mr-2">🟠</span>
        <span class="text-lg">{gameNumber}</span>
      </div>
  
      <!-- Users (👤) -->
      <div class="flex items-center">
        <span class="text-lg mr-2">👤</span>
        <span class="text-lg">{users}</span>
      </div>
  
      <!-- Jackpot (💰) -->
      <div class="flex items-center">
        <span class="text-lg mr-2">💰</span>
        <span class="text-lg">{jackpot}</span>
      </div>
  
      <!-- Timer (⏱️) -->
      <div class="flex items-center">
        <span class="text-lg mr-2">⏱️</span>
        <span class="text-lg">{startInMinutes}min</span>
      </div>
    </div>
  
    <!-- Cards Section -->
    <div class="grid grid-cols-10 gap-2 justify-center">
      {#each cards as card}
        <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-500 border-2 border-red-800 text-xs sm:text-sm font-bold text-red-800 flex items-center justify-center">
          {card}
        </div>
      {/each}
    </div>

  <!-- Go to Game Button with Right Arrow Icon -->
  <div class="absolute bottom-10 left-1/2 transform -translate-x-1/2">
    <button

      class="bg-red-800 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-red-700 transition-colors flex items-center"
    >
      <span class="mr-2">Go to game</span>
      <!-- Right Arrow Icon -->
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 5l7 7-7 7-1.5-1.5L13 13H3v-2h10l-3.5-3.5L10 5z" />
      </svg>
    </button>
  </div>
  </div>
  