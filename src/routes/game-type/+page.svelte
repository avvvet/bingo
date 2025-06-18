<script>
  // @ts-nocheck
  import { onMount, onDestroy } from 'svelte';
  import { player, game, gamePlayers, playerCard, gameType } from '../../store';
  import { socketMessage, gsocket } from '$lib/socket';
  import { goto } from '$app/navigation';
  import { 
    initializeUser, 
    isUserInitialized, 
    handleUserSocketMessage 
  } from '$lib/user';
  import UpUpGoLogo from '$lib/components/UpUpGoLogo.svelte';

  const cards = Array.from({ length: 100 }, (_, i) => i + 1);
  const startInMinutes = 0.5; // 30 seconds

  let showTooltip = false;
  let showInsufficientBalanceModal = false;
  let isLoading = true;
  let initializationError = false;
  // for count doown sync
  let lastPlayerActivity = new Date();
  let realCountdown = 30;

  onMount(async () => {
    try {
      // Check if gameType is set - redirect to home if not
      if (!$gameType) {
        console.log('No gameType set, redirecting to home');
        goto('/');
        return;
      }

      // Smart initialization: Check if already ready
      if (isUserInitialized() && $gsocket?.readyState === WebSocket.OPEN) {
        // Fast path: User and socket already ready from home page
        console.log('Fast path: User and socket already initialized');
        
        // Show UI immediately
        isLoading = false;
        
        // Get game state in background
        getWaitGame();
        
        // Show tooltip for 3 seconds
        showTooltip = true;
        const timer = setTimeout(() => (showTooltip = false), 3000);
        return () => clearTimeout(timer);
      } else {
        // Slow path: Need full initialization (refresh or direct access)
        console.log('Slow path: Initializing user and socket');
        
        // Ensure user is initialized
        await initializeUser();
        
        // Wait a moment for socket connection to establish
        await waitForSocketConnection();
        
        // Validate we have everything we need
        if (isUserInitialized() && $gsocket?.readyState === WebSocket.OPEN) {
          // Show UI
          isLoading = false;
          
          // Get current game state (will restore card if already selected)
          getWaitGame();
          
          // Show tooltip for 3 seconds
          showTooltip = true;
          const timer = setTimeout(() => (showTooltip = false), 3000);
          return () => clearTimeout(timer);
        } else {
          throw new Error('Failed to initialize user or socket connection');
        }
      }
    } catch (error) {
      console.error('Failed to initialize page:', error);
      initializationError = true;
      isLoading = false;
      
      // Redirect to home after a short delay
      setTimeout(() => {
        goto('/');
      }, 2000);
    }
  });

  // Wait for socket connection with timeout
  const waitForSocketConnection = () => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 20; // 2 seconds total
      
      const checkConnection = () => {
        if ($gsocket?.readyState === WebSocket.OPEN) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Socket connection timeout'));
        } else {
          attempts++;
          setTimeout(checkConnection, 100);
        }
      };
      
      checkConnection();
    });
  };

  const getWaitGame = () => {
    // Validate required states
    if (!$player?.user_id) {
      console.error('No user_id available for getWaitGame');
      goto('/');
      return;
    }

    if ($gsocket?.readyState !== WebSocket.OPEN) {
      console.error('Socket not connected for getWaitGame');
      goto('/');
      return;
    }

    const payload = {
      type: 'get-wait-game',
      data: { user_id: $player.user_id, gtype: $gameType},
    };
    
    console.log('Sending get-wait-game request:', payload);
    $gsocket.send(JSON.stringify(payload));
  };

  $: if ($socketMessage) {
    const data = JSON.parse($socketMessage);
    handleSocketData(data);
  }

  function handleSocketData(msg) {
    // Try user service first
    const handled = handleUserSocketMessage(msg);
    if (handled) return;

    // Handle game-specific messages
    if (msg.type == 'get-wait-game-response') {
      let d = msg.data;
      
      console.log('get-wait-game-response data:', d); // Debug logging
      
      // Safe handling of players array (could be null from backend)
      const players = d.players || [];
      
      // Set game state
      game.set({
        gameId: d.game?.id || null, 
        gameNumber: d.game?.game_no || null,
        noPlayers: getPlayerCount(players),
        jackpot: 800
      });
      
      // Set players (ensure it's always an array)
      gamePlayers.set(players);
      
      // Check if current user has a selected card by looking at players array
      const currentUser = players.find(p => p.user_id === $player.user_id);
      if (currentUser && currentUser.card_sn) {
        // User has selected a card - restore the card state without content
        // This allows showing the cancel button and proper UI state
        playerCard.set({
          card_sn: currentUser.card_sn,
          data: null, // No card content - user will see placeholder
          selected: true
        });
        console.log('Restored player card:', currentUser.card_sn);
      } else {
        playerCard.set(null);
      }
    }
    else if (msg.type === 'get-wait-game-response-broadcast') {
      let d = msg.data;
      console.log('get-wait-game-response-broadcast data:', d); // Debug logging
      
      // Safe handling of players array
      const players = d.players || [];
      lastPlayerActivity = new Date();
      gamePlayers.set(players);
      
      // IMPORTANT: Only update playerCard if the current user's card info has changed
      // Don't let other players' selections affect current player's card state
      const currentUser = players.find(p => p.user_id === $player.user_id);
      
      console.log("CURRENT USER ", currentUser)
      if (currentUser && currentUser.card_sn) {
        // Current user has a card selected - update only if different from current state
        if (!$playerCard || $playerCard.card_sn !== currentUser.card_sn) {
          playerCard.set({
            card_sn: currentUser.card_sn,
            data: currentUser.data || null,
            selected: true
          });
        }
      } else if ($playerCard) {
        // Current user no longer has a card selected (maybe cancelled by another session)
        playerCard.set(null);
      }
    }
    else if (msg.type === 'player-select-card-response') {
      let d = msg.data;
      playerCard.set(d);
    }
    else if (msg.type === 'player-cancel-card-response') {
  
      playerCard.set(null);
      grid = [];
      numbers = [];
      
      setTimeout(() => {
        getWaitGame();
      }, 100);
    }
    else if (msg.type === 'insufficient-balance-response') {
      showInsufficientBalanceModal = true;
    }
    else if (msg.type === 'game-started') {
      goto('/play', { replaceState: false, noscroll: false, keepfocus: false });
    }
  }

  const getPlayerCount = (players) => (Array.isArray(players) ? players.length : 0);

  function isCardHighlighted(card) {
    // Safe check for gamePlayers array
    if (!$gamePlayers || !Array.isArray($gamePlayers)) return false;
    return $gamePlayers.some(p => parseInt(p.card_sn) === card);
  }

  function handleCardClick(card) {
    if (!isCardHighlighted(card)) {
      selectCard(card);
    }
  }

  const selectCard = sn => {
    // Validate required states
    if (!$player?.user_id || !$game?.gameId) {
      console.error('Missing required states for card selection');
      return;
    }

    if ($gsocket?.readyState !== WebSocket.OPEN) {
      console.error('Socket not connected');
      return;
    }

    const payload = {
      type: 'player-select-card',
      data: {
        user_id: $player.user_id,
        game_id: $game.gameId,
        card_sn: sn.toString(),
        gtype: $gameType
      }
    };
    
    $gsocket.send(JSON.stringify(payload));
  };

  const cancelCardSelection = () => {
    // Validate required states
    if (!$player?.user_id || !$game?.gameId) {
      console.error('Missing required states for card cancellation');
      return;
    }

    if ($gsocket?.readyState !== WebSocket.OPEN) {
      console.error('Socket not connected');
      return;
    }

    const payload = {
      type: 'player-cancel-card',
      data: {
        user_id: $player.user_id,
        game_id: $game.gameId,
        gtype: $gameType
      }
    };
    
    $gsocket.send(JSON.stringify(payload));
  };

  // Navigation functions
  function goBack() {
    goto('/');
  }

  // Modal functions
  function closeModal() {
    showInsufficientBalanceModal = false;
  }

  function goToDeposit() {
    showInsufficientBalanceModal = false;
    goto('/deposit', { replaceState: false, noscroll: false, keepfocus: false });
  }

  // Bingo reactive grid
  let numbers = [], grid = [];
  const headerLetters = ['B','I','N','G','O'];

  $: if ($playerCard && $playerCard.data) {
    // Only show grid if we have actual card data
    numbers = $playerCard.data.split(',').map(s => s.trim()).filter(Boolean).map(n => +n);
    if (numbers.length === 25) {
      grid = [];
      for (let r = 0; r < 5; r++) {
        grid.push(numbers.slice(r*5, r*5 + 5));
      }
    } else {
      grid = [];
    }
  } else {
    // Clear grid when no card data available
    grid = [];
    numbers = [];
  }

  $: serial = $playerCard ? $playerCard.card_sn : '';

  // Get selected card number for highlighting
  $: selectedCardNumber = $playerCard ? parseInt($playerCard.card_sn) : null;

  // Show card selected state (for cancel button) even without data
  $: hasSelectedCard = $playerCard && $playerCard.card_sn;

 // Real-time countdown based on player activity
  let interval;

  function updateCountdown() {
    const now = new Date();
    const timeSinceActivity = Math.floor((now - lastPlayerActivity) / 1000);
    realCountdown = Math.max(0, 30 - timeSinceActivity);
  }

  function startCountdown() {
    clearInterval(interval);
    updateCountdown(); // Initial calculation
    interval = setInterval(updateCountdown, 1000);
  }

  function stopCountdown() { 
    clearInterval(interval); 
  }

  // Start countdown when there are players (not when you have card data)
  $: if ($gamePlayers && $gamePlayers.length > 0) {
    startCountdown();
  } else {
    stopCountdown();
  }

  onDestroy(stopCountdown);

  $: minutes = String(Math.floor(realCountdown/60)).padStart(2,'0');
  $: seconds = String(realCountdown%60).padStart(2,'0');

  // Dynamic game title and colors based on gameType
  $: gameTitle = $gameType === 10 ? 'Easy Play - ብር 10' : 
                 $gameType === 20 ? 'Normal Play - ብር 20' : 
                 $gameType === 40 ? 'Express Play - ብር 40' : 
                 $gameType === 50 ? 'Expert Play - ብር 50' : 
                 $gameType === 100 ? 'Master Play - ብር 100' : 
                 $gameType === 200 ? 'Champion Play - ብር 200' : 
                 `Game Play - Birr ${$gameType}`;

  // Dynamic background gradients based on gameType
  $: backgroundGradient = $gameType === 10 ? 'from-emerald-300 via-teal-300 to-cyan-300' :
                          $gameType === 20 ? 'from-blue-300 via-indigo-300 to-purple-300' :
                          $gameType === 40 ? 'from-purple-300 via-pink-300 to-rose-300' :
                          $gameType === 50 ? 'from-red-300 via-orange-300 to-amber-300' :
                          $gameType === 100 ? 'from-yellow-300 via-amber-300 to-orange-300' :
                          $gameType === 200 ? 'from-gray-700 via-gray-800 to-black' :
                          'from-orange-300 via-pink-300 to-red-300';

  // Dynamic accent colors for selected cards
  $: selectedCardColors = $gameType === 10 ? 'bg-emerald-500 ring-emerald-300 border-emerald-400' :
                          $gameType === 20 ? 'bg-blue-500 ring-blue-300 border-blue-400' :
                          $gameType === 40 ? 'bg-purple-500 ring-purple-300 border-purple-400' :
                          $gameType === 50 ? 'bg-red-500 ring-red-300 border-red-400' :
                          $gameType === 100 ? 'bg-yellow-500 ring-yellow-300 border-yellow-400' :
                          $gameType === 200 ? 'bg-gray-800 ring-gray-300 border-gray-400' :
                          'bg-green-500 ring-green-300 border-green-400';

  // Dynamic header stats background
  $: headerStatsGradient = $gameType === 10 ? 'from-emerald-600 to-teal-700' :
                           $gameType === 20 ? 'from-blue-600 to-indigo-700' :
                           $gameType === 40 ? 'from-purple-600 to-pink-700' :
                           $gameType === 50 ? 'from-red-600 to-orange-700' :
                           $gameType === 100 ? 'from-yellow-600 to-amber-700' :
                           $gameType === 200 ? 'from-gray-800 to-black' :
                           'from-gray-800 to-gray-900';

  // Dynamic loading spinner color
  $: spinnerColor = $gameType === 10 ? 'border-emerald-500' :
                    $gameType === 20 ? 'border-blue-500' :
                    $gameType === 40 ? 'border-purple-500' :
                    $gameType === 50 ? 'border-red-500' :
                    $gameType === 100 ? 'border-yellow-500' :
                    $gameType === 200 ? 'border-gray-600' :
                    'border-blue-500';
