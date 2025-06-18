<script>
  // @ts-nocheck
  import { onMount } from 'svelte';
  import { player, balance } from '../../store';
  import { socketMessage, gsocket } from '$lib/socket';
  import { goto } from '$app/navigation';
  import UpUpGoLogo from '$lib/components/UpUpGoLogo.svelte';

  let withdrawAmount = '';
  let accountType = 'cbe'; // Default to CBE
  let accountNo = '';
  let accountName = '';
  let isProcessing = false;
  
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
  });

  $: if ($socketMessage) {
    const data = JSON.parse($socketMessage);
    handleSocketData(data);
  }

  function handleSocketData(msg) {
    if (msg.type === 'withdrawal-res') {
      let data = msg.data;
      isProcessing = false;

      if (data.status === "success") {
        showSuccessModal(`Withdrawal request submitted successfully! Request ID: ${data.withdrawalId}. Funds will be processed within 1 hours.`);
        getBalance();
      } else if (data.status === "insufficient-balance") {
        showErrorModal('Insufficient Balance', 'You do not have enough balance for this withdrawal amount.');
      } else if (data.status === "pending-request-exists") {
        showErrorModal('Pending Request Exists', 'You already have a pending withdrawal request. Please wait for it to be processed before submitting a new one.');
      } else {
        showErrorModal('Withdrawal Failed', 'Unable to process your withdrawal request. Please try again later or contact support.');
      }
    } else if (msg.type === 'balance-resp') {
      let data = msg.data;
      if (data && typeof data.balance !== 'undefined') {
        balance.set(data.balance);
      }
    }
  }

  function showSuccessModal(message) {
    modalType = 'success';
    modalTitle = 'Success!';
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

  async function handleWithdraw() {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      showErrorModal('Invalid Amount', 'Please enter a valid withdrawal amount.');
      return;
    }

    if (amount > $balance) {
      showErrorModal('Insufficient Balance', 'You do not have enough balance for this withdrawal amount.');
      return;
    }

    if (!accountNo.trim()) {
      showErrorModal('Account Number Required', 'Please enter your account number.');
      return;
    }

    if (!accountName.trim()) {
      showErrorModal('Account Name Required', 'Please enter the account holder name.');
      return;
    }

    isProcessing = true;
    
    const withdrawPayload = {
      type: 'withdrawal',
      data: {
        userId: $player.user_id,
        amount: amount,
        accountType: accountType,
        accountNo: accountNo.trim(),
        name: accountName.trim()
      }
    };

    if ($gsocket && $gsocket.readyState === WebSocket.OPEN) {
      $gsocket.send(JSON.stringify(withdrawPayload));
    }
  }

  function goBack() {
    goto('/');
  }

  // Preset amounts for quick selection
  const presetAmounts = [50, 100, 200, 500];

  function selectPresetAmount(amount) {
    withdrawAmount = amount.toString();
  }

  // Account types
  const accountTypes = [
    { value: 'cbe', label: 'Commercial Bank of Ethiopia (CBE)' },
    { value: 'abyssinia', label: 'Abyssinia Bank' },
    { value: 'telebirr', label: 'TeleBirr' }
  ];
</script>

<div class="min-h-screen bg-gradient-to-br from-orange-300 via-pink-300 to-rose-300 p-6">
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
        <span class="bg-orange-500/20 p-2 rounded-full mr-3">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
          </svg>
        </span>
        Withdraw Funds
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
      <div class="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 mb-6 border border-orange-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Available Balance</p>
            <p class="text-2xl font-bold text-gray-800">Birr {$balance}</p>
          </div>
          <div class="text-4xl">💰</div>
        </div>
      </div>

      <!-- Account Type Selection -->
      <div class="mb-6">
        <label for="account-type" class="block text-sm font-medium text-gray-700 mb-2">
          Bank/Payment Method
        </label>
        <select
          id="account-type"
          bind:value={accountType}
          class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          disabled={isProcessing}
        >
          {#each accountTypes as type}
            <option value={type.value}>{type.label}</option>
          {/each}
        </select>
      </div>

      <!-- Account Number -->
      <div class="mb-6">
        <label for="account-no" class="block text-sm font-medium text-gray-700 mb-2">
          Account Number
        </label>
        <input
          id="account-no"
          type="text"
          bind:value={accountNo}
          placeholder="Enter your account number"
          class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          disabled={isProcessing}
        />
      </div>

      <!-- Account Holder Name -->
      <div class="mb-6">
        <label for="account-name" class="block text-sm font-medium text-gray-700 mb-2">
          Account Holder Name
        </label>
        <input
          id="account-name"
          type="text"
          bind:value={accountName}
          placeholder="Enter full name as registered"
          class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          disabled={isProcessing}
        />
      </div>

      <!-- Quick Amount Selection -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-3">
          Quick Amount Selection
        </label>
        <div class="grid grid-cols-2 gap-3">
          {#each presetAmounts as amount}
            <button
              on:click={() => selectPresetAmount(amount)}
              class="p-3 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all text-center {withdrawAmount === amount.toString() ? 'border-orange-400 bg-orange-50' : ''}"
              disabled={isProcessing || amount > $balance}
              aria-label="Select {amount} Birr for withdrawal"
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
        <label for="withdraw-amount" class="block text-sm font-medium text-gray-700 mb-2">
          Withdrawal Amount
        </label>
        <input
          id="withdraw-amount"
          type="number"
          bind:value={withdrawAmount}
          placeholder="Enter amount to withdraw"
          min="1"
          max={$balance}
          class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-lg"
          disabled={isProcessing}
        />
        <p class="text-xs text-gray-500 mt-1">
          Minimum: Birr 1 • Maximum: Birr {$balance}
        </p>
      </div>

      <!-- Withdrawal Info -->
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
        <h3 class="font-semibold text-amber-800 mb-2 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Withdrawal Information
        </h3>
        <ul class="text-sm text-amber-700 space-y-1">
          <li>• Processing time: 1 hours</li>
          <li>• No withdrawal fees</li>
          <li>• Only one withdrawal request allowed at a time</li>
          <li>• Ensure account details are correct</li>
          <li>• Contact support for any issues</li>
        </ul>
      </div>

      <!-- Action Button -->
      <button
        on:click={handleWithdraw}
        class="w-full px-4 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-semibold"
        disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > $balance || !accountNo.trim() || !accountName.trim()}
      >
        {#if isProcessing}
          <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        {:else}
          Withdraw Birr {withdrawAmount || '0'}
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