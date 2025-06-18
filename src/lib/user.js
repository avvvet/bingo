// @ts-nocheck
import { player, balance, game, gamePlayers, playerCard, gameType } from '../store';
import { initSocket, gsocket } from '$lib/socket';
import { goto } from '$app/navigation';
import { get } from 'svelte/store';

let tg = null;
let isInitialized = false;

/**
 * Initialize user from Telegram WebApp
 */
export const initializeUser = async () => {
  if (isInitialized) return;

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-web-app.js';
    script.async = true;

    script.onload = () => {
      try {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand(); // Optional: make sure it's full screen

        let user = {
          user_id: 2088567890000000000,
          name: 'default-user',
          avatar: 'https://via.placeholder.com/40',
          balance: 0,
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
        isInitialized = true;

        // Initialize socket after user is set
        initSocket();
        
        resolve();
      } catch (error) {
        console.error('Error initializing Telegram WebApp:', error);
        resolve(); // Still resolve to continue app flow
      }
    };

    script.onerror = () => {
      console.error('Failed to load Telegram WebApp script');
      resolve(); // Still resolve to continue app flow
    };

    document.body.appendChild(script);
  });
};

/**
 * Send initialization payload to socket
 */
export const sendInitPayload = () => {
  const currentPlayer = get(player);
  
  if (!currentPlayer?.user_id) {
    console.error('No player data available for init payload');
    return;
  }

  const initPayload = {
    type: 'init',
    data: {
      user_id: currentPlayer.user_id,
      name: currentPlayer.name,
      phone: currentPlayer.phone,
      email: currentPlayer.email,
      avatar: currentPlayer.avatar,
    },
  };

  if (get(gsocket)?.readyState === WebSocket.OPEN) {
    get(gsocket).send(JSON.stringify(initPayload));
  }
};

/**
 * Get user balance
 */
export const getBalance = () => {
  const currentPlayer = get(player);
  
  if (!currentPlayer?.user_id) {
    console.error('No player data available for balance request');
    return;
  }

  const payload = {
    type: 'get-balance',
    data: {
      userId: currentPlayer.user_id,
    }
  };

  if (get(gsocket)?.readyState === WebSocket.OPEN) {
    get(gsocket).send(JSON.stringify(payload));
  }
};

/**
 * Check for active game
 */
export const checkActiveGame = () => {
  const currentPlayer = get(player);
  
  if (!currentPlayer?.user_id) {
    console.error('No player data available for active game check');
    return;
  }

  const activeGamePayload = {
    type: 'check-active-game',
    data: {
      user_id: currentPlayer.user_id,
    },
  };

  if (get(gsocket)?.readyState === WebSocket.OPEN) {
    get(gsocket).send(JSON.stringify(activeGamePayload));
  }
};

/**
 * Helper function to get player count
 */
const getPlayerCount = (players) => (Array.isArray(players) ? players.length : 0);

/**
 * Handle user-related socket messages
 * @param {Object} msg - Socket message
 * @returns {boolean} - Whether the message was handled
 */
export const handleUserSocketMessage = (msg) => {
  switch (msg.type) {
    case 'init-response':
      const data = msg.data;
      const currentPlayer = get(player);
      
      const updatedUser = {
        user_id: data.user_id,
        name: data.name,
        balance: data.balance,
        avatar: data.avatar || currentPlayer.avatar,
        email: currentPlayer.email,
        phone: currentPlayer.phone,
      };

      player.set(updatedUser);

      // Auto-request balance and check active game after init
      setTimeout(() => {
        checkActiveGame();
        getBalance();
      }, 700);
      
      return true;

    case 'balance-resp':
      const balanceData = msg.data;
      if (balanceData && typeof balanceData.balance !== 'undefined') {
        balance.set(balanceData.balance);
      }
      return true;

    case 'check-active-game-response':
      
      const gameData = msg.data;
      game.set({
        gameId: gameData.game.id,
        gameNumber: gameData.game.game_no,
        noPlayers: getPlayerCount(gameData.players),
        jackpot: 800
      });

      gamePlayers.set(gameData.players);
      playerCard.set(gameData.card);
      gameType.set(gameData.gtype)   // we know which game type

      // Navigate to active game
      goto('/play');
      return true;

    default:
      return false; // Message not handled by user service
  }
};

/**
 * Get current user data
 * @returns {Object} Current player data
 */
export const getCurrentUser = () => {
  return get(player);
};

/**
 * Check if user is initialized
 * @returns {boolean}
 */
export const isUserInitialized = () => {
  const currentPlayer = get(player);
  return isInitialized && currentPlayer?.user_id;
};

/**
 * Get Telegram WebApp instance
 * @returns {Object|null}
 */
export const getTelegramWebApp = () => {
  return tg;
};