</script>

<div class="min-h-screen bg-gradient-to-br {backgroundGradient} p-4">
  {#if isLoading}
    <!-- Loading State -->
    <div class="flex items-center justify-center min-h-screen">
      <div class="bg-white rounded-2xl p-8 shadow-xl text-center max-w-sm mx-auto">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 {spinnerColor} mx-auto mb-4"></div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">Loading Game...</h3>
        <p class="text-gray-600 text-sm">Initializing user and connecting to game</p>
      </div>
    </div>
  {:else if initializationError}
    <!-- Error State -->
    <div class="flex items-center justify-center min-h-screen">
      <div class="bg-white rounded-2xl p-8 shadow-xl text-center max-w-sm mx-auto">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">Connection Error</h3>
        <p class="text-gray-600 text-sm mb-4">Failed to initialize game. Redirecting to home...</p>
        <div class="animate-pulse text-blue-500 text-sm">Redirecting in 2 seconds...</div>
      </div>
    </div>
  {:else}
    <!-- Main Game Interface -->
    <div class="max-w-md mx-auto">
      <!-- Header with Back Button -->
      <div class="flex items-center justify-between mb-6">
        <button
          on:click={goBack}
          class="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition-all"
          aria-label="Go back to home page"
        >
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <h1 class="text-xl font-bold text-white">{gameTitle}</h1>
        
        <!-- Spacer to center the title -->
        <div class="w-12"></div>
      </div>

      <!-- Header Stats - Dynamic Colors -->
      <div class="grid grid-cols-3 gap-2 mb-6">
        <!-- Game Number -->
        <div class="bg-gradient-to-br {headerStatsGradient} bg-opacity-80 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/20">
          <div class="text-xs text-gray-200 font-medium">Game</div>
          <div class="text-lg font-bold text-white">
            {#if $game?.gameNumber}
              {$game.gameNumber}
            {:else}
              <div class="animate-pulse bg-white/30 h-6 w-12 rounded"></div>
            {/if}
          </div>
        </div>

        <!-- Players -->
        <div class="bg-gradient-to-br {headerStatsGradient} bg-opacity-80 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/20">
          <div class="text-xs text-gray-200 font-medium">Players</div>
          <div class="text-lg font-bold text-white">
            {#if $gamePlayers}
              {$gamePlayers.length}
            {:else}
              <div class="animate-pulse bg-white/30 h-6 w-8 rounded"></div>
            {/if}
          </div>
        </div>

        <!-- Jackpot -->
        <div class="bg-gradient-to-br {headerStatsGradient} bg-opacity-80 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/20">
          <div class="text-xs text-gray-200 font-medium">BIRR</div>
          <div class="text-lg font-bold text-white">
            {#if $gamePlayers}
              {$gamePlayers.length * $gameType}
            {:else}
              <div class="animate-pulse bg-white/30 h-6 w-10 rounded"></div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Header with Logo -->
      <div class="text-center mb-6 pt-1">
        <div class="mb-3">
          <UpUpGoLogo size="md" animated={true} variant="white" />
        </div>
      </div>

      <!-- Number Selection Grid - Square Cards -->
      <div class="bg-white rounded-2xl p-4 shadow-xl mb-6 border border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-800">
            {#if !$gamePlayers || $gamePlayers.length === 0}
              Select Your Number
            {:else if hasSelectedCard && !grid.length}
              Card #{serial} Selected - Game starts in {realCountdown}s
            {:else if grid.length}
              Game starting in {realCountdown} seconds...
            {:else if realCountdown > 0}
              Waiting for players... Game starts in {realCountdown}s ({$gamePlayers.length} players)
            {:else}
              Game starting soon...
            {/if}
          </h3>
          
          <!-- Cancel Button - Show when card is selected (even without data) -->
          {#if hasSelectedCard}
            <button
              on:click={cancelCardSelection}
              class="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Cancel
            </button>
          {/if}
        </div>
        
        <div class="grid grid-cols-10 gap-1">
          {#each cards as card}
            <button
              on:click={() => handleCardClick(card)}
              disabled={hasSelectedCard}
              class="aspect-square flex items-center justify-center text-sm font-semibold rounded-lg transition-all duration-200 border-2
                     {selectedCardNumber === card
                       ? `${selectedCardColors} text-white shadow-lg transform scale-105 ring-2`
                       : isCardHighlighted(card)
                         ? 'bg-red-500 text-white shadow-lg transform scale-105 ring-2 ring-red-300 border-red-400'
                         : hasSelectedCard 
                           ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                           : 'bg-white text-gray-800 hover:bg-gray-100 hover:shadow-md active:scale-95 border-gray-300 shadow-sm cursor-pointer'}"
            >
              {card}
            </button>
          {/each}
        </div>
      </div>

      <!-- Bingo Card Display - Only show if we have actual card data -->
      {#if grid.length}
        <div class="bg-white rounded-2xl p-4 shadow-xl mb-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-lg font-bold text-gray-800">Your Bingo Card</h4>
            <span class="text-sm text-gray-600 font-medium">Card #{serial}</span>
          </div>
          
          <div class="grid grid-cols-5 gap-1 max-w-52 mx-auto shadow-2xl rounded-lg p-2 bg-white">
            <!-- BINGO Headers - Dynamic Colors -->
            {#each headerLetters as letter, i}
              <div class="w-9 h-9 flex items-center justify-center text-sm font-bold text-white rounded
                         {$gameType === 10 ? (i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-teal-500' : i === 2 ? 'bg-cyan-500' : i === 3 ? 'bg-blue-500' : 'bg-indigo-500') :
                          $gameType === 20 ? (i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-indigo-500' : i === 2 ? 'bg-purple-500' : i === 3 ? 'bg-violet-500' : 'bg-pink-500') :
                          $gameType === 40 ? (i === 0 ? 'bg-purple-500' : i === 1 ? 'bg-violet-500' : i === 2 ? 'bg-pink-500' : i === 3 ? 'bg-rose-500' : 'bg-red-500') :
                          $gameType === 50 ? (i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-500' : i === 2 ? 'bg-amber-500' : i === 3 ? 'bg-yellow-500' : 'bg-lime-500') :
                          $gameType === 100 ? (i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-amber-500' : i === 2 ? 'bg-orange-500' : i === 3 ? 'bg-red-500' : 'bg-pink-500') :
                          $gameType === 200 ? (i === 0 ? 'bg-gray-800' : i === 1 ? 'bg-gray-700' : i === 2 ? 'bg-gray-600' : i === 3 ? 'bg-gray-500' : 'bg-gray-400') :
                          (i === 0 ? 'bg-red-500' : i === 1 ? 'bg-yellow-500' : i === 2 ? 'bg-green-500' : i === 3 ? 'bg-blue-500' : 'bg-purple-500')}">
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
        </div>
      {:else if hasSelectedCard}
        <!-- Card Selected but No Data (Refresh Case) -->
        <div class="bg-white rounded-2xl p-4 shadow-xl mb-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-lg font-bold text-gray-800">Your Bingo Card</h4>
            <span class="text-sm text-gray-600 font-medium">Card #{serial}</span>
          </div>
          
          <div class="bg-gray-50 rounded-lg p-6 text-center">
            <div class="text-gray-400 text-4xl mb-2">🎯</div>
            <p class="text-gray-600 font-medium">Card Selected</p>
            <p class="text-gray-500 text-sm">Card content will load when game starts</p>
          </div>
        </div>
      {/if}

      <!-- Tooltip -->
      {#if showTooltip && !hasSelectedCard}
        <div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 animate-pulse">
          💡 Select any number from 1-100 to get your bingo card
        </div>
      {/if}


      
    </div>
  {/if}
</div>

<!-- Insufficient Balance Modal -->
{#if showInsufficientBalanceModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
      <!-- Modal Header -->
      <div class="text-center mb-4">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">Insufficient Balance</h3>
        <p class="text-gray-600">You don't have enough balance to play this game. Please deposit to continue.</p>
      </div>

      <!-- Modal Actions -->
      <div class="flex flex-col gap-3">
        <button
          on:click={goToDeposit}
          class="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Deposit Now
        </button>
        <button
          on:click={closeModal}
          class="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}