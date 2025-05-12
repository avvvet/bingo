<script>
  // @ts-nocheck
  import { onMount } from 'svelte';
  import { socketService, player } from '../store';
  import { goto } from '$app/navigation';
  
  let port = 22201;
  const socketUrl = `ws://localhost:${port}/v1/ws`;
  
  let tg;
  
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
        user_id: 1234567890000000000,
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
  
    initializeSocketService();
  });
  
  async function initializeSocketService() {
    const socket = new WebSocket(socketUrl);
    socketService.set(socket);
  }
  
  $: if ($socketService) {
    $socketService.onopen = async () => {
      console.log('Connected to socket server');
  
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
  
      $socketService.send(JSON.stringify(initPayload));
    };
  
    $socketService.onmessage = (message) => {
      const data = JSON.parse(message.data);
      handleSocketData(data);
    };
  
    $socketService.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  
    $socketService.onclose = () => {
      console.log('Disconnected from signaling server');
    };
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
    } else if (data.type === 'error') {
      console.error('Error from socket service:', data.message);
    }
  }
  </script>
  
  <div
    class="min-h-screen bg-gradient-to-br from-blue-100 via-white to-gray-100 flex flex-col items-center justify-between p-4"
  >
    <!-- Top Section: User Info -->
    <div
      class="flex justify-between items-center bg-white p-4 rounded-lg shadow-md w-full max-w-md mt-2"
    >
      <div class="flex items-center space-x-4">
        <img
          src={$player.avatar}
          alt="User Avatar"
          class="w-12 h-12 rounded-full"
        />
        <h2 class="text-lg font-semibold">{$player.name}</h2>
      </div>
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm1-5a1 1 0 11-2 0 1 1 0 012 0z"
          />
        </svg>
        <p class="text-gray-600">Birr {$player.balance}</p>
      </div>
    </div>
  
<!-- Middle Section: Game Types -->
<div class="grid grid-cols-2 gap-4 w-full max-w-md">
  <!-- Game 10 (Yellow Theme) -->
  <button
    on:click={() => goto("/game10")}
    class="bg-blue-500 hover:bg-blue-600 text-white font-semibold p-4 rounded-lg shadow-md transition flex items-center justify-center space-x-2 aspect-square border-2 border-blue-800"
  >
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm1-5a1 1 0 11-2 0 1 1 0 012 0z"
      />
    </svg>
    <span>Birr 10 Bingo</span>
  </button>

  <!-- Game 20 (Green Theme) -->
  <button
    on:click={() => goto("/game20")}
    class="bg-green-500 hover:bg-green-600 text-green-800 font-semibold p-4 rounded-lg shadow-md transition flex items-center justify-center space-x-2 aspect-square border-2 border-green-700"
  >
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm1-5a1 1 0 11-2 0 1 1 0 012 0z"
      />
    </svg>
    <span>Birr 20 Bingo</span>
  </button>

  <!-- Game 40 (Orange Theme) -->
  <button
    on:click={() => goto("/game40")}
    class="bg-orange-500 hover:bg-orange-600 text-orange-800 font-semibold p-4 rounded-lg shadow-md transition flex items-center justify-center space-x-2 aspect-square border-2 border-orange-700"
  >
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm1-5a1 1 0 11-2 0 1 1 0 012 0z"
      />
    </svg>
    <span>Birr 40 Bingo</span>
  </button>

  <!-- Game 50 (Purple Theme) -->
  <button
    on:click={() => goto("/game50")}
    class="bg-yellow-100 hover:bg-yellow-200 text-white font-semibold p-4 rounded-lg shadow-md transition flex items-center justify-center space-x-2 aspect-square border-2 border-yellow-800 bg-yellow-500"
  >
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm1-5a1 1 0 11-2 0 1 1 0 012 0z"
      />
    </svg>
    <span>Birr 50 Bingo</span>
  </button>
</div>

  
    <!-- Bottom Section: Continue Button -->
    <button
      class="bg-green-500 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-green-600 transition w-full max-w-md mb-3"
    >
      Continue
    </button>
  </div>