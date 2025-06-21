<script>
  // @ts-nocheck
  import { onMount } from 'svelte';
  import { player, balance } from '../../store';
  import { socketMessage, gsocket } from '$lib/socket';
  import { goto } from '$app/navigation';
  import UpUpGoLogo from '$lib/components/UpUpGoLogo.svelte';

  let transferAmount = '';
  let recipientQuery = '';
  let recipientUserId = '';
  let recipientName = '';
  let isProcessing = false;
  let isSearchingUser = false;
  let userFound = false;
  let userNotFound = false;
  
  // Clean search flow variables
  let searchTimer = null;
  const SEARCH_DELAY = 500; // ms to wait after user stops typing
  
  // Modal states
  let showModal = false;
  let modalType = 'error'; // 'success' or 'error'
  let modalTitle = '';
  let modalMessage = '';
  let modalIcon = '';

  // Protection: redirect to home if user is not logged in
  onMount(() => {
    if (!$player || !$player.user_id) {
      goto('/');
      return;
    }
    // Get initial balance when component mounts
    getBalance();
    
    // Cleanup timer on unmount
    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
        searchTimer = null;
      }
    };
  });

  $: if ($socketMessage) {
    const data = JSON.parse($socketMessage);
    handleSocketData(data);
  }

  function handleSocketData(msg) {
    if (msg.type === 'transfer-res') {
      let data = msg.data;
      isProcessing = false;

      if (data.status === "success") {
        showSuccessModal(`Transfer completed successfully! ${data.amount} Birr sent to ${recipientName}. Transaction ID: ${data.transactionId}`);
        getBalance();
        // Reset form
        transferAmount = '';
        recipientQuery = '';
        resetSearchStates();
      } else if (data.status === "insufficient-balance") {
        showErrorModal('Insufficient Balance', 'You do not have enough balance for this transfer amount.');
      } else if (data.status === "user-not-found") {
        showErrorModal('User Not Found', 'The recipient user could not be found. Please check the search query.');
      } else if (data.status === "self-transfer") {
        showErrorModal('Invalid Transfer', 'You cannot transfer funds to yourself.');
      } else {
        showErrorModal('Transfer Failed', 'Unable to process your transfer request. Please try again later or contact support.');
      }
    } else if (msg.type === 'user-search-res') {
      console.log("search comes ", msg.data)
      handleUserSearchResponse(msg.data);
    } else if (msg.type === 'balance-resp') {
      let data = msg.data;
      if (data && typeof data.balance !== 'undefined') {
        balance.set(data.balance);
      }
    }
  }

  // Clean search input handler - only manages timer
  function handleSearchInput() {
    
    // Clear existing timer
    if (searchTimer) {
      clearTimeout(searchTimer);
      searchTimer = null;
    }
    
    // Reset search states when user types
    resetSearchStates();
    
    // If query is empty, don't set timer
    const query = recipientQuery.trim();
    if (!query) {
      return;
    }
    
    // Start new timer
    searchTimer = setTimeout(() => {
      performSearch(query);
    }, SEARCH_DELAY);
  }

  // Reset all search-related states
  function resetSearchStates() {
    isSearchingUser = false;
    userFound = false;
    userNotFound = false;
    recipientUserId = '';
    recipientName = '';
  }

  // Perform the actual search
  function performSearch(query) {
    // Validate query is not empty
    
    if (!query) {
      resetSearchStates();
      return;
    }
    
    // Check if user is searching for themselves
    if (query.toLowerCase() === $player.name.toLowerCase() || 
        query === $player.user_id.toString()) {
      resetSearchStates();
      showErrorModal('Invalid Recipient', 'You cannot transfer funds to yourself.');
      return;
    }
    
    // Set searching state
    isSearchingUser = true;
    userFound = false;
    userNotFound = false;
    
    // Send search request
    const searchPayload = {
      type: 'search-user',
      data: {
        query: query
      }
    };

    if ($gsocket && $gsocket.readyState === WebSocket.OPEN) {
      $gsocket.send(JSON.stringify(searchPayload));
    } else {
      // Handle connection error
      resetSearchStates();
      showErrorModal('Connection Error', 'Unable to search. Please check your connection.');
    }
  }

  // Simple socket response handler for user search
  function handleUserSearchResponse(data) {
    // Always stop the searching spinner
    isSearchingUser = false;
    
    // Handle the response based on status
    if (data.status === "success" && data.user) {
      // User found
      userFound = true;
      userNotFound = false;
      recipientUserId = data.user.userId;
      recipientName = data.user.name;
    } else if (data.status === "not-found") {
      // User not found
      userFound = false;
      userNotFound = true;
      recipientUserId = '';
      recipientName = '';
    } else {
      // Server error or other issues
      resetSearchStates();
      if (data.status === "server-error") {
        showErrorModal('Search Error', 'Unable to search for users. Please try again.');
      }
    }
  }

  function showSuccessModal(message) {
    modalType = 'success';
    modalTitle = 'Transfer Successful!';
    modalMessage = message;
    modalIcon = 'success';
    showModal = true;
    
    // Auto-redirect after success
    setTimeout(() => {
      goto('/');
    }, 10000);
  }

  function showErrorModal(title, message) {
    modalType = 'error';
    modalTitle = title;
    modalMessage = message;
    modalIcon = 'error';
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    // Reset modal state completely
    modalType = 'error';
    modalTitle = '';
    modalMessage = '';
    modalIcon = '';
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

  async function handleTransfer() {
    const amount = parseFloat(transferAmount);
    
    if (!amount || amount <= 0) {
      showErrorModal('Invalid Amount', 'Please enter a valid transfer amount.');
      return;
    }

    if (amount > $balance) {
      showErrorModal('Insufficient Balance', 'You do not have enough balance for this transfer amount.');
      return;
    }

    if (!recipientQuery.trim()) {
      showErrorModal('Recipient Required', 'Please enter the recipient name or ID.');
      return;
    }

    if (!userFound || !recipientUserId) {
      showErrorModal('User Verification Required', 'Please search for a valid recipient first.');
      return;
    }

    isProcessing = true;
    
    const transferPayload = {
      type: 'transfer',
      data: {
        fromUserId: $player.user_id.toString(),  // Ensure string
        toUserId: recipientUserId,
        amount: amount
      }
    };

    if ($gsocket && $gsocket.readyState === WebSocket.OPEN) {
      $gsocket.send(JSON.stringify(transferPayload));
    }
  }

  function goBack() {
    goto('/');
  }

  // Preset amounts for quick selection
  const presetAmounts = [10, 25, 50, 100];

  function selectPresetAmount(amount) {
    transferAmount = amount.toString();
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-300 via-purple-300 to-indigo-300 p-6">
<div class="max-w-md mx-auto">
  
  <!-- Header -->
  <div class="flex items-center mb-1">
    <button
      on:click={goBack}
      class="bg-white/20 backdrop-blur-sm rounded-full p-3 mr-4 hover:bg-white/30 transition-all"
      aria-label="Go back to home page"
    >
      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
    </button>
    <h1 class="text-2xl font-bold text-white flex items-center">
      <span class="bg-blue-500/20 p-2 rounded-full mr-3">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
        </svg>
      </span>
      Transfer Funds
    </h1>
  </div>

  <!-- Header with Logo -->
  <div class="text-center mb-2 pt-0">
    <div class="mb-1">
      <UpUpGoLogo size="md" animated={true} variant="white" />
    </div>
  </div>

  <!-- Main Content Card -->
  <div class="bg-white rounded-3xl p-6 shadow-2xl">
    
    <!-- Available Balance -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-6 border border-blue-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600">Available Balance</p>
          <p class="text-2xl font-bold text-gray-800">Birr {$balance}</p>
        </div>
        <div class="text-4xl">💰</div>
      </div>
    </div>

    <!-- Recipient Search -->
    <div class="mb-6">
      <label for="recipient-query" class="block text-sm font-medium text-gray-700 mb-2">
        Recipient Name or ID
      </label>
      <div class="relative">
        <input
          id="recipient-query"
          type="text"
          bind:value={recipientQuery}
          on:input={handleSearchInput}
          placeholder="Enter name or user ID"
          class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          disabled={isProcessing}
        />
        <div class="absolute inset-y-0 right-0 flex items-center pr-3">
          {#if isSearchingUser}
            <svg class="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          {:else if userFound}
            <svg class="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          {:else if userNotFound}
            <svg class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          {/if}
        </div>
      </div>
      
      {#if userFound}
        <div class="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl">
          <div class="flex items-center">
            <div class="bg-green-100 rounded-full p-2 mr-3">
              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-green-800">User Found</p>
              <p class="text-xs text-green-600">{recipientName} (ID: {recipientUserId})</p>
            </div>
          </div>
        </div>
      {:else if userNotFound}
        <div class="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <div class="flex items-center">
            <div class="bg-red-100 rounded-full p-2 mr-3">
              <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-red-800">User Not Found</p>
              <p class="text-xs text-red-600">Try searching by name or user ID</p>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Search Help -->
      <div class="mt-2 text-xs text-gray-500">
        💡 You can search by name (e.g., "John") or user ID (e.g., "123456789")
      </div>
    </div>

    <!-- Quick Amount Selection -->
    <div class="mb-6">
      <h3 class="block text-sm font-medium text-gray-700 mb-3">
        Quick Amount Selection
      </h3>
      <div class="grid grid-cols-2 gap-3">
        {#each presetAmounts as amount}
          <button
            on:click={() => selectPresetAmount(amount)}
            class="p-3 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-center {transferAmount === amount.toString() ? 'border-blue-400 bg-blue-50' : ''}"
            disabled={isProcessing || amount > $balance}
            aria-label="Select {amount} Birr for transfer"
          >
            <div class="font-semibold text-gray-800">Birr {amount}</div>
            {#if amount > $balance}
              <div class="text-xs text-red-500">Insufficient</div>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <!-- Amount Input -->
    <div class="mb-6">
      <label for="transfer-amount" class="block text-sm font-medium text-gray-700 mb-2">
        Transfer Amount
      </label>
      <input
        id="transfer-amount"
        type="number"
        bind:value={transferAmount}
        placeholder="Enter amount to transfer"
        min="1"
        max={$balance}
        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
        disabled={isProcessing}
      />
      <p class="text-xs text-gray-500 mt-1">
        Minimum: Birr 1 • Maximum: Birr {$balance}
      </p>
    </div>

    <!-- Transfer Info -->
    <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
      <h3 class="font-semibold text-blue-800 mb-2 flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Transfer Information
      </h3>
      <ul class="text-sm text-blue-700 space-y-1">
        <li>• Transfers are instant and free</li>
        <li>• Search by name or user ID</li>
        <li>• Double-check recipient details</li>
        <li>• Transfers cannot be reversed</li>
        <li>• Transaction history is maintained</li>
      </ul>
    </div>

    <!-- Action Button -->
    <button
      on:click={handleTransfer}
      class="w-full px-4 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-semibold"
      disabled={isProcessing || !transferAmount || parseFloat(transferAmount) <= 0 || parseFloat(transferAmount) > $balance || !userFound || !recipientUserId}
    >
      {#if isProcessing}
        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Processing Transfer...
      {:else}
        Transfer Birr {transferAmount || '0'}
      {/if}
    </button>
  </div>
</div>
</div>

<!-- Modal Overlay -->
{#if showModal}
<div 
  class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" 
  on:click={closeModal}
  on:keydown={(e) => e.key === 'Escape' && closeModal()}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
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
      {#if modalType === 'success'}
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
      {:else}
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
      {/if}
      
      <h3 id="modal-title" class="text-xl font-bold text-gray-900 mb-2">{modalTitle}</h3>
      <p class="text-gray-600 text-sm leading-relaxed">{modalMessage}</p>
      
      {#if modalType === 'success'}
        <p class="text-xs text-green-600 mt-3">Redirecting to home in seconds...</p>
      {/if}
    </div>
    
    <!-- Modal Actions -->
    <div class="flex gap-3">
      {#if modalType === 'success'}
        <button
          on:click={() => goto('/')}
          class="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold"
        >
          Go to Home
        </button>
      {:else}
        <button
          on:click={closeModal}
          class="flex-1 px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all font-semibold"
        >
          Close
        </button>
      {/if}
    </div>
  </div>
</div>
{/if}