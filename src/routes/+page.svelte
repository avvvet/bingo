<script>
  // @ts-nocheck
  import { onMount } from 'svelte';
  import { socketService, player } from '../store';
  import { initSocket, socketMessage, socketConnected, gsocket } from '$lib/socket';
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
    } 
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
    /*
    {
      id: 40,
      title: "Premium",
      subtitle: "Birr 50 Entry",
      route: "/game40", 
      bgColor: "from-amber-400 to-orange-500",
      textColor: "text-white",
      icon: "💎",
      description: "High stakes play"
    },
    {
      id: 50,
      title: "Elite",
      subtitle: "Birr 100 Entry",
      route: "/game50",
      bgColor: "from-purple-400 to-pink-500", 
      textColor: "text-white",
      icon: "👑",
      description: "Ultimate challenge"
    }
      */
  ];
</script>

<div class="min-h-screen bg-gradient-to-br from-orange-300 via-pink-300 to-rose-300 p-6">
  <!-- Header Section -->
  <div class="max-w-4xl mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-white mb-2 drop-shadow-lg">Bingo</h1>
     <!-- <p class="text-white/80 text-lg">Choose your game mode and start playing!</p> -->
    </div>

    <!-- User Info Card -->
    <div class="bg-white/20 backdrop-blur-md rounded-2xl p-4 mb-8 border border-white/30">
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
            <span class="text-white font-bold">Birr {$player.balance}</span>
          </div>
        </div>
      </div>
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