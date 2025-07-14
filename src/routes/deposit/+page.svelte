<script>
  // @ts-nocheck
  import { onMount } from 'svelte';
  import { player, balance } from '../../store';
  import { socketMessage, gsocket } from '$lib/socket';
  import { goto } from '$app/navigation';
  import UpUpGoLogo from '$lib/components/UpUpGoLogo.svelte';
  import { PUBLIC_CBE_ACCOUNT, PUBLIC_TELEBIRR_ACCOUNT } from '$env/static/public';

  let depositReference = '';
  let isProcessing = false;
  let selectedPaymentMethod = 'cbe'; // 'cbe' or 'telebirr'
  
  // Modal states
  let showSuccessModal = false;
  let showErrorModal = false;
  let modalMessage = '';
  let modalTitle = '';

  onMount(() => {
    if (!$player?.user_id) {
      goto('/');
    }
  });

  $: if ($socketMessage) {
    const data = JSON.parse($socketMessage);
    handleSocketData(data);
  }

  function handleSocketData(msg) {
    if (msg.type === 'deposite-res') {
      let data = msg.data;
      isProcessing = false;
      console.log('Deposit response:', data);
      
      if (data.status === "success") {
        modalTitle = 'Deposit Successful!';
        modalMessage = data.message || 'Your account has been credited successfully. You will be redirected to the home page.';
        showSuccessModal = true;
        // Auto-redirect after success
        setTimeout(() => {
          showSuccessModal = false;
          goto('/');
        }, 3000);
        getBalance();
      } else {
        // Handle all error cases
        const errorMessages = {
          'duplicate': 'This reference number has already been used for a deposit. Please use a different reference number.',
          'invalid-reference': 'The reference number you entered is invalid. Please check the reference from your confirmation SMS and try again.',
          'invalid-receiver': 'Payment was not made to the correct account. Please verify the account details and try again.',
          'invalid-request': 'Invalid request. Please refresh the page and try again.',
          'server-error': 'A server error occurred. Please try again in a few moments.'
        };
        
        modalTitle = 'Deposit Failed';
        modalMessage = data.message || errorMessages[data.status] || 'An unexpected error occurred. Please try again.';
        showErrorModal = true;
      }
    } else if (msg.type === 'balance-resp') {
      let data = msg.data;
      if (data && typeof data.balance !== 'undefined') {
        balance.set(data.balance);
      }
    }
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

  async function handleDeposit() {
    if (!depositReference.trim()) {
      modalTitle = 'Missing Reference';
      modalMessage = 'Please enter the payment reference number from your confirmation SMS.';
      showErrorModal = true;
      return;
    }

    isProcessing = true;
    
    const depositPayload = {
      type: 'deposite',
      data: {
        userId: $player.user_id,
        referenceNumber: depositReference.trim(),
        paymentMethod: selectedPaymentMethod // cbe or telebirr
      }
    };

    if ($gsocket && $gsocket.readyState === WebSocket.OPEN) {
      $gsocket.send(JSON.stringify(depositPayload));
    }
  }

  function closeSuccessModal() {
    showSuccessModal = false;
    goto('/');
  }

  function closeErrorModal() {
    showErrorModal = false;
  }

  function goBack() {
    goto('/');
  }

  function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    depositReference = ''; // Clear reference when switching methods
  }
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
        <span class="bg-green-500/20 p-2 rounded-full mr-3">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
        </span>
        Deposit Funds
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
      
      <!-- Current Balance -->
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-6 border border-blue-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Current Balance</p>
            <p class="text-2xl font-bold text-gray-800">Birr {$balance}</p>
          </div>
          <div class="text-4xl">💰</div>
        </div>
      </div>

      <!-- Payment Method Selection -->
      <div class="mb-6">
        <h3 class="font-semibold text-gray-800 mb-3 flex items-center">
          <span class="text-blue-600 mr-2">💳</span>
          Choose Payment Method
        </h3>
        
        <div class="grid grid-cols-2 gap-3">
          <!-- CBE Option -->
          <button
            on:click={() => selectPaymentMethod('cbe')}
            class="relative p-4 rounded-xl border-2 transition-all {selectedPaymentMethod === 'cbe' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}"
          >
            <div class="flex flex-col items-center">
              <img 
                src="https://www.cbeib.com.et/ARCIB-4/modelbank/unprotected/assets/cbe.png"
                alt="CBE" 
                class="w-10 h-10 rounded-full border border-gray-200 mb-2"
              />
              <span class="text-sm font-medium text-gray-700">CBE Bank</span>
            </div>
            {#if selectedPaymentMethod === 'cbe'}
              <div class="absolute top-2 right-2">
                <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
              </div>
            {/if}
          </button>

          <!-- Telebirr Option -->
          <button
            on:click={() => selectPaymentMethod('telebirr')}
            class="relative p-4 rounded-xl border-2 transition-all {selectedPaymentMethod === 'telebirr' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'}"
          >
            <div class="flex flex-col items-center">
              <img 
                src="https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/a2/b7/5b/a2b75b03-c780-148a-2e78-865885e07fc6/AppIcon-0-0-1x_U007emarketing-0-7-0-0-85-220.png/512x512bb.jpg"
                alt="Telebirr" 
                class="w-10 h-10 rounded-full border border-gray-200 mb-2"
              />
              <span class="text-sm font-medium text-gray-700">Telebirr</span>
            </div>
            {#if selectedPaymentMethod === 'telebirr'}
              <div class="absolute top-2 right-2">
                <svg class="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
              </div>
            {/if}
          </button>
        </div>
      </div>

      <!-- Payment Instructions -->
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-6 border border-blue-200">
        <h3 class="font-semibold text-gray-800 mb-3 flex items-center">
          <span class="text-blue-600 mr-2">📱</span>
          {#if selectedPaymentMethod === 'cbe'}
            ወደዚህ ቁጥር ይክፈሉ
          {:else}
            Send Money to Telebirr
          {/if}
        </h3>
        
        <div class="space-y-3">
          {#if selectedPaymentMethod === 'cbe'}
            <div class="flex items-center justify-between bg-white/60 rounded-lg p-3">
              <div class="flex items-center">
                <img 
                  src="https://www.cbeib.com.et/ARCIB-4/modelbank/unprotected/assets/cbe.png"
                  alt="CBE" 
                  class="w-12 h-12 rounded-full border-1 border-white shadow-lg"
                />
                <div class="ml-3">
                  <p class="font-medium text-gray-800">CBE Bank</p>
                  <p class="text-sm text-gray-600">{PUBLIC_CBE_ACCOUNT}</p>
                </div>
              </div>
            </div>
          {:else}
            <div class="flex items-center justify-between bg-white/60 rounded-lg p-3">
              <div class="flex items-center">
                <img 
                  src="https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/a2/b7/5b/a2b75b03-c780-148a-2e78-865885e07fc6/AppIcon-0-0-1x_U007emarketing-0-7-0-0-85-220.png/512x512bb.jpg"
                  alt="Telebirr" 
                  class="w-12 h-12 rounded-full border-1 border-white shadow-lg"
                />
                <div class="ml-3">
                  <p class="font-medium text-gray-800">Telebirr</p>
                  <p class="text-sm text-gray-600">{PUBLIC_TELEBIRR_ACCOUNT}</p>
                </div>
              </div>
            </div>
          {/if}
          
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p class="text-sm text-amber-800">
              <span class="font-semibold">📋 ማስታወሻ:</span> 
              {#if selectedPaymentMethod === 'cbe'}
                ገቢ ካደረጉ በኅላ የደረሶትን የባንክ ማረጋገጫ አጭር መልዕክት ወይም የያዘውን URL ይቅዱና እዚህ ይለጥፉ
              {:else}
                After sending money via Telebirr, copy and paste your transaction confirmation SMS message here
              {/if}
            </p>
          </div>
        </div>
      </div>

      <!-- Message Input -->
      <div class="mb-6">
        <label for="deposit-message" class="block text-sm font-medium text-gray-700 mb-2">
          {#if selectedPaymentMethod === 'cbe'}
            Bank Confirmation SMS Message - Copy and paste
          {:else}
            Telebirr Confirmation SMS Message - Copy and paste
          {/if}
        </label>
        <textarea
          id="deposit-message"
          bind:value={depositReference}
          placeholder="{selectedPaymentMethod === 'cbe' ? 'Paste your complete bank confirmation SMS message here...' : 'Paste your complete Telebirr confirmation SMS message here...'}"
          class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm min-h-[120px] resize-none"
          disabled={isProcessing}
          rows="6"
        ></textarea>
        <p class="text-xs text-gray-500 mt-2">
          📝 You can remove your balance from the SMS message or only just send the transaction URL
        </p>
      </div>

      <!-- Action Button -->
      <button
        on:click={handleDeposit}
        class="w-full px-4 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-semibold"
        disabled={isProcessing || !depositReference.trim()}
      >
        {#if isProcessing}
          <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        {:else}
          Complete Deposit
        {/if}
      </button>
    </div>
  </div>
</div>

<!-- Success Modal -->
{#if showSuccessModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl transform transition-all">
      <!-- Modal Header -->
      <div class="text-center mb-4">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">{modalTitle}</h3>
        <p class="text-gray-600 text-sm mb-4">{modalMessage}</p>
        <div class="flex items-center justify-center text-green-600 text-sm">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Redirecting in 3 seconds...
        </div>
      </div>

      <!-- Modal Actions -->
      <div class="flex flex-col gap-3">
        <button
          on:click={closeSuccessModal}
          class="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Go to Home Now
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Error Modal -->
{#if showErrorModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl transform transition-all">
      <!-- Modal Header -->
      <div class="text-center mb-4">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">{modalTitle}</h3>
        <p class="text-gray-600 text-sm">{modalMessage}</p>
      </div>

      <!-- Modal Actions -->
      <div class="flex flex-col gap-3">
        <button
          on:click={closeErrorModal}
          class="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
{/if}