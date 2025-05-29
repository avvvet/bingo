<script>
  // @ts-nocheck
  import { onMount } from 'svelte';
  import { socketService, player, balance } from '../store';
  import { initSocket, socketMessage, socketConnected, gsocket } from '$lib/socket';
  import { goto } from '$app/navigation';
  
  let port = 22201;
  const socketUrl = `ws://localhost:${port}/v1/ws`;
  
  let tg;
  
  // Modal states
  let showDepositModal = false;
  let showWithdrawModal = false;
  let depositReference = '';
  let withdrawAmount = '';
  let isProcessing = false;
  
  // Notification states
  let depositStatus = null; // 'success', 'error', or null
  let depositMessage = '';
  
  onMount(() => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-web-app.js';
    script.async = true;
  
    script.onload = () => {
      // @ts-ignore
      tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand(); // Optional: make sure it's full screen
  
      let user = {
        user_id: 4088567890000000000,
        name: 'default-user',
        avatar: 'https://via.placeholder.com/40',
        balance: 0, // Initialize balance to avoid undefined
        email: null,
        phone: null,
      };
  
      if (tg.initDataUnsafe?.user) {
        user.user_id = tg.initDataUnsafe.user.id;
        user.name = tg.initDataUnsafe.user.first_name + (tg.initDataUnsafe.user.last_name ? ' ' + tg.initDataUnsafe.user.last_name : '');
        user.avatar = tg.initDataUnsafe.user.photo_url || user.avatar;
        user.email = tg.initDataUnsafe.user.email || null;
        user.phone = tg.initDataUnsafe.user.phone || null;
      }
  
      player.set(user);
    };
  
    document.body.appendChild(script);
  
    initSocket();
    
  });
  

  $: if ($socketConnected) {
    const initPayload = {
        type: 'init',
        data: {
          user_id: $player.user_id,
          name: $player.name,
          phone: $player.phone,
          email: $player.email,
          avatar: $player.avatar,
        },
    };
    if ($gsocket && $gsocket.readyState === WebSocket.OPEN) {
      $gsocket.send(JSON.stringify(initPayload));
    }

  }
  
  $: if ($socketMessage) {
    const data = JSON.parse($socketMessage);
    handleSocketData(data);
  }

  async function getBalance() {
    const payload = {
      type: 'get-balance',
      data: {
        userId: $player.user_id,
      }
    };

    
    if ($gsocket?.readyState === WebSocket.OPEN) {
      $gsocket.send(JSON.stringify(payload));
    }
  }

  function handleSocketDataOld(msg) {
  if (msg.type === 'init-response') {
    let data = msg.data
    let user = {
      user_id: data.user_id,
      name: data.name,
      balance: data.balance, 
      avatar: data.avatar || $player.avatar, 
      email: $player.email,
      phone: $player.phone,
    };
   
    player.set(user);
    
    setTimeout(() => {
      getBalance();
    }, 700);
  } else if (msg.type === 'deposite-res') {
    let data = msg.data;
    
    // Only process if we're actually in a deposit flow
    if (!showDepositModal) return;
    
    isProcessing = false;
    
    console.log('Deposit response:', data); // Debug log
    
    // Handle response based on exact status from server
    if (data.status === "success") {
      depositStatus = 'success';
      depositMessage = 'Deposit successful! Your account has been credited.';
      
      // Update balance immediately
      getBalance();
      
      // Auto-close modal after showing success for 2 seconds
      setTimeout(() => {
        closeDepositModal();
      }, 2000);
      
    } else if (data.status === "duplicate") {
      depositStatus = 'error';
      depositMessage = 'This reference number has already been used for a deposit.';
      
    } else {
      // Handle all other cases as invalid reference
      depositStatus = 'error';
      depositMessage = 'Invalid reference number. Please check and try again.';
    }
    
  } else if (msg.type === 'balance-resp') {
    let data = msg.data;
    if (data && typeof data.balance !== 'undefined') {
      balance.set(data.balance);
    }
  }
}
  
  function handleSocketData(msg) {
    if (msg.type === 'init-response') {
      let data = msg.data
      let user = {
        user_id: data.user_id,
        name: data.name,
        balance: data.balance, 
        avatar: data.avatar || $player.avatar, 
        email: $player.email,
        phone: $player.phone,
      };
     
      player.set(user);
      
      setTimeout(() => {
        getBalance();
      }, 700);
    } else if (msg.type === 'deposite-res') {
      let data = msg.data
      isProcessing = false;
      
      console.log('Deposit response:', data); // Debug log

      if (data.status == "success") {
        depositStatus = 'success';
        depositMessage = 'Deposit successful! Your account has been credited.';
       
        setTimeout(() => {
          closeDepositModal();
        }, 2000);

        getBalance()


      } else if (data.status == "duplicate") {
        depositStatus = 'error';
        depositMessage = 'This reference number has already been used for a deposit.';
      } else {
        depositStatus = 'error';
        depositMessage = 'Invalid reference number. Please check and try again.';
      }
    } else if (msg.type === 'balance-resp') {
      
      let data = msg.data
      if (data && typeof data.balance !== 'undefined') {
        balance.set(data.balance);
      }
    }

  }

  // Modal functions
  function openDepositModal() {
    showDepositModal = true;
    depositReference = '';
    depositStatus = null;
    depositMessage = '';
  }

  function closeDepositModal() {
    showDepositModal = false;
    depositReference = '';
    isProcessing = false;
    depositStatus = null;
    depositMessage = '';
  }

  function openWithdrawModal() {
    showWithdrawModal = true;
    withdrawAmount = '';
  }

  function closeWithdrawModal() {
    showWithdrawModal = false;
    withdrawAmount = '';
    isProcessing = false;
  }

  async function handleDeposit() {
    if (!depositReference.trim()) {
      depositStatus = 'error';
      depositMessage = 'Please enter the payment reference number.';
      return;
    }

    isProcessing = true;
    depositStatus = null;
    depositMessage = '';
    
    // Send deposit request through socket
    const depositPayload = {
      type: 'deposite',
      data: {
        userId: $player.user_id,
        referenceNumber: depositReference.trim()
      }
    };

    if ($gsocket && $gsocket.readyState === WebSocket.OPEN) {
      $gsocket.send(JSON.stringify(depositPayload));
    }
  }

  async function handleWithdraw() {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      alert('Please enter a valid withdrawal amount');
      return;
    }

    if (amount > $player.balance) {
      alert('Insufficient balance');
      return;
    }

    isProcessing = true;
    
    // Send withdraw request through socket
    const withdrawPayload = {
      type: 'withdraw',
      data: {
        user_id: $player.user_id,
        amount: amount
      }
    };

    if ($gsocket && $gsocket.readyState === WebSocket.OPEN) {
      $gsocket.send(JSON.stringify(withdrawPayload));
    }

    // Simulate processing delay
    setTimeout(() => {
      closeWithdrawModal();
      // You can add success/error handling here based on server response
    }, 2000);
  }

  const gameTypes = [
    {
      id: 10,
      title: "Quick Play",
      subtitle: "Birr 10 Entry",
      route: "/game10",
      bgColor: "from-emerald-400 to-teal-500",
      textColor: "text-white",
      icon: "⚡",
      description: "Fast-paced games"
    },
    {
      id: 20,
      title: "Classic",
      subtitle: "Birr 20 Entry", 
      route: "/game20",
      bgColor: "from-blue-400 to-indigo-500",
      textColor: "text-white",
      icon: "🎯",
      description: "Traditional bingo"
    }
  ];
