

  <script>
    import { onMount } from 'svelte';
  
    let user = {
      name: "John Doe",
      balance: 500,
      avatar: "https://via.placeholder.com/40"
    };
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
        console.log('Telegram WebApp initialized:', tg);
      };
      document.body.appendChild(script);
    });
  </script>
  
  <div class="min-h-screen bg-gray-100 flex flex-col items-center justify-between p-4">
    <!-- Top Section: User Info -->
    <div class="flex justify-between items-center bg-white p-4 rounded-lg shadow-md w-full max-w-md">
      <div class="flex items-center space-x-4">
        <img src={user.avatar} alt="User Avatar" class="w-12 h-12 rounded-full" />
        <h2 class="text-lg font-semibold">{user.name}</h2>
      </div>
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm1-5a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
        <p class="text-gray-600">${user.balance}</p>
      </div>
    </div>
  
    <!-- Middle Section: Game Types -->
    <div class="grid grid-cols-2 gap-4 w-full max-w-md">
      {#each [{amount: 10, color: 'bg-blue-500 hover:bg-blue-600'}, {amount: 20, color: 'bg-red-500 hover:bg-red-600'}, {amount: 50, color: 'bg-green-500 hover:bg-green-600'}, {amount: 100, color: 'bg-purple-500 hover:bg-purple-600'}] as game}
        <button class="{game.color} text-white font-semibold py-4 rounded-lg shadow-md hover:{game.color} transition flex items-center justify-center space-x-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm1-5a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
          <span>${game.amount} Bingo</span>
        </button>
      {/each}
    </div>
  
    <!-- Bottom Section: Continue Button -->
    <button class="bg-green-500 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-green-600 transition w-full max-w-md">
      Continue
    </button>
  </div>