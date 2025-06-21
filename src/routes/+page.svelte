<script>
  // @ts-nocheck
  import { onMount } from 'svelte';
  import { player, balance, gameType } from '../store';
  import { socketMessage, socketConnected } from '$lib/socket';
  import { goto } from '$app/navigation';
  import { 
    initializeUser, 
    sendInitPayload, 
    handleUserSocketMessage 
  } from '$lib/user';
  import UpUpGoLogo from '$lib/components/UpUpGoLogo.svelte';

  let hasInitialized = false;
  let showUserIdModal = false; // State to control user ID modal visibility
  let copySuccess = false; // State for copy feedback

  onMount(async () => {
    // Initialize user and socket
    await initializeUser();
  });

  // Only send init payload once
  $: if ($socketConnected && !hasInitialized) {
      sendInitPayload();
      hasInitialized = true;
  }
  
  // Handle socket messages
  $: if ($socketMessage) {
    const data = JSON.parse($socketMessage);
    handleSocketData(data);
  }

  function handleSocketData(msg) {
    // Try to handle with user service first
    const handled = handleUserSocketMessage(msg);
    
    if (!handled) {
      // Handle any page-specific messages here
      console.log('Unhandled message type:', msg.type);
    }
  }

  // Show user ID modal
  function showUserId() {
    showUserIdModal = true;
  }

  // Close user ID modal
  function closeUserIdModal() {
    showUserIdModal = false;
    copySuccess = false; // Reset copy success state when closing
  }

  // Copy user ID to clipboard
  async function copyUserId() {
    try {
      await navigator.clipboard.writeText($player.user_id.toString());
      copySuccess = true;
      setTimeout(() => {
        copySuccess = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy user ID:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = $player.user_id.toString();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      copySuccess = true;
      setTimeout(() => {
        copySuccess = false;
      }, 2000);
    }
  }

  function goToDeposit() {
    goto('/deposit');
  }

  function goToTransfer() {
    goto('/transfer');
  }

  function goToWithdraw() {
    goto('/withdraw');
  }

  function selectGame(gameFee) {
    // Set the game type in store (using fee as gameType)
    gameType.set(gameFee);
    // Route to the game page
    goto('/game-type');
  }

  const gameTypes = [
    {
      fee: 10,
      title: "Easy Play",
      subtitle: "Birr 10 Entry",
      bgColor: "from-emerald-400 to-teal-500",
      textColor: "text-white",
      icon: "⚡",
      description: "Fast-paced games"
    },
    {
      fee: 20,
      title: "Normal",
      subtitle: "Birr 20 Entry", 
      bgColor: "from-blue-400 to-indigo-500",
      textColor: "text-white",
      icon: "🎯",
      description: "Traditional bingo"
    },
    {
      fee: 40,
      title: "Express",
      subtitle: "Birr 40 Entry", 
      bgColor: "from-purple-400 to-pink-500",
      textColor: "text-white",
      icon: "💎",
      description: "High stakes play"
    },
    {
      fee: 50,
      title: "Expert",
      subtitle: "Birr 50 Entry", 
      bgColor: "from-red-400 to-orange-500",
      textColor: "text-white",
      icon: "🔥",
      description: "Expert level"
    },
    {
      fee: 100,
      title: "Master",
      subtitle: "Birr 100 Entry", 
      bgColor: "from-yellow-400 to-amber-500",
      textColor: "text-white",
      icon: "👑",
      description: "Ultimate challenge"
    },
    {
      fee: 200,
      title: "Champion",
      subtitle: "Birr 200 Entry", 
      bgColor: "from-gray-800 to-black",
      textColor: "text-white",
      icon: "🏆",
      description: "For Champions only"
    }
  ];
</script>

<div class="min-h-screen bg-gradient-to-br from-orange-300 via-pink-300 to-rose-300 p-4 flex flex-col">
  <div class="max-w-6xl mx-auto flex-1 flex flex-col">

    <!-- Header with Logo - Moved to top -->
    <div class="text-center pt-1 pb-2">
      <div class="mb-1">
        <UpUpGoLogo size="xl" animated={true} variant="white" />
      </div>
    </div>
    
    <!-- User Info Card -->
    <div class="bg-white/20 backdrop-blur-md rounded-2xl p-3 mb-4 border border-white/30">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="relative">
            <img
              src={$player.avatar}
              alt="Avatar"
              class="w-12 h-12 rounded-full border-3 border-white/50 shadow-lg"
            />
            <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h3 class="text-white font-semibold text-lg">{$player.name}</h3>
            <div class="flex items-center space-x-2">
              <p class="text-white/70 text-sm">Active Player</p>
              <!-- User ID Button -->
              <button
                on:click={showUserId}
                class="text-white/60 hover:text-white/90 transition-colors text-xs bg-white/10 hover:bg-white/20 rounded-full px-2 py-1 flex items-center space-x-1"
                title="Show User ID"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/>
                </svg>
                <span>ID</span>
              </button>
            </div>
          </div>
        </div>
        <div class="text-right">
          <div class="flex items-center space-x-2 bg-white/20 rounded-full px-3 py-2">
            <span class="text-xl">💰</span>
            <span class="text-white font-bold">ብር {$balance}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Copy Success Toast -->
    {#if copySuccess}
      <div class="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-bounce">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        <span class="text-sm font-medium">User ID copied!</span>
      </div>
    {/if}

    <!-- User ID Modal -->
    {#if showUserIdModal}
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" 
        on:click={closeUserIdModal}
        on:keydown={(e) => e.key === 'Escape' && closeUserIdModal()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-id-modal-title"
        tabindex="-1"
      >
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div 
          class="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl" 
          on:click|stopPropagation
          on:keydown|stopPropagation
        >
          
          <!-- Modal Header -->
          <div class="text-center mb-6">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <svg class="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/>
              </svg>
            </div>
            
            <h3 id="user-id-modal-title" class="text-xl font-bold text-gray-900 mb-2">Your User ID</h3>
            <p class="text-gray-600 text-sm leading-relaxed">Share this ID with others to receive transfers</p>
          </div>
          
          <!-- User ID Display -->
          <div class="bg-gray-50 rounded-xl p-4 mb-6 border-2 border-dashed border-gray-200">
            <div class="text-center">
              <p class="text-xs text-gray-500 mb-1">User ID</p>
              <p class="text-2xl font-mono font-bold text-gray-800 tracking-wider">{$player.user_id}</p>
            </div>
          </div>
          
          <!-- Modal Actions -->
          <div class="flex gap-3">
            <button
              on:click={copyUserId}
              class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold flex items-center justify-center space-x-2"
            >
              {#if copySuccess}
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Copied!</span>
              {:else}
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                <span>Copy ID</span>
              {/if}
            </button>
            
            <button
              on:click={closeUserIdModal}
              class="flex-1 px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all font-semibold"
            >
              Close
            </button>
          </div>
          
          <!-- Additional Info -->
          <div class="mt-4 text-center">
            <p class="text-xs text-gray-500">💡 Others can send you money using this ID</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Wallet Actions -->
    <div class="grid grid-cols-3 gap-2 mb-6">
      <button
        on:click={goToDeposit}
        class="bg-gradient-to-r from-green-400 to-green-600 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center space-y-1"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
        <span class="font-semibold text-sm">Deposit</span>
      </button>
      
      <button
        on:click={goToTransfer}
        class="bg-gradient-to-r from-blue-400 to-purple-500 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center space-y-1"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
        </svg>
        <span class="font-semibold text-sm">Transfer</span>
      </button>
      
      <button
        on:click={goToWithdraw}
        class="bg-gradient-to-r from-orange-400 to-red-500 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center space-y-1"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
        </svg>
        <span class="font-semibold text-sm">Withdraw</span>
      </button>
    </div>

    <!-- Game Selection Grid - Flex-1 to take available space -->
    <div class="flex-1 flex items-start">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
        {#each gameTypes as game}
          <button
            on:click={() => selectGame(game.fee)}
            class="group relative overflow-hidden bg-gradient-to-br {game.bgColor} p-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-white/20 aspect-square flex flex-col justify-between"
          >
            <!-- Background Pattern -->
            <div class="absolute inset-0 opacity-10">
              <div class="absolute top-2 right-2 text-3xl opacity-20">{game.icon}</div>
              <div class="absolute bottom-2 left-2 w-8 h-8 bg-white/10 rounded-full"></div>
            </div>

            <!-- Content -->
            <div class="relative z-10 text-left flex flex-col justify-between h-full">
              <div class="flex items-center justify-between mb-2">
                <div class="text-2xl">{game.icon}</div>
                <div class="bg-white/20 rounded-full px-2 py-1">
                  <span class="text-white text-xs font-medium">Fee</span>
                </div>
              </div>
              
              <div class="flex-1 flex flex-col justify-center">
                <h3 class="text-lg font-bold {game.textColor} mb-1 leading-tight">{game.title}</h3>
                <div class="relative mb-1">
                  <p class="text-white font-black text-2xl bg-gradient-to-r from-yellow-300 via-white to-yellow-300 bg-clip-text text-transparent drop-shadow-lg transform hover:scale-105 transition-transform duration-200">
                    ብር {game.fee}
                  </p>
                  <div class="absolute inset-0 text-white/20 font-black text-2xl transform translate-x-0.5 translate-y-0.5 -z-10">
                    ብር {game.fee}
                  </div>
                </div>
                <p class="text-white/70 text-xs">{game.description}</p>
              </div>
              
              <div class="flex items-center justify-between mt-2">
                <div class="flex items-center space-x-1 text-white/80">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span class="text-xs">Live</span>
                </div>
                
                <div class="bg-white/20 rounded-full p-1 group-hover:bg-white/30 transition-colors">
                  <svg class="w-3 h-3 text-white transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Hover Effect -->
            <div class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        {/each}
      </div>
    </div>

<!-- Footer with Logo and Copyright -->
<div class="flex justify-center pt-6 pb-3">
  <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-xs w-full mx-4 text-center border border-white/20">
    <div class="mb-2">
      <UpUpGoLogo size="sm" animated={false} variant="white" />
    </div>
    <div class="space-y-0.5">
      <p class="text-white/80 text-xs leading-tight">
        © 2025 UpUpGo. "We shall not all sleep, but we shall all be changed, in the twinkling of an eye."
      </p>
      <p class="text-white/60 text-xs italic">
        1 Cor 15:51
      </p>
      <p class="text-white/70 text-xs flex items-center justify-center gap-1">
        God bless America 🇺🇸
      </p>
    </div>
  </div>
</div>

  </div>
</div>