</script>

<div class="min-h-screen bg-gradient-to-br from-orange-300 via-pink-300 to-rose-300 p-6">
  <!-- Header Section -->
  <div class="max-w-4xl mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-white mb-2 drop-shadow-lg">Bingo</h1>
    </div>

    <!-- User Info Card -->
    <div class="bg-white/20 backdrop-blur-md rounded-2xl p-4 mb-6 border border-white/30">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="relative">
            <img
              src={$player.avatar}
              alt="Avatar"
              class="w-14 h-14 rounded-full border-3 border-white/50 shadow-lg"
            />
            <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h3 class="text-white font-semibold text-lg">{$player.name}</h3>
            <p class="text-white/70 text-sm">Active Player</p>
          </div>
        </div>
        <div class="text-right">
          <div class="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2">
            <span class="text-2xl">💰</span>
            <span class="text-white font-bold">Birr {$balance} </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Wallet Actions -->
    <div class="grid grid-cols-2 gap-4 mb-8">
      <button
        on:click={openDepositModal}
        class="bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
        <span class="font-semibold text-lg">Deposit</span>
      </button>
      
      <button
        on:click={openWithdrawModal}
        class="bg-gradient-to-r from-orange-400 to-red-500 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
        </svg>
        <span class="font-semibold text-lg">Withdraw</span>
      </button>
    </div>

    <!-- Game Selection Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {#each gameTypes as game}
        <button
          on:click={() => goto(game.route)}
          class="group relative overflow-hidden bg-gradient-to-br {game.bgColor} p-6 rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-white/20"
        >
          <!-- Background Pattern -->
          <div class="absolute inset-0 opacity-10">
            <div class="absolute top-4 right-4 text-6xl opacity-20">{game.icon}</div>
            <div class="absolute bottom-4 left-4 w-20 h-20 bg-white/10 rounded-full"></div>
            <div class="absolute top-1/2 left-1/2 w-32 h-32 bg-white/5 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>

          <!-- Content -->
          <div class="relative z-10 text-left">
            <div class="flex items-center justify-between mb-4">
              <div class="text-4xl">{game.icon}</div>
              <div class="bg-white/20 rounded-full px-3 py-1">
                <span class="text-white text-xs font-medium">Entry Fee</span>
              </div>
            </div>
            
            <h3 class="text-2xl font-bold {game.textColor} mb-2">{game.title}</h3>
            <p class="text-white/90 text-lg font-semibold mb-2">{game.subtitle}</p>
            <p class="text-white/70 text-sm mb-4">{game.description}</p>
            
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2 text-white/80">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-sm">Available Now</span>
              </div>
              
              <div class="bg-white/20 rounded-full p-2 group-hover:bg-white/30 transition-colors">
                <svg class="w-5 h-5 text-white transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
</div>

<!-- Deposit Modal -->
{#if showDepositModal}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
      <!-- Modal Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-800 flex items-center">
          <span class="bg-green-100 p-2 rounded-full mr-3">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
          </span>
          Deposit Funds
        </h2>
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button
          on:click={closeDepositModal}
          class="text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isProcessing}
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Status Notification -->
      {#if depositStatus}
        <div class="mb-6 p-4 rounded-xl border-l-4 {depositStatus === 'success' ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              {#if depositStatus === 'success'}
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              {:else}
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              {/if}
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium {depositStatus === 'success' ? 'text-green-800' : 'text-red-800'}">
                {depositStatus === 'success' ? 'Success!' : 'Error'}
              </h3>
              <p class="text-sm {depositStatus === 'success' ? 'text-green-700' : 'text-red-700'}">
                {depositMessage}
              </p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Payment Instructions -->
      {#if !depositStatus || depositStatus === 'error'}
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-6 border border-blue-200">
          <h3 class="font-semibold text-gray-800 mb-3 flex items-center">
            <span class="text-blue-600 mr-2">📱</span>
            ወደዚህ ቁጥር ይክፈሉ  
          </h3>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between bg-white/60 rounded-lg p-3">
              <div class="flex items-center">
                
                  
                  <img 
                    src="https://www.cbeib.com.et/ARCIB-4/modelbank/unprotected/assets/cbe.png"
                    alt="CBE" 
                    class="w-12 h-12 rounded-full border-1 border-white shadow-lg"
                  />
                
                <div>
                  <p class="font-medium text-gray-800">CBE</p>
                  <p class="text-sm text-gray-600">100000000000</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-bold text-xl text-blue-600"></p>
              </div>
            </div>
            
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p class="text-sm text-amber-800">
                <span class="font-semibold">📋 ማስታወሻ:</span> ገቢ ካደረጉ በኅላ የደረሶትን የባንክ ማረጋገጫ አጭር መልዕክት ላይ ያለውን መለያ ቁጥር እዚህ ያስገቡ፡ ለምሳሌ FT25176A8PWA43123455
              </p>
            </div>
          </div>
        </div>

        <!-- Reference Input -->
        <div class="mb-6">
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Payment Reference Number
          </label>
          <input
            type="text"
            bind:value={depositReference}
            placeholder="Enter reference from confirmation text"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            disabled={isProcessing}
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-3">
          <button
            on:click={closeDepositModal}
            class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            on:click={handleDeposit}
            class="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={isProcessing || !depositReference.trim()}
          >
            {#if isProcessing}
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            {:else}
              Complete Deposit
            {/if}
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- Withdraw Modal -->
{#if showWithdrawModal}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
      <!-- Modal Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-800 flex items-center">
          <span class="bg-orange-100 p-2 rounded-full mr-3">
            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
            </svg>
          </span>
          Withdraw Funds
        </h2>
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button
          on:click={closeWithdrawModal}
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Balance Info -->
      <div class="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 mb-6 border border-orange-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Available Balance</p>
            <p class="text-2xl font-bold text-gray-800">Birr {$player.balance}</p>
          </div>
          <div class="text-4xl">💰</div>
        </div>
      </div>

      <!-- Amount Input -->
      <div class="mb-6">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Withdrawal Amount
        </label>
        <input
          type="number"
          bind:value={withdrawAmount}
          placeholder="Enter amount to withdraw"
          min="1"
          max={$player.balance}
          class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          disabled={isProcessing}
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex space-x-3">
        <button
          on:click={closeWithdrawModal}
          class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          on:click={handleWithdraw}
          class="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
        >
          {#if isProcessing}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          {:else}
            Withdraw Funds
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}