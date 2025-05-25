<script>
    import { onMount } from 'svelte';
    
    let showConfetti = false;
    let showWinText = false;
    let showButtons = false;
    let playerName = "Player";
    let score = 2500;
    let winType = "FULL HOUSE";
    let totalPlayers = 156;
    let prizeAmount = "$500";
    let avatarUrl = ""//"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face"; // Placeholder avatar
    
    onMount(() => {
      // Stagger animations
      setTimeout(() => showConfetti = true, 100);
      setTimeout(() => showWinText = true, 500);
      setTimeout(() => showButtons = true, 1500);
    });
    
    function playAgain() {
      // Add your play again logic here
      console.log("Play Again clicked");
    }
    
    function shareWin() {
      // Add your share logic here
      console.log("Share clicked");
    }
    
    function goHome() {
      // Add your home navigation logic here
      console.log("Home clicked");
    }
  </script>
  
  <div class="relative w-screen h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
    <!-- Animated Background -->
    <div class="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 opacity-70 animate-pulse"></div>
    
    <!-- Additional Background Effects -->
    <div class="absolute inset-0 bg-gradient-radial from-transparent via-purple-500/20 to-black/40"></div>
    <div class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,215,0,0.1),transparent_50%)]"></div>
    <div class="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.15),transparent_50%)]"></div>
    
    <!-- Confetti Animation -->
    {#if showConfetti}
      <div class="absolute inset-0 pointer-events-none z-10">
        {#each Array(50) as _, i}
          <div 
            class="absolute w-3 h-3 rounded-sm animate-bounce"
            style="
              left: {Math.random() * 100}%; 
              top: {Math.random() * 100}%;
              animation-delay: {Math.random() * 3}s; 
              animation-duration: {2 + Math.random() * 2}s;
              background-color: {['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)]};
            "
          ></div>
        {/each}
      </div>
    {/if}
    
    <!-- Main Content -->
    <div class="relative z-20 text-center px-6 max-w-sm w-full">
      <!-- Trophy Icon -->
      <div class="relative mb-8">
        <div class="text-8xl animate-bounce drop-shadow-2xl">🏆</div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-400 rounded-full opacity-30 animate-ping"></div>
      </div>
      
      <!-- Win Text -->
      {#if showWinText}
        <div class="mb-8 transform transition-all duration-1000 translate-y-0 opacity-100">
          <h1 class="text-6xl font-black text-yellow-400 mb-4 drop-shadow-lg animate-pulse">
            BINGO!
          </h1>
          <p class="text-xl text-white font-bold mb-6 drop-shadow-md">
            🎉 Congratulations! 🎉
          </p>
          
          <div class="relative bg-gradient-to-r from-pink-500 to-cyan-500 rounded-2xl p-4 shadow-2xl border-4 border-white border-opacity-50 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-500 opacity-20 animate-pulse"></div>
            <div class="relative z-10">
              <!-- Winner Avatar -->
              <div class="flex justify-center mb-2">
                <img 
                  src={avatarUrl} 
                  alt="" 
                  class="w-12 h-12 rounded-full border-2 border-white shadow-lg object-cover"
                />
              </div>
              <p class="text-xl font-bold text-white mb-1 drop-shadow-sm">{playerName}</p>
              <p class="text-sm text-yellow-300 font-semibold">{winType}</p>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Score Display -->
      {#if showWinText}
        <div class="mb-10 transform transition-all duration-1000 delay-300 translate-y-0 opacity-100">
          <div class="relative bg-gradient-to-r from-pink-500 to-cyan-500 rounded-3xl p-6 shadow-2xl border-4 border-white border-opacity-50 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-500 opacity-20 animate-pulse"></div>
            <div class="relative z-10">
              <div class="text-sm text-white font-bold mb-2 uppercase tracking-wider">Your Score</div>
              <div class="text-4xl font-black text-white mb-2 drop-shadow-lg">{score.toLocaleString()}</div>
              <div class="text-2xl">💰</div>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Action Buttons -->
      {#if showButtons}
        <div class="space-y-4 transform transition-all duration-1000 delay-600 translate-y-0 opacity-100">
          <button 
            class="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-8 rounded-full shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300 flex items-center justify-center space-x-3 text-lg border-2 border-white border-opacity-30"
            on:click={playAgain}
          >
            <span class="text-2xl">🎮</span>
            <span>Play Again</span>
          </button>
          
          <div class="flex space-x-4">
            <button 
              class="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-800 font-bold py-3 px-6 rounded-full shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-2 border-2 border-white border-opacity-30"
              on:click={shareWin}
            >
              <span class="text-xl">📱</span>
              <span>Share</span>
            </button>
            <button 
              class="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-800 font-bold py-3 px-6 rounded-full shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-2 border-2 border-white border-opacity-30"
              on:click={goHome}
            >
              <span class="text-xl">🏠</span>
              <span>Home</span>
            </button>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Floating Stars -->
    <div class="absolute inset-0 pointer-events-none z-10">
      {#each Array(20) as _, i}
        <div 
          class="absolute text-2xl animate-pulse"
          style="
            left: {Math.random() * 100}%; 
            top: {Math.random() * 100}%; 
            animation-delay: {Math.random() * 4}s;
            animation-duration: {2 + Math.random() * 2}s;
          "
        >⭐</div>
      {/each}
    </div>
    
    <!-- Particle Effects -->
    <div class="absolute inset-0 pointer-events-none z-5">
      {#each Array(30) as _, i}
        <div 
          class="absolute w-2 h-2 bg-white rounded-full opacity-60 animate-ping"
          style="
            left: {Math.random() * 100}%; 
            top: {Math.random() * 100}%; 
            animation-delay: {Math.random() * 5}s;
            animation-duration: {1 + Math.random() * 3}s;
          "
        ></div>
      {/each}
    </div>
  </div>
  
  <style>
    :global(body) {
      margin: 0;
      padding: 0;
      font-family: 'Arial', sans-serif;
      overflow: hidden;
    }
    
    /* Custom animations for enhanced effects */
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }
    
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
      50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.8); }
    }
    
    /* Initial hidden state for animations */
    .transform.transition-all.duration-1000:not(.translate-y-0) {
      transform: translateY(30px);
      opacity: 0;
    }
  </style>